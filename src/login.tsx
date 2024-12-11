import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, message } from 'antd';
import { ethers } from 'ethers';
import blockies from 'ethereum-blockies';
import { WalletAccount } from './libs/types';

import './css/login.css';
import { FaArrowLeftLong } from 'react-icons/fa6';
import IconButton from './libs/IconButton';
import { TESTNETS, MAINNETS } from './libs/constants';
import LegalCheckboxes from './components/LegalCheckboxes';

const { TextArea } = Input;

const Login: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [legalChecked, setLegalChecked] = useState({
    privacy: false,
    terms: false
  });

  const getAvatarFromAddress = async (address: string): Promise<string> => {
    let avatarUrl = "";
    while (avatarUrl.length < 240) {
      const avatar = blockies.create({ seed: address, size: 8, scale: 5 });
      avatarUrl = avatar.toDataURL();
    }
    return avatarUrl;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const validateAndLogin = async () => {
    if (!legalChecked.privacy || !legalChecked.terms) {
      message.error('Please agree to Privacy Policy and Terms of Use');
      return;
    }

    setLoading(true);
    try {
      const trimmedInput = input.trim();
      
      // Проверяем, явлется ли ввод мнемонической фразой
      const words = trimmedInput.split(/\s+/);
      if (words.length === 12) {
        try {
          const wallet = ethers.Wallet.fromPhrase(trimmedInput);
          const avatar = await getAvatarFromAddress(wallet.address);
          
          const newAccount: WalletAccount = {
            id: Date.now().toString(),
            name: 'Account 1',
            privateKey: wallet.privateKey,
            mnemonic: trimmedInput,
            address: wallet.address,
            avatar: avatar
          };

          // Сохраняем все необходимые данные
          localStorage.setItem('walletAccounts', JSON.stringify([newAccount]));
          localStorage.setItem('currentAccount', JSON.stringify(newAccount));
          localStorage.setItem('walletMnemonic', trimmedInput);
          localStorage.setItem('walletPrivateKey', wallet.privateKey);
          localStorage.setItem('walletAddress', wallet.address); // Добавляем сохранение адреса
          localStorage.setItem('walletAvatar', avatar);

          // Устанавливаем начальные настройки сети
          const isTestnet = localStorage.getItem('isTestnet') === 'true';
          const networks = isTestnet ? TESTNETS : MAINNETS;
          const defaultNetwork = Object.values(networks)[0];
          localStorage.setItem('userProvider', defaultNetwork.rpc);
          localStorage.setItem('networks', JSON.stringify(networks));

          message.success({
            content: 'Successfully logged in with mnemonic phrase!',
            duration: 1.5,
          });
          
          navigate('/homeBalance');
          return;
        } catch (error) {
          throw new Error('Invalid mnemonic phrase');
        }
      }

      // Проверяем, является ли ввод приватным ключом
      if (trimmedInput.startsWith('0x') && trimmedInput.length === 66) {
        try {
          const wallet = new ethers.Wallet(trimmedInput);
          const avatar = await getAvatarFromAddress(wallet.address);

          const newAccount: WalletAccount = {
            id: Date.now().toString(),
            name: 'Account 1',
            privateKey: trimmedInput,
            address: wallet.address,
            avatar: avatar
          };

          // Сохраняем все необходимые данные
          localStorage.setItem('walletAccounts', JSON.stringify([newAccount]));
          localStorage.setItem('currentAccount', JSON.stringify(newAccount));
          localStorage.setItem('walletPrivateKey', trimmedInput);
          localStorage.setItem('walletAddress', wallet.address); // Добавляем сохранение адреса
          localStorage.setItem('walletAvatar', avatar);

          // Устанавливаем начальные настройки сети
          const isTestnet = localStorage.getItem('isTestnet') === 'true';
          const networks = isTestnet ? TESTNETS : MAINNETS;
          const defaultNetwork = Object.values(networks)[0];
          localStorage.setItem('userProvider', defaultNetwork.rpc);
          localStorage.setItem('networks', JSON.stringify(networks));

          message.success({
            content: 'Successfully logged in with private key!',
            duration: 1.5,
          });
          
          navigate('/homeBalance');
          return;
        } catch (error) {
          throw new Error('Invalid private key');
        }
      }

      throw new Error('Please enter a valid 12-word mnemonic phrase or private key');

    } catch (error) {
      console.error('Error during login:', error);
      message.error({
        content: error.message || 'Login error occurred',
        duration: 1.5,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    message.config({
      getContainer: () => document.querySelector('.message-container') || document.body,
    });
  }, []);

  return (
    <div className='container'>
      <header className="header">
        <IconButton 
          className="back-icon" 
          icon={<FaArrowLeftLong style={{ fill: 'pink' }} size={24} />} 
          onClick={() => navigate(-1)} 
        />
        <h1>Login to Wallet</h1>
      </header>

      <div className="body">
        <div className="content">
          <div className="message-container"></div>

          <p>Enter your 12-word mnemonic phrase or private key:</p>
          <TextArea
            rows={4}
            value={input}
            onChange={handleInputChange}
            placeholder="Mnemonic phrase or private key"
            className='input-field'
          />

          <LegalCheckboxes
            onChange={(privacy, terms) => setLegalChecked({ privacy, terms })}
          />

          <Button
            type="primary"
            onClick={validateAndLogin}
            loading={loading}
            className='login-button'
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;