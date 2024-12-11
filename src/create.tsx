import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Row, Col, Input, Alert, message } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';

import './css/create.css';
import { FaArrowLeftLong } from 'react-icons/fa6';
import IconButton from './libs/IconButton';
import LegalCheckboxes from './components/LegalCheckboxes';
import { MAINNETS, TESTNETS } from './libs/constants';

const Create: React.FC = () => {
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [error, setError] = useState(null);
  const [isButtonClicked, setIsButtonClicked] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [disabledIndexes, setDisabledIndexes] = useState<number[]>([]);
  const [userInputs, setUserInputs] = useState<string[]>([]);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [isAllCorrect, setIsAllCorrect] = useState<boolean>(false);
  const [legalChecked, setLegalChecked] = useState({
    privacy: false,
    terms: false
  });
  const [initialLegalChecked, setInitialLegalChecked] = useState({
    privacy: false,
    terms: false
  });

  const navigate = useNavigate();

  const buttonStyles = {
    background: 'rgba(0, 0, 0, 0.2)',
  }

  const generateWallet = () => {
    setIsButtonClicked(true);

    if (typeof chrome !== "undefined" && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({ action: "generateWallet" }, function(response) {
          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            setError(chrome.runtime.lastError.message);
            return;
          }
          
          if (response && response.success) {
            setWalletInfo(response.wallet);
            localStorage.setItem('walletMnemonic', response.wallet.mnemonic);
            localStorage.setItem('walletPrivateKey', response.wallet.privateKey);
            localStorage.setItem('walletAddress', response.wallet.address);
            setError(null);
          } else {
            setError(response?.error || "Failed to generate wallet");
            setWalletInfo(null);
          }
        });
      } catch (error) {
        console.error('Error:', error);
        setError(error.message);
        setWalletInfo(null);
      }
    } else {
      // Fallback для разработки
      import("ethers").then((ethers) => {
        try {
          const wallet = ethers.Wallet.createRandom();
          const walletInfo = {
            mnemonic: wallet.mnemonic.phrase,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
            address: wallet.address
          };
          setWalletInfo(walletInfo);
          localStorage.setItem('walletMnemonic', walletInfo.mnemonic);
          localStorage.setItem('walletPrivateKey', walletInfo.privateKey);
          localStorage.setItem('walletAddress', walletInfo.address);
          setError(null);
        } catch (error) {
          console.error('Error:', error);
          setError(error.message);
          setWalletInfo(null);
        }
      }).catch((error) => {
        console.error('Import error:', error);
        setError(error.message);
        setWalletInfo(null);
      });
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletInfo.mnemonic);
      setCopySuccess('Текст скопирован!');
    } catch (err) {
      setCopySuccess('Ошибка при копировании!');
    }
  };

  const MnemonicTest = () => {
    setIsTestMode(true);
    const allIndexes = Array.from({ length: 12 }, (_, i) => i);
    const shuffled = allIndexes.sort(() => 0.5 - Math.random());
    const newDisabledIndexes = shuffled.slice(0, 9);
    setDisabledIndexes(newDisabledIndexes);

    const words = walletInfo.mnemonic.split(" ");
    const newUserInputs = words.map((word, index) =>
      newDisabledIndexes.includes(index) ? word : ''
    );
    setUserInputs(newUserInputs);
  }

  const handleInputChange = (index: number, value: string) => {
    const newUserInputs = [...userInputs];
    newUserInputs[index] = value;
    setUserInputs(newUserInputs);

    const words = walletInfo.mnemonic.split(" ");
    const allCorrect = newUserInputs.every((input, idx) =>
      disabledIndexes.includes(idx) || input.toLowerCase() === words[idx].toLowerCase()
    );
    setIsAllCorrect(allCorrect);
  };

  const handleNextAfterTest = () => {
    if (!legalChecked.privacy || !legalChecked.terms) {
      message.error('Please agree to Privacy Policy and Terms of Use');
      return;
    }

    if (walletInfo) {
      localStorage.setItem('walletMnemonic', walletInfo.mnemonic);
      localStorage.setItem('walletPrivateKey', walletInfo.privateKey);
      localStorage.setItem('walletAddress', walletInfo.address);
      localStorage.setItem('walletAvatar', "");

      const newAccount = {
        id: Date.now().toString(),
        name: 'Account 1',
        privateKey: walletInfo.privateKey,
        mnemonic: walletInfo.mnemonic,
        address: walletInfo.address,
        avatar: ""
      };
      localStorage.setItem('walletAccounts', JSON.stringify([newAccount]));
      localStorage.setItem('currentAccount', JSON.stringify(newAccount));

      const isTestnet = localStorage.getItem('isTestnet') === 'true';
      const networks = isTestnet ? TESTNETS : MAINNETS;
      const defaultNetwork = Object.values(networks)[0];
      localStorage.setItem('userProvider', defaultNetwork.rpc);
      localStorage.setItem('networks', JSON.stringify(networks));

      navigate("/homeBalance");
    } else {
      message.error('Wallet generation error');
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
        <h1 className='h1-wallet-gen'>Create Wallet</h1>
      </header>

      <div className="body">
        <div className="content">
          {!isButtonClicked ? (
            <div className='content-create'>
              <LegalCheckboxes
                onChange={(privacy, terms) => setInitialLegalChecked({ privacy, terms })}
              />
              <Button 
                className='customButton customButtonGen' 
                color="default" 
                variant="filled" 
                style={buttonStyles} 
                onClick={generateWallet}
                disabled={!initialLegalChecked.privacy || !initialLegalChecked.terms}
              >
                Generate Wallet
              </Button>
            </div>
          ) : !isTestMode && walletInfo ? (
            <>
              <Alert 
                message="Save that words and dont show for others" 
                className='alert-gen' 
                style={buttonStyles} 
                icon={<ExclamationCircleFilled style={{ color: 'lightgrey' }} />} 
                showIcon 
              />
              <div className='wallet-info'>
                <PhraseDisplay
                  mnemonic={walletInfo.mnemonic}
                  disabledIndexes={disabledIndexes}
                  userInputs={userInputs}
                  handleInputChange={handleInputChange}
                  isTestMode={isTestMode}
                />
                <Button
                  className="customButton customButtonCopy"
                  color="default"
                  variant="filled"
                  style={buttonStyles}
                  onClick={copyToClipboard}
                >
                  Copy
                </Button>
                <Button
                  className="customButton customButtonNext"
                  color="default"
                  variant="filled"
                  style={{ ...buttonStyles, ...(copySuccess === '' ? { color: 'grey', borderColor: 'grey' } : {}) }}
                  disabled={copySuccess === ''}
                  onClick={MnemonicTest}
                >
                  Next
                </Button>
              </div>
            </>
          ) : isTestMode && walletInfo ? (
            <>
              <div className='wallet-info'>
                <PhraseDisplay
                  mnemonic={walletInfo.mnemonic}
                  disabledIndexes={disabledIndexes}
                  userInputs={userInputs}
                  handleInputChange={handleInputChange}
                  isTestMode={isTestMode}
                />
                {isAllCorrect && (
                  <>
                    <LegalCheckboxes
                      onChange={(privacy, terms) => setLegalChecked({ privacy, terms })}
                    />
                    <Button
                      className="customButton customButtonNext"
                      color="default"
                      variant="filled"
                      style={buttonStyles}
                      onClick={handleNextAfterTest}
                    >
                      Next
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const PhraseDisplay: React.FC<{
  mnemonic: string,
  disabledIndexes: number[],
  userInputs: string[],
  handleInputChange: (index: number, value: string) => void,
  isTestMode: boolean
}> = ({ mnemonic, disabledIndexes, userInputs, handleInputChange, isTestMode }) => {
  if (!mnemonic) return null;

  const words = mnemonic.split(" ");
  const firstColumnWords = words.slice(0, 6);
  const secondColumnWords = words.slice(6, 12);

  const renderWord = (word: string, index: number) => {
    if (!isTestMode) {
      return (
        <Input value={word} readOnly className="word-input" style={{ width: '50%', marginBottom: '10px', marginLeft: '5px' }} />
      );
    } else if (disabledIndexes.includes(index)) {
      return (
        <Input
          value={word}
          readOnly
          className="word-input"
          style={{ width: '50%', marginBottom: '10px', background: 'lightgrey' }}
        />
      );
    } else {
      const isCorrect = userInputs[index].toLowerCase() === word.toLowerCase();
      const inputStyle = {
        width: '50%',
        marginBottom: '10px',
        borderColor: userInputs[index] ? (isCorrect ? 'green' : 'red') : undefined,
      };

      return (
        <Input
          value={userInputs[index] || ''}
          onChange={(e) => handleInputChange(index, e.target.value)}
          className="word-input"
          style={inputStyle}
        />
      );
    }
  };

  return (
    <Row gutter={16} className='words-mnemonic'>
      <Col span={12} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        {firstColumnWords.map((word, index) => (
          <Row key={index} style={{ width: '100%', marginBottom: '0px', alignItems: 'center', justifyContent: 'end' }}>
            <div style={{ width: '30px', textAlign: 'center', marginBottom: '10px' }}>{index + 1}</div>
            {renderWord(word, index)}
          </Row>
        ))}
      </Col>

      <Col span={12} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        {secondColumnWords.map((word, index) => (
          <Row key={index + 6} style={{ width: '100%', marginBottom: '0px', alignItems: 'center' }}>
            {renderWord(word, index + 6)}
            <div style={{ width: '30px', textAlign: 'center', marginBottom: '10px' }}>{index + 7}</div>
          </Row>
        ))}
      </Col>
    </Row>
  );
};

export default Create;