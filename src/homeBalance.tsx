import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Alert, Button, Avatar, message, Select } from 'antd';
import { ethers, Wallet, JsonRpcProvider } from "ethers";
import blockies from 'ethereum-blockies';
import * as bip39 from "bip39";
import { FaGear } from "react-icons/fa6";
import { CopyFilled, DislikeOutlined, LikeOutlined, QrcodeOutlined, ReloadOutlined, RetweetOutlined } from '@ant-design/icons';
import axios from 'axios';

import IconButton from './libs/IconButton';
import { MultiChainWalletScanner } from './libs/scanner';
import { TokenBalance, Transaction, NFTBalance } from './libs/types';
import { TESTNETS, MAINNETS } from './libs/constants';


import { ReactComponent as IconETH } from './img/Network.svg';

import './css/homeBalance.css';
const { Title, Text } = Typography;

// WebSocket провайдер для подключения к сети Ethereum (Sepolia)
// const provider = new WebSocketProvider("wss://ethereum-sepolia-rpc.publicnode.com");
// const provider = new WebSocketProvider("wss://bsc-testnet-rpc.publicnode.com");
// const provider = new WebSocketProvider("https://data-seed-prebsc-1-s1.bnbchain.org:8545");

import AccountManager from './components/AccountManager';
import { WalletAccount } from './libs/types';

const WalletInfo: React.FC = () => {
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [ShortAddress, setShortAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);
  const [provider, setProvider] = useState<JsonRpcProvider | null>(null);
  const [activeTab, setActiveTab] = useState('tokens');
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [totalBalanceUSD, setTotalBalanceUSD] = useState<string>('0.00');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [isTestnet, setIsTestnet] = useState<boolean>(false);

  // const [balanceETH, setBalanceETH] = useState<string | null>(null);
  // const [balanceUSD, setBalanceUSD] = useState<string | null>(null);

  const navigate = useNavigate();

  const textStyles = {
    color: 'rgba(255, 255, 255)',
  }

  // Функция для получения адреса из прватного ключа
  async function getAddressFromPrivateKey(privateKey: string) {
    const wallet = new Wallet(privateKey);
    setAddress(wallet.address);
    return wallet.address;
  }

  async function shortenAddress(address: string, startLength = 6, endLength = 4): Promise<string> {
    if (address.length <= startLength + endLength) {
      return address; // Если длина адреса меньше или равна необходимй длине, вернуть его без изменений
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }

  async function getAvatarFromAddress(address: string): Promise<string> {
    let avatarUrl = "";

    // Генерация аватарки и проверк длины ссылки
    while (avatarUrl.length < 240) {
      const avatar = blockies.create({ seed: address, size: 8, scale: 5 }); // Настройки аватара
      avatarUrl = avatar.toDataURL(); // Преобразовани Canvas в Data URL

      // console.log("Generated avatar URL:", avatarUrl);
    }

    return avatarUrl;
  }


  // Функция для получения и установки провайдера из localStorage
  const setUserProviderFromLocalStorage = () => {
    const storedProvider = localStorage.getItem('userProvider');
    const defaultProvider = "wss://ethereum-sepolia-rpc.publicnode.com"; // Sepolia по умолчанию
    const providerUrl = storedProvider || defaultProvider;
    const newProvider = new JsonRpcProvider(providerUrl);
    setProvider(newProvider);
  };

  // Получение цены ETH
  async function getETHPrice() {
    try {
      const response = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD');
      return response.data.USD;
    } catch (error) {
      console.error("Ошибка при получении курса ETH:", error);
      return 0;
    }
  }

  // Функция для проверки аланса ETH
  const checkBalance = async () => {
    setLoading(true);
    try {
        if (!privateKey) {
            throw new Error("Private key not found");
        }

        // Создаем новый экземпляр сканера с обновленным списком сетей
        const scanner = new MultiChainWalletScanner(privateKey);
        const enrichedTokens = await scanner.getEnrichedTokenBalances();
        setTokens(enrichedTokens);
        localStorage.setItem('tokens', JSON.stringify(enrichedTokens));

        const totalUSD = enrichedTokens.reduce((sum, token) => {
            const balance = parseFloat(token.balance as string);
            return sum + (token.price || 0) * balance;
        }, 0);

        setTotalBalanceUSD(totalUSD.toFixed(2));
    } catch (error) {
        console.error("Error checking balance:", error);
    } finally {
        setLoading(false);
    }
  };

  // Функция для копирования адреса
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(address);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  }


  // Функция для рендера контента в зависимости от выбранной вкладки
  const renderContent = () => {
    switch (activeTab) {
      case 'tokens':
        return (
          <>
            <div className="network-selector">
              <Select
                value={selectedNetwork}
                onChange={setSelectedNetwork}
                style={{ width: 200, marginBottom: '1em' }}
                defaultValue="all"
              >
                <Select.Option value="all">All Networks</Select.Option>
                {Object.entries(getCurrentNetworks()).map(([key, network]) => (
                  <Select.Option key={key} value={key}>
                    {network.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div className="selectSection-home listTokens-home">
              {getFilteredTokens().map((token, index) => (
                <div key={`${token.network}-${token.address}-${index}`} className="token">
                  <div className="IconName-home">
                    <div className="token-image">
                      {token.imageUrl && <img src={token.imageUrl} alt={token.name} className="token-icon" />}
                      {token.address !== 'native' && (
                        <img
                          className="networkIcon-home"
                          src={token.networkImageUrl}
                          alt={token.networkName}
                        />
                      )}
                    </div>
                    <div className="token-details">
                      <span className="token-name">{token.name}</span>
                      <div className="network-info">
                      </div>
                    </div>
                  </div>
                  <div className="token-info">
                    <span className="tokenBalance-home">
                      {parseFloat(token.balance).toFixed(4)} {token.symbol}
                    </span>
                    <span className="tokenPrice-home">
                      ${((token.price || 0) * parseFloat(token.balance)).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      case 'nfts':
        return (
          <div className="selectSection-home nfts-home">
            {loading ? (
              <div className="loading">Loading NFTs...</div>
            ) : (
              <div className="nft-list">
                {nfts.map((nft, index) => (
                  <div key={`${nft.contractAddress}-${nft.tokenId}`} className="nft-item">
                    <div className="nft-details">
                      <div className="nft-name">
                        {nft.name} #{nft.tokenId}
                      </div>
                      <div className="nft-date">
                        {new Date(nft.timestamp).toLocaleString()}
                      </div>
                      <div className="nft-network">
                        {nft.networkName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'history':
        return (
          <div className="selectSection-home history-home">
            {loading ? (
              <div className="loading">Loading transactions...</div>
            ) : (
              <div className="transactions-list">
                {transactions.map((tx, index) => (
                  <div key={`${tx.hash}-${index}`} className="transaction-item">
                    <div className="transaction-icon">
                      {tx.type === 'send' ? <DislikeOutlined /> : <LikeOutlined />}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-type">
                        {tx.type === 'send' ? 'Sent' : 'Received'}
                        {tx.tokenSymbol ? ` ${tx.tokenSymbol}` : ` ${getCurrentNetworks()[tx.network].symbol}`}
                      </div>
                      <div className="transaction-amount">
                        {tx.tokenAmount || tx.value}
                        {tx.tokenSymbol || getCurrentNetworks()[tx.network].symbol}
                      </div>
                      <div className="transaction-date">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                      <div className="transaction-network">
                        {getCurrentNetworks()[tx.network].name}
                      </div>
                      <div className={`transaction-status ${tx.status}`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <div className="selectSection-home soon-home">Soon...</div>;
    }
  };

  useEffect(() => {
    localStorage.setItem('walletAddress', address);
  }, [address]);
  
//   useEffect(() => {
//     localStorage.setItem('walletAvatar', avatarImage);
// });


  // Функция для получения адреса из приватного ключа
  useEffect(() => {
    const storedPrivateKey = localStorage.getItem('walletPrivateKey');
    if (storedPrivateKey) {
      setPrivateKey(storedPrivateKey);
      const wallet = new ethers.Wallet(storedPrivateKey);
      setAddress(wallet.address);
    }
  }, []);

  // short addres
  useEffect(() => {
    if (address) {
      shortenAddress(address).then(ShortAddress => setShortAddress(ShortAddress));
    }
  }, [address]);


  // avatar
  useEffect(() => {
    // Попытка получить аватарку из localStorage при загрузке страницы
    const savedAvatar = localStorage.getItem('walletAvatar');
    if (savedAvatar && savedAvatar.length > 240) {
      setAvatarImage(savedAvatar);
    } else if (address) {
      // Если аватарки в localStorage нет, генерируем новую
      getAvatarFromAddress(address).then(avatarUrl => {
        localStorage.setItem('walletAvatar', avatarUrl); // Сохраняем аватар в localStorage
        setAvatarImage(avatarUrl); // Обновляем состояние компонента
      });
    }
  }, [address]);

  useEffect(() => {
    message.config({
      getContainer: () => document.querySelector('.message-container') || document.body,
    });
  }, []);

  useEffect(() => {
    const storedIsTestnet = localStorage.getItem('isTestnet') === 'true';
    setIsTestnet(storedIsTestnet);
  }, []);

  // Получение текущих сетей в зависимости от режима (mainnet/testnet)
  const getCurrentNetworks = () => {
    return isTestnet ? TESTNETS : MAINNETS;
  };

  // Фильтрация токенов по выбранной сети
  const getFilteredTokens = () => {
    if (selectedNetwork === 'all') {
      return tokens;
    }
    return tokens.filter(token => token.network === selectedNetwork);
  };

  // Подсчет общего баланса для отфиьтрованных токенов
  useEffect(() => {
    const filteredTokens = getFilteredTokens();
    const total = filteredTokens.reduce((sum, token) => {
      const balance = parseFloat(token.balance);
      const price = token.price || 0;
      return sum + (balance * price);
    }, 0);
    setTotalBalanceUSD(total.toFixed(2));
  }, [tokens, selectedNetwork]);

  const SettingsButton = () => {
    navigate('/settings')
  }

  const QrButton = () => {
    navigate('/QrCode')
  }

  // Добавьте новый useState для wallet
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);

  // Упрощаем инициализацию provider
  useEffect(() => {
    const currentNetwork = isTestnet ? TESTNETS : MAINNETS;
    const defaultRpc = Object.values(currentNetwork)[0].rpc;
    const newProvider = new JsonRpcProvider(defaultRpc);
    setProvider(newProvider);
  }, [isTestnet]);

  // Инициализция wallet с provider
  useEffect(() => {
    if (privateKey && provider) {
      const newWallet = new ethers.Wallet(privateKey, provider);
      setWallet(newWallet);
    }
  }, [privateKey, provider]);

  const handleSendClick = () => {
    navigate('/send');
  };

  const handleSwapClick = () => {
    const isTestnet = localStorage.getItem('isTestnet') === 'true';
    if (isTestnet) {
      message.error('Swap is not available in testnet mode');
      return;
    }
    navigate('/swap');
  };

  // Сохраняем tokens при их изменении
  useEffect(() => {
    if (tokens.length > 0) {
      localStorage.setItem('tokens', JSON.stringify(tokens));
    }
  }, [tokens]);

  // Сохраняем wallet при его изменении
  useEffect(() => {
    if (wallet) {
      localStorage.setItem('wallet', JSON.stringify({
        address: wallet.address,
        privateKey: wallet.privateKey
      }));
    }
  }, [wallet]);

  // Добавьте новое состояние для транзакций
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Функция для получения истории транзакций
  const getTransactionHistory = async () => {
    if (!wallet || !provider) return;

    try {
      setLoading(true);
      const networks = isTestnet ? TESTNETS : MAINNETS;
      const allTransactions: Transaction[] = [];

      for (const [networkId, network] of Object.entries(networks)) {
        try {
          const response = await axios.get(network.scanner, {
            params: {
              module: 'account',
              action: 'txlist',
              address: wallet.address,
              startblock: 0,
              endblock: 99999999,
              sort: 'desc',
              apikey: network.scannerKey
            }
          });

          if (response.data.status === '1' && response.data.result) {
            const networkTxs = response.data.result.map((tx: any) => ({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value ? ethers.formatEther(tx.value) : '0',
              timestamp: parseInt(tx.timeStamp) * 1000,
              type: tx.from.toLowerCase() === wallet.address.toLowerCase() ? 'send' : 'receive',
              network: networkId,
              status: tx.isError === '0' ? 'success' : 'failed'
            }));

            allTransactions.push(...networkTxs);
          }

          // Получаем также ERC20 тразакции
          const tokenTxResponse = await axios.get(network.scanner, {
            params: {
              module: 'account',
              action: 'tokentx',
              address: wallet.address,
              startblock: 0,
              endblock: 99999999,
              sort: 'desc',
              apikey: network.scannerKey
            }
          });

          if (tokenTxResponse.data.status === '1' && tokenTxResponse.data.result) {
            const tokenTxs = tokenTxResponse.data.result.map((tx: any) => {
              try {
                return {
                  hash: tx.hash,
                  from: tx.from,
                  to: tx.to,
                  tokenSymbol: tx.tokenSymbol,
                  tokenAmount: tx.tokenDecimal ?
                    ethers.formatUnits(tx.value, parseInt(tx.tokenDecimal)) :
                    ethers.formatUnits(tx.value, 18),
                  timestamp: parseInt(tx.timeStamp) * 1000,
                  type: tx.from.toLowerCase() === wallet.address.toLowerCase() ? 'send' : 'receive',
                  network: networkId,
                  status: 'success'
                };
              } catch (error) {
                console.error('Error processing token transaction:', error);
                return null;
              }
            }).filter(tx => tx !== null);

            allTransactions.push(...tokenTxs);
          }
        } catch (error) {
          console.error(`Error fetching transactions for ${networkId}:`, error);
        }
      }

      // Сортируем все транзакции по времени
      allTransactions.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем историю при монтировании и при изменении сети
  useEffect(() => {
    if (activeTab === 'history') {
      getTransactionHistory();
    }
  }, [activeTab, isTestnet]);

  const [nfts, setNfts] = useState<NFTBalance[]>([]);

  // Функция для получения NFT
  const getNFTs = async () => {
    if (!wallet) return;

    try {
      setLoading(true);
      const scanner = new MultiChainWalletScanner(wallet.privateKey);
      const networks = isTestnet ? TESTNETS : MAINNETS;
      let allNFTs: NFTBalance[] = [];

      for (const networkId of Object.keys(networks)) {
        const networkNFTs = await scanner.getNFTBalances(networkId);
        allNFTs = [...allNFTs, ...networkNFTs];
      }

      setNfts(allNFTs);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем NFT при переключении на владку NFTs
  useEffect(() => {
    if (activeTab === 'nfts') {
      getNFTs();
    }
  }, [activeTab, wallet, isTestnet]);

  // В компоненте WalletInfo добавим эффект для проверки баланса при монтировании
  useEffect(() => {
    if (privateKey) {
      checkBalance();
    }
  }, [privateKey]);

  const [showAccountManager, setShowAccountManager] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<WalletAccount | null>(null);

  // Добавить эффект для загрузки текущего аккаунта
  useEffect(() => {
    const savedAccount = localStorage.getItem('currentAccount');
    if (savedAccount) {
      const account = JSON.parse(savedAccount);
      setCurrentAccount(account);
      setPrivateKey(account.privateKey);
      setAddress(account.address);

      // Загружаем или генерируем аватар
      const savedAvatar = localStorage.getItem('walletAvatar');
      if (savedAvatar && savedAvatar.length > 240) {
        setAvatarImage(savedAvatar);
      } else if (account.address) {
        getAvatarFromAddress(account.address).then(avatarUrl => {
          localStorage.setItem('walletAvatar', avatarUrl);
          setAvatarImage(avatarUrl);
        });
      }
    }
  }, []);

  // Добавить функцию для переключения аккаунта
  const handleSwitchAccount = (account: WalletAccount) => {
    clearPreviousAccountData();
    setCurrentAccount(account);
    localStorage.setItem('currentAccount', JSON.stringify(account));
    setPrivateKey(account.privateKey);
    setAddress(account.address);
    
    // Генерируем новый аватар для аккаунта
    if (account.address) {
      getAvatarFromAddress(account.address).then(avatarUrl => {
        localStorage.setItem('walletAvatar', avatarUrl);
        setAvatarImage(avatarUrl);
      });
    }

    setShowAccountManager(false);
    checkBalance();
  };

  // Функция для очистки данных предыдущего аккаунта
  const clearPreviousAccountData = () => {
    localStorage.removeItem('walletAvatar');
    localStorage.removeItem('tokens');
    setTokens([]);
    setTotalBalanceUSD('0.00');
    setAvatarImage(null);
  };

  // В начале компонента WalletInfo добавим эффект для проверки аккаунтов
  useEffect(() => {
    // Восстанавливаем данные аккаунтов
    const savedAccounts = localStorage.getItem('walletAccounts');
    const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
    
    if (accounts.length === 0) {
      // Если аккаунтов нет, перенаправляем на домашнюю страницу
      navigate('/');
      return;
    }

    // Восстанавливаем текущий аккаунт
    const savedCurrentAccount = localStorage.getItem('currentAccount');
    const currentAccountData = savedCurrentAccount ? JSON.parse(savedCurrentAccount) : null;

    if (currentAccountData) {
      // Если есть сохраненный текущий аккаунт, восстанавливаем его данные
      setCurrentAccount(currentAccountData);
      setPrivateKey(currentAccountData.privateKey);
      setAddress(currentAccountData.address);
      
      // Восстанавливаем или генерируем аватар
      const savedAvatar = localStorage.getItem('walletAvatar');
      if (savedAvatar && savedAvatar.length > 240) {
        setAvatarImage(savedAvatar);
      } else if (currentAccountData.address) {
        getAvatarFromAddress(currentAccountData.address).then(avatarUrl => {
          localStorage.setItem('walletAvatar', avatarUrl);
          setAvatarImage(avatarUrl);
        });
      }

      // Восстанавливаем сохраненные токены
      const savedTokens = localStorage.getItem('tokens');
      if (savedTokens) {
        setTokens(JSON.parse(savedTokens));
      }

    } else {
      // Если текущий аккаунт не выбран, устанавливаем первый аккаунт как текущий
      const firstAccount = accounts[0];
      setCurrentAccount(firstAccount);
      localStorage.setItem('currentAccount', JSON.stringify(firstAccount));
      setPrivateKey(firstAccount.privateKey);
      setAddress(firstAccount.address);

      if (firstAccount.address) {
        getAvatarFromAddress(firstAccount.address).then(avatarUrl => {
          localStorage.setItem('walletAvatar', avatarUrl);
          setAvatarImage(avatarUrl);
        });
      }
    }

    // Восстанавливаем настройки сети
    const storedIsTestnet = localStorage.getItem('isTestnet') === 'true';
    setIsTestnet(storedIsTestnet);

    // Восстанавливаем провайдер
    setUserProviderFromLocalStorage();

  }, []); // Пустой массив зависимостей, так как это должно выполняться только при монтировании

  // Добавим эффект для автоматического обновления баланса при восстановлении данных
  useEffect(() => {
    if (privateKey) {
      checkBalance();
    }
  }, [privateKey]);

  return (
    <div className='container'>

      <header className='header'>
        <div className="address-group">
          <button 
            className='shortAddress-button defaultButton ' 
            onClick={() => setShowAccountManager(true)}
          >
            {currentAccount?.name || ShortAddress}
          </button>
          <Button
            icon={<CopyFilled />}
            onClick={() => {
              navigator.clipboard.writeText(address || '');
              message.success('Address copied to clipboard');
            }}
            className='copy-button defaultButton'
          />
        </div>

        <IconButton
          icon={FaGear}
          onClick={SettingsButton}
          color="pink"
          size={24}
          className='settings-icon'
        />
      </header>



      <div className='body'>
        <div className="content">
          <div className="message-container"></div>

          <div className="column-home">
            <div className="info-home">
              <div className="important-home">
                {avatarImage && <img className='avatar' src={avatarImage} alt="Avatar" />}
                <span className='balance-home'>${totalBalanceUSD}</span>
                <Button
                  type="default"
                  onClick={checkBalance}
                  loading={loading}
                  variant='filled'
                  className='checkBalanceButton-home button-home'
                  icon={<ReloadOutlined />}
                />
              </div>

              <div className="buttonNav-home">
                <Button
                  type='default'
                  size='large'
                  onClick={handleSendClick}
                  className='qrButton-home button-home'
                  icon={<DislikeOutlined />}
                >
                  Send
                </Button>

                <Button
                  type='default'
                  size='large'
                  onClick={QrButton}
                  className='qrButton-home button-home'
                  icon={<QrcodeOutlined />}
                >
                  QRCode
                </Button>

                <Button
                  type='default'
                  size='large'
                  onClick={handleSwapClick}
                  className='qrButton-home button-home'
                  icon={<RetweetOutlined />}
                  disabled={isTestnet}
                >
                  Swap
                </Button>
              </div>
            </div>

            <div className="sectionBalance-home">
              <Button
                className='balanceButton-home'
                onClick={() => setActiveTab('tokens')}
              >
                TOKENS
              </Button>
              <Button
                className='balanceButton-home'
                onClick={() => setActiveTab('nfts')}
              >
                NFT's
              </Button>
              <Button
                className='balanceButton-home'
                onClick={() => setActiveTab('history')}
              >
                History
              </Button>
            </div>

            {renderContent()}
          </div>

        </div>
      </div>

      <AccountManager
        visible={showAccountManager}
        onClose={() => setShowAccountManager(false)}
        onSwitch={handleSwitchAccount}
        currentAccount={currentAccount}
      />
    </div>

  );
};

export default WalletInfo;