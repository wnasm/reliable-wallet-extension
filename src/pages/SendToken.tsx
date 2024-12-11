import React, { useState, useEffect } from 'react';
import { Input, Select, Button, message } from 'antd';
import { ethers, JsonRpcProvider, formatUnits } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { ERC20_ABI, TESTNETS, MAINNETS } from '../libs/constants';
import { TokenBalance, NetworkConfig } from '../libs/types';
import { FaArrowLeftLong } from 'react-icons/fa6';
import IconButton from '../libs/IconButton';
import { MultiChainWalletScanner } from '../libs/scanner';

const SendToken: React.FC = () => {
    const [selectedToken, setSelectedToken] = useState<string>('');
    const [recipient, setRecipient] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [tokens, setTokens] = useState<TokenBalance[]>([]);
    const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
    const [provider, setProvider] = useState<JsonRpcProvider | null>(null);
    const [gasInfo, setGasInfo] = useState<{
        gasPrice: string;
        estimatedGas: string;
        totalGasCost: string;
        nativeBalance: string;
    }>({
        gasPrice: '0',
        estimatedGas: '0',
        totalGasCost: '0',
        nativeBalance: '0'
    });
    const [isTestnet, setIsTestnet] = useState<boolean>(false);
    const navigate = useNavigate();

    // Загружаем данные из localStorage при монтировании
    useEffect(() => {
        const savedTokens = localStorage.getItem('tokens');
        const savedWallet = localStorage.getItem('wallet');
        const isTestnet = localStorage.getItem('isTestnet') === 'true';
        setIsTestnet(isTestnet);

        if (savedTokens) {
            setTokens(JSON.parse(savedTokens));
        }

        if (savedWallet) {
            const walletData = JSON.parse(savedWallet);
            // Используем правильную сеть в зависимости от настроек
            const networks = isTestnet ? TESTNETS : MAINNETS;
            const defaultNetwork = Object.values(networks)[0];
            const newProvider = new JsonRpcProvider(defaultNetwork.rpc);
            const newWallet = new ethers.Wallet(walletData.privateKey, newProvider);
            setWallet(newWallet);
            setProvider(newProvider);
        }
    }, []);

    // Функция для обновления балансов
    const updateBalances = async () => {
        if (!wallet) return;
        
        try {
            const scanner = new MultiChainWalletScanner(wallet.privateKey);
            const enrichedTokens = await scanner.getEnrichedTokenBalances();
            setTokens(enrichedTokens);
        } catch (error) {
            console.error('Error updating balances:', error);
        }
    };

    // Обновляем балансы при изменении сети
    useEffect(() => {
        updateBalances();
    }, [wallet, provider]);

    // Функция для обновления информации о газе
    const updateGasInfo = async () => {
        if (!wallet || !provider || !amount || !recipient || !selectedToken) return;

        try {
            const feeData = await provider.getFeeData();
            const nativeBalance = await provider.getBalance(wallet.address);
            const tokenSymbol = selectedToken.split('-')[0];
            const token = tokens.find(t => t.symbol === tokenSymbol);

            if (!token) return;

            let estimatedGas;
            if (token.address === 'native') {
                estimatedGas = BigInt(21000); // Стандартный газ для ETH транзакций
            } else {
                const contract = new ethers.Contract(token.address, ERC20_ABI, wallet);
                try {
                    estimatedGas = await contract.transfer.estimateGas(
                        recipient,
                        ethers.parseUnits(amount, token.decimals)
                    );
                } catch {
                    estimatedGas = BigInt(65000); // Примерный газ для ERC20 транзакций
                }
            }

            const gasCost = feeData.gasPrice * estimatedGas;

            setGasInfo({
                gasPrice: formatUnits(feeData.gasPrice, 'gwei'),
                estimatedGas: estimatedGas.toString(),
                totalGasCost: formatUnits(gasCost, 'ether'),
                nativeBalance: formatUnits(nativeBalance, 'ether')
            });
        } catch (error) {
            console.error('Error updating gas info:', error);
        }
    };

    // Обновляем информацию о газе при изменении входных данных
    useEffect(() => {
        updateGasInfo();
    }, [amount, recipient, selectedToken, wallet, provider]);

    const handleSend = async () => {
        if (!wallet || !provider || !recipient || !amount) {
            message.error('Please fill all fields');
            return;
        }

        try {
            setLoading(true);
            const tokenSymbol = selectedToken.split('-')[0];
            const token = tokens.find(t => t.symbol === tokenSymbol);

            if (!token) {
                message.error('Token not found');
                return;
            }

            const timeout = setTimeout(() => {
                setLoading(false);
                message.error('Transaction timeout. Please try again.');
            }, 30000);

            try {
                const balance = parseFloat(token.balance);
                const sendAmount = parseFloat(amount);
                if (balance < sendAmount) {
                    message.error('Insufficient token balance');
                    return;
                }

                const feeData = await provider.getFeeData();
                const nativeBalance = await provider.getBalance(wallet.address);
                
                const increasedGasPrice = (feeData.gasPrice * BigInt(110)) / BigInt(100);

                let tx;
                if (token.address === 'native') {
                    const gasLimit = 21000;
                    const gasCost = increasedGasPrice * BigInt(gasLimit);
                    const totalCost = gasCost + ethers.parseEther(amount);

                    if (nativeBalance < totalCost) {
                        message.error('Insufficient funds for gas + value');
                        return;
                    }

                    message.loading('Sending native token...');
                    tx = await wallet.sendTransaction({
                        to: recipient,
                        value: ethers.parseEther(amount),
                        gasLimit: gasLimit,
                        gasPrice: increasedGasPrice,
                        nonce: await provider.getTransactionCount(wallet.address, 'latest')
                    });
                } else {
                    const contract = new ethers.Contract(token.address, ERC20_ABI, wallet);
                    if (typeof contract.transfer !== 'function') {
                        message.error('Invalid token contract');
                        return;
                    }

                    const gasLimit = await contract.transfer.estimateGas(
                        recipient,
                        ethers.parseUnits(amount, token.decimals)
                    );
                    const gasCost = increasedGasPrice * gasLimit;

                    if (nativeBalance < gasCost) {
                        message.error(`Insufficient ${token.networkName} native token for gas`);
                        return;
                    }

                    message.loading('Sending token...');
                    tx = await contract.transfer(
                        recipient,
                        ethers.parseUnits(amount, token.decimals),
                        {
                            gasLimit: gasLimit,
                            gasPrice: increasedGasPrice,
                            nonce: await provider.getTransactionCount(wallet.address, 'latest')
                        }
                    );
                }

                message.loading('Waiting for confirmation...');
                const receipt = await tx.wait();
                
                clearTimeout(timeout);
                
                if (receipt.status === 1) {
                    message.success('Transaction confirmed successfully!');
                    navigate(-1);
                } else {
                    message.error('Transaction failed');
                }
            } catch (error: any) {
                clearTimeout(timeout);
                console.error('Transaction error:', error);
                
                if (error.code === 'REPLACEMENT_UNDERPRICED') {
                    message.error('Transaction already pending. Please wait for it to complete or try again with higher gas price.');
                } else {
                    message.error(error.message || 'Transaction failed');
                }
            }
        } catch (error: any) {
            console.error('General error:', error);
            message.error(error.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    // Получаем название нативного токена сети
    const getNativeTokenSymbol = (tokenNetwork: string) => {
        if (tokenNetwork.includes('bsc')) return 'BNB';
        if (tokenNetwork.includes('arbitrum')) return 'ETH';
        return 'ETH';
    };

    // Функция для получения правильной сети на основе выбранного токена
    const getNetworkForToken = (tokenNetwork: string): NetworkConfig => {
        const networks = isTestnet ? TESTNETS : MAINNETS;
        
        let networkKey: string;
        
        if (tokenNetwork.includes('bsc')) {
            networkKey = isTestnet ? 'bscTestnet' : 'bsc';
        } else if (tokenNetwork.includes('arbitrum')) {
            networkKey = 'arbitrum';
        } else {
            networkKey = isTestnet ? 'sepolia' : 'ethereum';
        }
        
        const network = networks[networkKey] as NetworkConfig;
        if (!network) {
            throw new Error(`Network configuration not found for ${networkKey}`);
        }
        
        return network;
    };

    // Обновляем провайдер при выборе токена
    const handleTokenSelect = async (value: string) => {
        setSelectedToken(value);
        const [_, network] = value.split('-');
        const networkConfig = getNetworkForToken(network);
        
        if (networkConfig && networkConfig.rpc) {
            const newProvider = new JsonRpcProvider(networkConfig.rpc);
            setProvider(newProvider);
            
            if (wallet) {
                const newWallet = new ethers.Wallet(wallet.privateKey, newProvider);
                setWallet(newWallet);
                await updateBalances();
            }
        }
    };

    return (
        <div className="container">
            <header className="header">
                <IconButton
                    className="back-icon"
                    style={{}}
                    icon={<FaArrowLeftLong style={{ fill: 'pink' }} size={24} />}
                    onClick={() => navigate(-1)}
                />
                <h1>Send Token</h1>
            </header>

            <div className="body">
                <div className="content">
                    <div className="space-y-4">
                        <Select
                            className="w-full"
                            placeholder="Select token"
                            onChange={handleTokenSelect}
                        >
                            {tokens.map(token => (
                                <Select.Option
                                    key={`${token.network}-${token.symbol}-${token.address}`}
                                    value={`${token.symbol}-${token.network}`}
                                >
                                    {`${token.symbol} - Balance: ${token.balance}`}
                                </Select.Option>
                            ))}
                        </Select>

                        <Input
                            placeholder="Recipient address"
                            value={recipient}
                            onChange={e => setRecipient(e.target.value)}
                        />

                        <Input
                            placeholder="Amount"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                        />

                        {/* Информация о газе */}
                        <div className="gas-info" style={{ marginTop: '20px', color: 'white' }}>
                            <h3>Transaction Fee Info:</h3>
                            <div style={{ marginLeft: '10px' }}>
                                <p style={{ color: 'pink', marginBottom: '10px' }}>
                                    Current Network: {selectedToken ? getNetworkForToken(selectedToken.split('-')[1]).name : isTestnet ? 'Testnet (Sepolia)' : 'Mainnet'}
                                </p>
                                <p>Gas Price: {gasInfo.gasPrice} Gwei</p>
                                <p>Estimated Gas: {gasInfo.estimatedGas} units</p>
                                <p>Total Gas Cost: {gasInfo.totalGasCost} {selectedToken ? getNativeTokenSymbol(selectedToken.split('-')[1]) : 'ETH'}</p>
                                <p>Available for Gas: {gasInfo.nativeBalance} {selectedToken ? getNativeTokenSymbol(selectedToken.split('-')[1]) : 'ETH'}</p>
                                <p style={{ color: 'pink', fontSize: '12px' }}>
                                    * Gas fees are paid in network's native token ({selectedToken ? getNativeTokenSymbol(selectedToken.split('-')[1]) : 'ETH'})
                                </p>
                            </div>
                        </div>

                        <Button
                            type="primary"
                            loading={loading}
                            onClick={handleSend}
                            block
                        >
                            Send
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SendToken; 