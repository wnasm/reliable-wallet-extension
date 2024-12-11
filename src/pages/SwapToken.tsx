import React, { useState, useEffect } from 'react';
import { Input, Select, Button, message, Modal, Slider } from 'antd';
import { ethers, JsonRpcProvider } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import IconButton from '../libs/IconButton';
import { UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, ERC20_ABI, MAINNETS } from '../libs/constants';
import { TokenBalance } from '../libs/types';
import { formatUnits, parseUnits } from 'ethers';

import '../css/swapToken.css';

const SwapToken: React.FC = () => {
  const [fromToken, setFromToken] = useState<string>('');
  const [toToken, setToToken] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [estimatedOutput, setEstimatedOutput] = useState<string>('0');
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [slippage, setSlippage] = useState<number>(0.5); // 0.5%
  const [priceImpact, setPriceImpact] = useState<string>('0');
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
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [allowance, setAllowance] = useState<string>('0');
  const [percentageAmount, setPercentageAmount] = useState<number>(0);

  // Проверяем тестнет при монтировании
  useEffect(() => {
    const isTestnet = localStorage.getItem('isTestnet') === 'true';
    setIsTestnet(isTestnet);

    if (isTestnet) {
      message.error('Swap is not available in testnet mode');
      navigate(-1); // Возвращаемся назад
      return;
    }

    // Загружаем данные только если не тестнет
    const savedTokens = localStorage.getItem('tokens');
    const savedWallet = localStorage.getItem('wallet');
    const savedProvider = localStorage.getItem('provider');

    if (savedTokens) {
      const parsedTokens = JSON.parse(savedTokens);
      // console.log('Loaded tokens:', parsedTokens); // Для отладки
      setTokens(parsedTokens);
    }

    if (savedWallet && savedProvider) {
      const walletData = JSON.parse(savedWallet);
      const newProvider = new JsonRpcProvider(savedProvider);
      const newWallet = new ethers.Wallet(walletData.privateKey, newProvider);
      setWallet(newWallet);
    }
  }, [navigate]);

  // Функция для фильтрации токенов по сети
  const getTokensForNetwork = (networkId: string) => {
    return tokens.filter(token => {
      const hasBalance = parseFloat(token.balance) > 0;
      const isCorrectNetwork = token.network === networkId ||
        (token.network === 'ethereum' && networkId === 'ethereum');
      console.log(`Token ${token.symbol}: balance=${token.balance}, network=${token.network}, matches=${isCorrectNetwork}`); // Для отладки
      return hasBalance && isCorrectNetwork;
    });
  };

  // Функция для получения адреса токена
  const getTokenAddress = (tokenSymbol: string, network: string) => {
    const token = tokens.find(t => t.symbol === tokenSymbol && t.network === network);
    return token?.address || null;
  };

  // Обновим список популярных токенов с адресами
  const popularTokens = [
    { 
      symbol: 'ETH', 
      name: 'Ethereum',
      address: 'native'
    },
    { 
      symbol: 'USDT', 
      name: 'Tether USD',
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    },
    { 
      symbol: 'USDC', 
      name: 'USD Coin',
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    },
    { 
      symbol: 'DAI', 
      name: 'Dai',
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    },
    { 
      symbol: 'WETH', 
      name: 'Wrapped Ethereum',
      address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    },
    { 
      symbol: 'WBTC', 
      name: 'Wrapped Bitcoin',
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
    },
    { 
      symbol: 'UNI', 
      name: 'Uniswap',
      address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
    },
    { 
      symbol: 'LINK', 
      name: 'Chainlink',
      address: '0x514910771AF9Ca656af840dff83E8264EcF986CA'
    }
  ];

  // Обновим функцию getQuote
  const getQuote = async () => {
    if (!amount || !fromToken || !toToken || !wallet) return;

    try {
      const router = new ethers.Contract(
        UNISWAP_ROUTER_ADDRESS,
        UNISWAP_ROUTER_ABI,
        wallet
      );

      const [fromSymbol, fromNetwork] = fromToken.split('-');
      const [toSymbol, toNetwork] = toToken.split('-');

      // Прверяем, что токены разные
      if (fromSymbol === toSymbol) {
        message.error('Cannot swap token for itself');
        return;
      }

      // Получаем адреса токенов
      const fromTokenData = fromSymbol === 'ETH' 
        ? { address: 'native', decimals: 18 }
        : tokens.find(t => t.symbol === fromSymbol);

      const toTokenData = popularTokens.find(t => t.symbol === toSymbol);

      if (!fromTokenData || !toTokenData) {
        message.error('Invalid token selection');
        return;
      }

      // Формируем путь для свапа
      const path = [];
      if (fromTokenData.address === 'native') {
        path.push('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'); // WETH
      } else {
        path.push(fromTokenData.address);
      }

      if (toTokenData.address === 'native') {
        path.push('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'); // WETH
      } else {
        path.push(toTokenData.address);
      }

      // Используем decimals из данных токена или дефолтное значение
      const decimals = fromTokenData.address === 'native' ? 18 : 
                      (fromTokenData as TokenBalance).decimals || 18;

      const amountIn = ethers.parseUnits(amount, decimals);

      const amounts = await router.getAmountsOut(amountIn, path);
      const amountOut = amounts[1];

      const outputDecimals = toTokenData.address === 'native' ? 18 : 18;
      setEstimatedOutput(ethers.formatUnits(amountOut, outputDecimals));

    } catch (error) {
      console.error('Error getting quote:', error);
      message.error('Error getting swap quote');
    }
  };

  // Обновляем котировку при изменении входных данных
  useEffect(() => {
    getQuote();
  }, [amount, fromToken, toToken]);

  // Функция для обновления информации о газе
  const updateGasInfo = async () => {
    if (!wallet || !amount || !fromToken || !toToken) return;

    try {
      const provider = wallet.provider;
      const feeData = await provider.getFeeData();
      const nativeBalance = await provider.getBalance(wallet.address);

      // Оценка газа для свапа
      let estimatedGas;
      try {
        const router = new ethers.Contract(
          UNISWAP_ROUTER_ADDRESS,
          UNISWAP_ROUTER_ABI,
          wallet
        );

        if (fromToken === 'ETH') {
          estimatedGas = await router.swapExactETHForTokens.estimateGas(
            0, // amountOutMin
            [
              '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
              toToken
            ],
            wallet.address,
            Math.floor(Date.now() / 1000) + 60 * 20,
            { value: ethers.parseEther(amount) }
          );
        } else {
          estimatedGas = BigInt(250000); // Примерная оценка для токен-токен свапов
        }
      } catch {
        estimatedGas = BigInt(250000); // Fallback значение
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
  }, [amount, fromToken, toToken, wallet]);

  useEffect(() => {
    message.config({
      getContainer: () => document.querySelector('.message-container') || document.body,
    });
  }, []);

  const handleSwap = async () => {
    if (!wallet || !fromToken || !toToken || !amount) {
      message.error('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const router = new ethers.Contract(
        UNISWAP_ROUTER_ADDRESS,
        UNISWAP_ROUTER_ABI,
        wallet
      );

      const path = [
        fromToken === 'ETH' ? '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' : fromToken,
        toToken === 'ETH' ? '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' : toToken
      ];

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 минут
      const amountIn = ethers.parseUnits(amount, 18);
      const amountOutMin = ethers.parseUnits(
        (parseFloat(estimatedOutput) * (1 - slippage / 100)).toString(),
        18
      );

      let tx;
      if (fromToken === 'ETH') {
        tx = await router.swapExactETHForTokens(
          amountOutMin,
          path,
          wallet.address,
          deadline,
          { value: amountIn }
        );
      } else if (toToken === 'ETH') {
        tx = await router.swapExactTokensForETH(
          amountIn,
          amountOutMin,
          path,
          wallet.address,
          deadline
        );
      } else {
        tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          wallet.address,
          deadline
        );
      }

      await tx.wait();
      message.success('Swap executed successfully!');
      navigate(-1);
    } catch (error: any) {
      console.error('Swap error:', error);
      message.error(error.message || 'Swap failed');
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения баланса токена
  const getTokenBalance = (tokenSymbol: string, network: string) => {
    const token = tokens.find(t => t.symbol === tokenSymbol && t.network === network);
    return token ? `Balance: ${token.balance}` : 'Balance: 0';
  };

  // Функция для получения цены токена
  const getTokenPrice = (tokenSymbol: string) => {
    const token = tokens.find(t => t.symbol === tokenSymbol);
    return token?.price || 0;
  };

  // Функция для установки суммы на основе процента от баланса
  const handlePercentageClick = (percent: number) => {
    if (!fromToken) return;

    const [symbol, network] = fromToken.split('-');
    const token = tokens.find(t => t.symbol === symbol && t.network === network);
    if (!token) return;

    const balance = parseFloat(token.balance);
    const newAmount = (balance * percent / 100).toString();
    setAmount(newAmount);
    setPercentageAmount(percent);
  };

  // Функция для проверки и запроса разрешения на свап
  const handleApprove = async () => {
    if (!wallet || !fromToken || !amount) return;

    try {
      // Проверяем баланс ETH для газа
      const nativeBalance = await wallet.provider.getBalance(wallet.address);
      const feeData = await wallet.provider.getFeeData();
      const estimatedGas = BigInt(65000); // Примерная оценка газа для approve
      const gasCost = feeData.gasPrice * estimatedGas;

      if (nativeBalance < gasCost) {
        message.error(`Insufficient ETH for gas. Need at least ${formatUnits(gasCost, 'ether')} ETH`);
        return;
      }

      setLoading(true);
      const [symbol, network] = fromToken.split('-');
      const token = tokens.find(t => t.symbol === symbol && t.network === network);

      if (!token || token.address === 'native') return;

      const contract = new ethers.Contract(token.address, ERC20_ABI, wallet);
      const amountToApprove = parseUnits(amount, token.decimals);

      const tx = await contract.approve(UNISWAP_ROUTER_ADDRESS, amountToApprove);
      await tx.wait();

      message.success('Token approved successfully');
      setApprovalModalVisible(false);
      // После одобрения можно выполнить свап
      await handleSwap();
    } catch (error: any) {
      console.error('Approval error:', error);
      message.error(error.message || 'Approval failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <IconButton
          className="back-icon"
          icon={<FaArrowLeftLong style={{ fill: 'pink' }} size={24} />}
          onClick={() => navigate(-1)}
        />
        <h1>Swap</h1>
      </header>

      <div className="body">
        <div className="content column-swapTokens">
        <div className="message-container"></div>

          {/* Выбор сети */}
          <p>Select Network</p>
          <Select
            className="network-select"
            placeholder="Select Network"
            value={selectedNetwork}
            onChange={setSelectedNetwork}
            style={{ width: '300px', marginBottom: '20px' }}
          >
            {Object.entries(MAINNETS).map(([networkId, network]) => (
              <Select.Option key={networkId} value={networkId}>
                <div className="network-option">
                  {network.imageUrl && (
                    <img 
                      src={network.imageUrl} 
                      alt={network.name} 
                      style={{ width: '20px', height: '20px', marginRight: '8px' }}
                    />
                  )}
                  {network.name}
                </div>
              </Select.Option>
            ))}
          </Select>

          {/* Секция Pay with */}
          <div className="pay-section">
            <p>Pay with</p>
            <Select
              className="token-select"
              placeholder="Select token"
              value={fromToken}
              onChange={value => setFromToken(value)}
              style={{ width: '300px', marginBottom: '10px' }}
            >
              {tokens
                .filter(token => {
                  const hasBalance = parseFloat(token.balance) > 0;
                  const isCorrectNetwork = selectedNetwork ? token.network === selectedNetwork : true;
                  // console.log(`Filtering token ${token.symbol}: balance=${token.balance}, network=${token.network}, selected=${selectedNetwork}, passes=${hasBalance && isCorrectNetwork}`); // Для отладки
                  return hasBalance && isCorrectNetwork;
                })
                .map(token => (
                  <Select.Option
                    key={`from-${token.network}-${token.symbol}-${token.address}`}
                    value={`${token.symbol}-${token.network}`}
                  >
                    <div className="token-option">
                      {token.imageUrl && <img src={token.imageUrl} alt={token.symbol} />}
                      <span>{token.symbol} ({token.balance})</span>
                    </div>
                  </Select.Option>
                ))
              }
            </Select>

            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              style={{ width: '300px', marginBottom: '10px' }}
            />
            <div className="token-balance">
              {fromToken && getTokenBalance(fromToken.split('-')[0], fromToken.split('-')[1])}
            </div>
          </div>

          {/* Секция Receive */}
          <div className="receive-section">
            <h3>Receive</h3>
            <Select
              className="token-select"
              placeholder="Select token"
              value={toToken}
              onChange={value => setToToken(value)}
              style={{ width: '300px', marginBottom: '10px' }}
            >
              {popularTokens
                .filter(token => token.symbol !== fromToken?.split('-')[0]) // Исключаем выбранный токен из списка
                .map(token => (
                  <Select.Option
                    key={`to-${token.symbol}`}
                    value={`${token.symbol}-ethereum`}
                  >
                    <div className="token-option">
                      <span>{token.symbol}</span>
                    </div>
                  </Select.Option>
                ))
              }
            </Select>

            <div className="estimated-output">
              {estimatedOutput}
            </div>
            <div className="token-balance">
              {toToken && getTokenBalance(toToken.split('-')[0], toToken.split('-')[1])}
            </div>
          </div>

          {/* Информация о свапе */}
          {amount && fromToken && toToken && (
            <div className="swap-info">
              <div className="rate">
                <span>Rate</span>
                <span>1 {fromToken.split('-')[0]} = {estimatedOutput} {toToken.split('-')[0]}</span>
              </div>

              <div className="network-fee">
                <span>Network Fee</span>
                <span>~30 sec · {gasInfo.totalGasCost} ETH (${(parseFloat(gasInfo.totalGasCost) * getTokenPrice('ETH')).toFixed(2)})</span>
              </div>
            </div>
          )}

          <Button
            type="primary"
            onClick={() => setApprovalModalVisible(true)}
            disabled={!amount || !fromToken || !toToken || loading}
            block
          >
            {fromToken ? `Approve ${fromToken.split('-')[0]}` : 'Select tokens'}
          </Button>
        </div>
      </div>

      {/* Модальное окно подтверждения */}
      <Modal
        title="Approve Token"
        open={approvalModalVisible}
        onCancel={() => setApprovalModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setApprovalModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="approve"
            type="primary"
            loading={loading}
            onClick={handleApprove}
          >
            Sign and Send
          </Button>
        ]}
        className="swap-modal"
        styles={{
          mask: {
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.45)'
          },
          wrapper: {
            position: 'absolute',
            inset: 0
          }
        }}
        getContainer={() => document.querySelector('.container') || document.body}
      >
        <div className="approval-content">
          <h4>Allow to spend</h4>
          <p>{amount} {fromToken?.split('-')[0]}</p>

          <div className="network-fee">
            <span>Network Fee</span>
            <span>~30 sec · {gasInfo.totalGasCost} ETH</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SwapToken; 