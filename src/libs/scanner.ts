import { ethers } from 'ethers';
import axios from 'axios';
import { MAINNETS, TESTNETS, ERC20_ABI } from './constants';
import { TokenBalance, Networks, NFTBalance, NetworkConfig } from './types';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const RETRY_DELAY = 2000;
const MAX_RETRIES = 5;
const CHUNK_SIZE = 50;
const DELAY_BETWEEN_REQUESTS = 1000; // 1 секунда между запросами
const COINGECKO_PROXY_URL = 'https://api.coingecko.com/api/v3';
const PRICE_CACHE_DURATION = 5 * 60 * 1000; // 5 минут

interface CoinGeckoResponse {
    image: {
        small: string;
        large: string;
        thumb: string;
    };
}

interface PriceCacheItem {
    price: number;
    timestamp: number;
}

export class MultiChainWalletScanner {
    private privateKey: string;
    private providers: { [key: string]: ethers.Provider };
    private wallets: { [key: string]: ethers.Wallet };
    private networks: Networks;
    private tokenIdMapCache: { [symbol: string]: string } | null = null;
    private lastApiCall: number = 0;
    private tokenImageCache: { [symbol: string]: string } = {};
    private lastRequestTime: { [network: string]: number } = {};
    private priceCache: { [symbol: string]: PriceCacheItem } = {};

    private getCurrentNetworks(): Networks {
        const isTestnet = localStorage.getItem('isTestnet') === 'true';
        const baseNetworks = isTestnet ? TESTNETS : MAINNETS;
        
        // Получаем пользовательские сети
        const storedCustomNetworks = localStorage.getItem('customNetworks');
        const customNetworks = storedCustomNetworks ? JSON.parse(storedCustomNetworks) : {};
        
        // Фильтруем сети в зависимости от режима (testnet/mainnet)
        const filteredCustomNetworks = Object.entries(customNetworks)
            .filter(([_, network]) => {
                const chainId = (network as NetworkConfig).chainId;
                return isTestnet ? chainId > 0 && chainId < 1000000 : chainId >= 1000000;
            })
            .reduce((acc, [key, network]) => ({ ...acc, [key]: network }), {});

        // Объединяем базовые и пользовательские сети
        return {
            ...baseNetworks,
            ...filteredCustomNetworks
        };
    }

    constructor(
        privateKey: string,
        networks: Networks = MAINNETS
    ) {
        this.privateKey = privateKey;
        localStorage.removeItem('networks');

        const storedNetworks = localStorage.getItem('networks');
        const isTestnet = localStorage.getItem('isTestnet') === 'true';

        if (storedNetworks) {
            this.networks = JSON.parse(storedNetworks);
        } else {
            this.networks = this.getCurrentNetworks();
            localStorage.setItem('networks', JSON.stringify(this.networks));
        }

        this.providers = {};
        this.wallets = {};

        // console.log('Constructor networks:', this.networks);
    }

    private async initializeNetworks(): Promise<void> {
        for (const [networkId, networkConfig] of Object.entries(this.networks)) {
            try {
                // console.log(`Initializing network ${networkConfig.rpc}`);
                const provider = new ethers.JsonRpcProvider(networkConfig.rpc, {
                    chainId: networkConfig.chainId,
                    name: networkConfig.name
                });

                try {
                    const networkPromise = Promise.race([
                        provider.ready,
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error('Network initialization timeout')), 10000)
                        )
                    ]);

                    await networkPromise;

                    const network = await provider.getNetwork();
                    if (network.chainId !== BigInt(networkConfig.chainId)) {
                        throw new Error(`Network ${networkId} chainId mismatch`);
                    }

                    const wallet = new ethers.Wallet(this.privateKey, provider);

                    this.providers[networkId] = provider;
                    this.wallets[networkId] = wallet;

                } catch (error) {
                    console.error(`Error connecting to network ${networkId}:`, error);
                }
            } catch (error) {
                console.error(`Error initializing network ${networkId}:`, error);
            }
        }
    }

    private async waitForRateLimit(networkId: string): Promise<void> {
        const now = Date.now();
        const lastRequest = this.lastRequestTime[networkId] || 0;
        const timeSinceLastRequest = now - lastRequest;
        
        if (timeSinceLastRequest < DELAY_BETWEEN_REQUESTS) {
            await new Promise(resolve => 
                setTimeout(resolve, DELAY_BETWEEN_REQUESTS - timeSinceLastRequest)
            );
        }
        
        this.lastRequestTime[networkId] = Date.now();
    }

    private async retryRequest<T>(
        networkId: string,
        request: () => Promise<T>,
        retries: number = MAX_RETRIES
    ): Promise<T> {
        try {
            await this.waitForRateLimit(networkId);
            return await request();
        } catch (error: any) {
            if (retries > 0 && (error.status === 429 || error.code === 'RATE_LIMIT')) {
                // console.log(`Rate limit hit for ${networkId}, retrying in ${DELAY_BETWEEN_REQUESTS}ms...`);
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
                return this.retryRequest(networkId, request, retries - 1);
            }
            throw error;
        }
    }

    private async isValidContract(provider: ethers.Provider, address: string): Promise<boolean> {
        try {
            const code = await provider.getCode(address);
            return code !== '0x' && code.length > 2;
        } catch {
            return false;
        }
    }

    private async isERC20Contract(contract: ethers.Contract): Promise<boolean> {
        try {
            await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals()
            ]);
            return true;
        } catch {
            return false;
        }
    }

    private async isLegitToken(
        contract: ethers.Contract,
        balance: string,
        symbol: string,
        name: string
    ): Promise<boolean> {
        try {
            const suspiciousPatterns = [
                'ADDRESS',
                'TRON',
                'PANTOS',
                'TEST',
                'FAKE',
                'SCAM',
                'VANITY',
                'PAN',
                'VOID',
                'DEMO'
            ];

            const upperSymbol = symbol.toUpperCase();
            const upperName = name.toUpperCase();

            if (suspiciousPatterns.some(pattern =>
                upperSymbol.includes(pattern) ||
                upperName.includes(pattern)
            )) {
                return false;
            }

            const balanceNumber = parseFloat(balance);
            if (balanceNumber > 10000) {
                return false;
            }

            if (symbol.length > 10) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }

    async getTokenBalancesForNetwork(networkId: string): Promise<TokenBalance[]> {
        await this.ensureNetworksInitialized();

        const network = this.networks[networkId];
        const wallet = this.wallets[networkId];
        const provider = this.providers[networkId];

        if (!wallet || !provider) {
            console.error(`Network ${networkId} not properly initialized`);
            return [];
        }

        try {
            const walletAddress = wallet.address;

            // Получаем баланс нативного токена
            const nativeBalance = await this.retryRequest(networkId, () =>
                provider.getBalance(walletAddress)
            );
            const nativeBalanceFormatted = ethers.formatEther(nativeBalance);

            // Инициализируем массив с нативным токеном
            const tokenBalances: TokenBalance[] = [{
                symbol: network.symbol,
                name: network.name,
                balance: nativeBalanceFormatted,
                address: 'native',
                decimals: 18,
                network: networkId,
                networkName: network.name
            }];

            // Проверяем наличие сканера для сети
            if (network.scanner && network.scannerKey) {
                try {
                    // console.log(`Scanning network ${networkId} for tokens...`);
                    const tokensResponse = await axios.get(network.scanner, {
                        params: {
                            module: 'account',
                            action: 'tokentx',
                            address: walletAddress,
                            sort: 'desc',
                            apikey: network.scannerKey
                        }
                    });

                    // console.log(`Response from ${networkId} scanner:`, {
                    //     status: tokensResponse.data.status,
                    //     message: tokensResponse.data.message,
                    //     resultCount: tokensResponse.data.result ? tokensResponse.data.result.length : 0
                    // });

                    if (tokensResponse.data && 
                        tokensResponse.data.status === '1' && 
                        Array.isArray(tokensResponse.data.result)) {
                        
                        if (tokensResponse.data.result.length === 0) {
                            // console.log(`No token transactions found for network ${networkId} - wallet is new or empty`);
                        } else {
                            // console.log(`Found ${tokensResponse.data.result.length} token transactions in ${networkId}`);
                        }
                        
                        // Создаем Set для уникальных адресов токенов
                        const uniqueTokens = new Set<string>();
                        tokensResponse.data.result.forEach((tx: any) => {
                            if (tx.contractAddress) {
                                uniqueTokens.add(tx.contractAddress);
                            }
                        });

                        // Обрабатываем каждый уникальный токен
                        for (const tokenAddress of uniqueTokens) {
                            try {
                                const isValid = await this.retryRequest(networkId, () =>
                                    this.isValidContract(provider, tokenAddress)
                                );
                                if (!isValid) continue;

                                const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

                                const isERC20 = await this.retryRequest(networkId, () =>
                                    this.isERC20Contract(contract)
                                );
                                if (!isERC20) continue;

                                const [balance, decimals, symbol, name] = await Promise.all([
                                    contract.balanceOf(walletAddress).catch(() => null),
                                    contract.decimals().catch(() => null),
                                    contract.symbol().catch(() => null),
                                    contract.name().catch(() => null)
                                ]);

                                if (!balance || decimals === null || !symbol || !name) {
                                    continue;
                                }

                                const formattedBalance = ethers.formatUnits(balance, decimals);

                                if (!(await this.isLegitToken(contract, formattedBalance, symbol, name))) {
                                    continue;
                                }

                                if (parseFloat(formattedBalance) > 0) {
                                    tokenBalances.push({
                                        symbol: String(symbol),
                                        name: String(name),
                                        balance: formattedBalance,
                                        address: tokenAddress,
                                        decimals: Number(decimals),
                                        network: networkId,
                                        networkName: network.name
                                    });
                                }
                            } catch (error) {
                                console.error(`Error processing token ${tokenAddress} on ${networkId}:`, error);
                                continue;
                            }
                        }
                    } else {
                        // console.warn(`No token transactions found for network ${networkId}. Response:`, tokensResponse.data);
                    }
                } catch (error) {
                    // console.log(`No scanner available for network ${networkId}, showing only native token`);
                }
            } else {
                // console.log(`Network ${networkId} doesn't have scanner configuration, showing only native token`);
            }

            return tokenBalances;
        } catch (error) {
            console.error(`Error scanning ${networkId} network:`, error);
            return [];
        }
    }

    async getAllTokenBalances(): Promise<TokenBalance[]> {
        await this.ensureNetworksInitialized();

        const allBalances: TokenBalance[] = [];
        const networks = Object.keys(this.networks);

        const promises = networks.map(async networkId => {
            try {
                return await this.getTokenBalancesForNetwork(networkId);
            } catch (error) {
                console.error(`Error getting balances for ${networkId}:`, error);
                return [];
            }
        });

        const results = await Promise.all(promises);
        results.forEach(networkBalances => {
            allBalances.push(...networkBalances);
        });

        return allBalances;
    }

    private async getTokenIdMap(): Promise<{ [symbol: string]: string }> {
        if (this.tokenIdMapCache) {
            return this.tokenIdMapCache;
        }

        try {
            const popularTokens = {
                'ETH': 'ethereum',              // Ethereum
                'USDT': 'tether',               // Tether
                'USDC': 'usd-coin',             // USD Coin
                'DAI': 'dai',                   // Dai
                'UNI': 'uniswap',               // Uniswap
                'LINK': 'chainlink',            // Chainlink
                'AAVE': 'aave',                 // Aave
                'MATIC': 'matic-network',       // Polygon (Matic)
                'WBTC': 'wrapped-bitcoin',      // Wrapped Bitcoin
                'SUSHI': 'sushiswap',           // SushiSwap
                'COMP': 'compound',             // Compound
                'MKR': 'maker',                 // Maker
                'SNX': 'synthetix-network-token', // Synthetix
                'YFI': 'yearn-finance',         // Yearn Finance
                'BAT': 'basic-attention-token', // Basic Attention Token
                'ZRX': '0x',                    // 0x Protocol
                'CRV': 'curve-dao-token',       // Curve DAO Token
                'BAL': 'balancer',              // Balancer
                '1INCH': '1inch',               // 1inch
                'GRT': 'the-graph',             // The Graph
                'REN': 'ren',                   // Ren
                'RLC': 'iexec-rlc',             // iExec RLC
                'ENJ': 'enjincoin',             // Enjin Coin
                'AMP': 'amp',                   // Amp
                'LRC': 'loopring',              // Loopring
                'OMG': 'omg-network',           // OMG Network
                'BNT': 'bancor',                // Bancor
                'SAND': 'the-sandbox',          // The Sandbox
                'CHZ': 'chiliz',                // Chiliz
                'ANT': 'aragon',                // Aragon
                'AKRO': 'akropolis',            // Akropolis
                'OCEAN': 'ocean-protocol',       // Ocean Protocol
                'BNB': 'binancecoin',  // Убедимся, что это правильный ID для BNB
                'TBNB': 'binancecoin', // Добавим маппинг для тестового BNB
                'tBNB': 'binancecoin',
            };
            this.tokenIdMapCache = popularTokens;
            return popularTokens;
        } catch (error) {
            console.error('Error getting token ID map:', error);
            return {};
        }
    }

    private async getTokenImage(symbol: string, isNativeToken: boolean, networkId: string): Promise<string | undefined> {
        const cacheKey = isNativeToken ? `native-${networkId}` : symbol;

        if (this.tokenImageCache[cacheKey]) {
            return this.tokenImageCache[cacheKey];
        }

        try {
            if (isNativeToken) {
                const network = this.networks[networkId];
                if (network.imageUrl) {
                    this.tokenImageCache[cacheKey] = network.imageUrl;
                    return network.imageUrl;
                }
            }

            const idMap = await this.getTokenIdMap();
            const tokenId = idMap[symbol.toUpperCase()];
            if (tokenId) {
                const response = await this.retryRequest<{ data: CoinGeckoResponse }>(
                    'coingecko', // используем специальный ID для CoinGecko
                    () => axios.get<CoinGeckoResponse>(`${COINGECKO_BASE_URL}/coins/${tokenId}`)
                );
                
                const imageUrl = response.data.image.small;
                this.tokenImageCache[cacheKey] = imageUrl;
                return imageUrl;
            }
        } catch (error) {
            console.error(`Error getting image for token ${symbol}:`, error);
        }
        return undefined;
    }

    private isPriceCacheValid(symbol: string): boolean {
        const cacheItem = this.priceCache[symbol];
        if (!cacheItem) return false;
        
        const now = Date.now();
        return (now - cacheItem.timestamp) < PRICE_CACHE_DURATION;
    }

    async getTokenPrices(tokenBalances: TokenBalance[]): Promise<{ [key: string]: number }> {
        const symbols = [...new Set(tokenBalances.map(token => {
            switch (token.network) {
                case 'bscTestnet':
                    return 'BNB';
                case 'sepolia':
                    return 'ETH';
                default:
                    return token.symbol;
            }
        }))];

        try {
            const prices: { [key: string]: number } = {};
            const symbolsToFetch = symbols.filter(symbol => !this.isPriceCacheValid(symbol));

            if (symbolsToFetch.length > 0) {
                const idMap = await this.getTokenIdMap();
                
                for (let i = 0; i < symbolsToFetch.length; i += CHUNK_SIZE) {
                    const symbolsChunk = symbolsToFetch.slice(i, i + CHUNK_SIZE);
                    const tokenIds = symbolsChunk
                        .map(symbol => idMap[symbol.toUpperCase()])
                        .filter(id => id)
                        .join(',');

                    if (!tokenIds) continue;

                    try {
                        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));

                        const response = await this.retryRequest('coingecko', async () => {
                            const result = await fetch(`${COINGECKO_PROXY_URL}/simple/price?ids=${tokenIds}&vs_currencies=usd`);
                            if (!result.ok) {
                                throw new Error(`HTTP error! status: ${result.status}`);
                            }
                            return result.json();
                        });

                        for (const symbol of symbolsChunk) {
                            const id = idMap[symbol.toUpperCase()];
                            if (id && response[id]) {
                                const price = response[id].usd;
                                this.priceCache[symbol] = {
                                    price,
                                    timestamp: Date.now()
                                };
                                prices[symbol] = price;

                                if (symbol === 'BNB') {
                                    prices['BNB'] = price;
                                    prices['tBNB'] = price;
                                    prices['TBNB'] = price;
                                }

                                if (symbol === 'ETH') {
                                    prices['ETH'] = price;
                                    prices['sepETH'] = price;
                                    prices['SEPOLIA'] = price;
                                }
                            }
                        }
                    } catch (error: any) {
                        console.error(`Error fetching prices for chunk ${i}:`, error);
                        // Используем кэшированные цены, если они есть
                        symbolsChunk.forEach(symbol => {
                            if (this.priceCache[symbol]) {
                                prices[symbol] = this.priceCache[symbol].price;
                            }
                        });
                    }
                }
            }

            // Добавляем кэшированные цены
            symbols.forEach(symbol => {
                if (this.isPriceCacheValid(symbol)) {
                    prices[symbol] = this.priceCache[symbol].price;
                }
            });

            return prices;
        } catch (error) {
            console.error('Error getting token prices:', error);
            // Возвращаем кэшированные цены в случае ошибки
            const cachedPrices: { [key: string]: number } = {};
            symbols.forEach(symbol => {
                if (this.priceCache[symbol]) {
                    cachedPrices[symbol] = this.priceCache[symbol].price;
                }
            });
            return cachedPrices;
        }
    }

    async getNFTBalances(networkId: string): Promise<NFTBalance[]> {
        const wallet = this.wallets[networkId];
        const network = this.networks[networkId];

        if (!wallet || !network) return [];

        try {
            // Получаем ERC-721 транзакции
            const response = await axios.get(network.scanner, {
                params: {
                    module: 'account',
                    action: 'tokennfttx', // Специальный endpoint для NFT транзакций
                    address: wallet.address,
                    startblock: 0,
                    endblock: 99999999,
                    sort: 'desc',
                    apikey: network.scannerKey
                }
            });

            if (response.data.status === '1' && response.data.result) {
                const nfts = response.data.result.map((tx: any) => ({
                    tokenId: tx.tokenID,
                    contractAddress: tx.contractAddress,
                    name: tx.tokenName,
                    symbol: tx.tokenSymbol,
                    network: networkId,
                    networkName: network.name,
                    timestamp: parseInt(tx.timeStamp) * 1000
                }));

                // Фильтруем только те NFT, которые все еще принадлежат кошельку
                const ownedNFTs = await Promise.all(
                    nfts.map(async (nft) => {
                        const contract = new ethers.Contract(
                            nft.contractAddress,
                            ['function ownerOf(uint256) view returns (address)'],
                            wallet
                        );
                        try {
                            const owner = await contract.ownerOf(nft.tokenId);
                            return owner.toLowerCase() === wallet.address.toLowerCase() ? nft : null;
                        } catch {
                            return null;
                        }
                    })
                );

                return ownedNFTs.filter((nft): nft is NFTBalance => nft !== null);
            }
        } catch (error) {
            console.error(`Error getting NFTs for network ${networkId}:`, error);
        }

        return [];
    }


    async getEnrichedTokenBalances(): Promise<TokenBalance[]> {
        await this.ensureNetworksInitialized();

        const balances = await this.getAllTokenBalances();
        const prices = await this.getTokenPrices(balances);

        const enrichedTokens = await Promise.all(
            balances.map(async (token) => {
                const isNativeToken = token.address === 'native';
                const imageUrl = await this.getTokenImage(token.symbol, isNativeToken, token.network);
                
                // Добавляем дополнительную информацию о сети
                const network = this.networks[token.network];
                return {
                    ...token,
                    networkName: network.name,
                    price: prices[token.symbol] || 0,
                    imageUrl,
                    networkImageUrl: network.imageUrl,
                    explorer: network.explorer || ''
                };
            })
        );

        return enrichedTokens;
    }

    private async ensureNetworksInitialized(): Promise<void> {
        if (Object.keys(this.providers).length === 0) {
            await this.initializeNetworks();
        }
    }
}