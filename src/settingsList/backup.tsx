import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal, message } from 'antd';
import { FaArrowLeftLong } from 'react-icons/fa6';
import IconButton from '../libs/IconButton';
import { CopyOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

import "../css/backup.css";

const { TextArea } = Input;

const Backup: React.FC = () => {
  const navigate = useNavigate();
  const [mnemonic, setMnemonic] = useState<string>('');
  const [privateKey, setPrivateKey] = useState<string>('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedData, setSelectedData] = useState<'mnemonic' | 'privateKey' | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [dataVisible, setDataVisible] = useState(false);

  useEffect(() => {
    const storedMnemonic = localStorage.getItem('walletMnemonic') || '';
    const storedPrivateKey = localStorage.getItem('walletPrivateKey') || '';
    setMnemonic(storedMnemonic);
    setPrivateKey(storedPrivateKey);
  }, []);

  const handleCopy = (type: 'mnemonic' | 'privateKey') => {
    setSelectedData(type);
    setShowWarningModal(true);
  };

  const handleConfirmCopy = async () => {
    try {
      if (selectedData === 'mnemonic' && mnemonic) {
        await navigator.clipboard.writeText(mnemonic);
        message.success('Mnemonic phrase copied to clipboard');
      } else if (selectedData === 'privateKey' && privateKey) {
        await navigator.clipboard.writeText(privateKey);
        message.success('Private key copied to clipboard');
      }
    } catch (error) {
      message.error('Failed to copy to clipboard');
    }
    setShowWarningModal(false);
  };

  const handleShowData = () => {
    setShowWarningModal(true);
  };

  const handleConfirmShowData = () => {
    setDataVisible(true);
    setShowWarningModal(false);
  };

  const maskText = (text: string) => '•'.repeat(text.length);

  useEffect(() => {
    message.config({
        getContainer: () => document.querySelector('.message-container') || document.body,
    });
}, []);

  return (
    <div className="container">
      <header className="header">
        <IconButton
          className="back-icon"
          icon={<FaArrowLeftLong style={{ fill: 'pink' }} size={24} />}
          onClick={() => navigate(-1)}
        />
        <h1>Backup Wallet</h1>
      </header>

      <div className="body">
        <div className="content">
        <div className="message-container"></div>
          {!dataVisible ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Button
                type="primary"
                onClick={handleShowData}
                style={{ marginTop: '20px' }}
              >
                Show Wallet Credentials
              </Button>
              <p style={{ marginTop: '10px', color: 'gray' }}>
                Click to view your wallet credentials
              </p>
            </div>
          ) : (
            <div className="textAreas-backup">
              {mnemonic && (
                <>
                  <h3>Mnemonic Phrase</h3>
                  <div style={{ position: 'relative' }}>
                    <TextArea
                      className='textArea-backup'
                      value={showMnemonic ? mnemonic : maskText(mnemonic)}
                      readOnly
                      rows={4}
                      style={{ marginBottom: '10px' }}
                    />
                    
                  </div>
                  <div className="buttons-backup">
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy('mnemonic')}
                  >
                    Copy Mnemonic
                  </Button>
                  <Button
                    icon={showMnemonic ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={() => setShowMnemonic(!showMnemonic)}
                    />
                  </div>
                </>
              )}

              {privateKey && (
                <>
                  <h3 style={{ marginTop: '20px' }}>Private Key</h3>
                  <div style={{ position: 'relative' }}>
                    <TextArea
                      className='textArea-backup'
                      value={showPrivateKey ? privateKey : maskText(privateKey)}
                      readOnly
                      rows={2}
                      style={{ marginBottom: '10px' }}
                    />
                    
                  </div>
                  <div className="buttons-backup">
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => handleCopy('privateKey')}
                  >
                    Copy Private Key
                  </Button>
                  <Button
                      icon={showPrivateKey ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          <Modal
            title="⚠️ Security Warning"
            open={showWarningModal}
            onOk={selectedData ? handleConfirmCopy : handleConfirmShowData}
            onCancel={() => setShowWarningModal(false)}
            okText="I understand, proceed anyway"
            cancelText="Cancel"
            className="backup-modal"
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
            <p style={{ color: 'red', fontWeight: 'bold' }}>
              WARNING: Never share your mnemonic phrase or private key with anyone!
            </p>
            <p>Anyone with access to these credentials will have full control over your wallet.</p>
            <p>The developer is not responsible for any loss of funds due to sharing these credentials.</p>
            <p>Are you sure you want to {selectedData ? 'copy' : 'view'} this sensitive information?</p>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Backup; 