import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, List, Avatar, message, Popconfirm } from 'antd';
import { ethers } from 'ethers';
import { WalletAccount } from '../libs/types';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyFilled } from '@ant-design/icons';
import blockies from 'ethereum-blockies';
import '../css/accountManager.css';

interface AccountManagerProps {
  visible: boolean;
  onClose: () => void;
  onSwitch: (account: WalletAccount) => void;
  currentAccount: WalletAccount | null;
}

const AccountManager: React.FC<AccountManagerProps> = ({
  visible,
  onClose,
  onSwitch,
  currentAccount
}) => {
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [input, setInput] = useState('');
  const [accountName, setAccountName] = useState('');
  const [editingAccount, setEditingAccount] = useState<WalletAccount | null>(null);

  const generateAvatar = (address: string): string => {
    const avatar = blockies.create({ seed: address, size: 8, scale: 5 });
    return avatar.toDataURL();
  };

  useEffect(() => {
    const savedAccounts = localStorage.getItem('walletAccounts');
    let accountsList = savedAccounts ? JSON.parse(savedAccounts) : [];

    if (currentAccount && !accountsList.some(acc => acc.id === currentAccount.id)) {
      const accountWithAvatar = {
        ...currentAccount,
        avatar: generateAvatar(currentAccount.address)
      };
      accountsList = [accountWithAvatar, ...accountsList];
      localStorage.setItem('walletAccounts', JSON.stringify(accountsList));
    }

    accountsList = accountsList.map(acc => ({
      ...acc,
      avatar: acc.avatar || generateAvatar(acc.address)
    }));

    setAccounts(accountsList);
  }, [currentAccount]);

  const handleAddAccount = async () => {
    try {
      const trimmedInput = input.trim();
      let newAccount: WalletAccount;

      if (trimmedInput.split(' ').length === 12) {
        const wallet = ethers.Wallet.fromPhrase(trimmedInput);
        newAccount = {
          id: Date.now().toString(),
          name: accountName || `Account ${accounts.length + 1}`,
          privateKey: wallet.privateKey,
          mnemonic: trimmedInput,
          address: wallet.address,
          avatar: generateAvatar(wallet.address)
        };
      } else if (trimmedInput.startsWith('0x') && trimmedInput.length === 66) {
        const wallet = new ethers.Wallet(trimmedInput);
        newAccount = {
          id: Date.now().toString(),
          name: accountName || `Account ${accounts.length + 1}`,
          privateKey: trimmedInput,
          address: wallet.address,
          avatar: generateAvatar(wallet.address)
        };
      } else {
        throw new Error('Invalid input');
      }

      setAccounts([...accounts, newAccount]);
      setShowAddModal(false);
      setInput('');
      setAccountName('');
      message.success('Account added successfully');
    } catch (error) {
      message.error('Invalid mnemonic phrase or private key');
    }
  };

  const handleEditName = () => {
    if (editingAccount && accountName.trim()) {
      setAccounts(accounts.map(acc =>
        acc.id === editingAccount.id
          ? { ...acc, name: accountName.trim() }
          : acc
      ));
      setShowEditModal(false);
      setEditingAccount(null);
      setAccountName('');
    }
  };

  const startEdit = (account: WalletAccount) => {
    setEditingAccount(account);
    setAccountName(account.name);
    setShowEditModal(true);
  };

  const handleDeleteAccount = (accountToDelete: WalletAccount) => {
    // if (accountToDelete.id === currentAccount?.id) {
    //   message.error('Cannot delete current account');
    //   return;
    // }

    const updatedAccounts = accounts.filter(acc => acc.id !== accountToDelete.id);
    setAccounts(updatedAccounts);
    localStorage.setItem('walletAccounts', JSON.stringify(updatedAccounts));
    message.success('Account deleted successfully');
  };

  return (
    <>
      <Modal
        title="Account Manager"
        open={visible}
        onCancel={onClose}
        footer={null}
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
        <List
          className="account-list"
          dataSource={accounts}
          renderItem={account => (
            <List.Item className="account-item">
              <List.Item.Meta
                className="account-item-meta"
                avatar={<Avatar src={account.avatar} className="account-avatar" />}
                title={<div className="account-name">{account.name}</div>}
                description={
                  <div className="account-address">
                    {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                  </div>
                }
              />
              <div className="account-actions">
                <div className="buttonActions">
                  <Button
                    icon={<EditOutlined />}
                  onClick={() => startEdit(account)}
                  className="account-button defaultButton"
                />
                <Button
                  type={currentAccount?.id === account.id ? 'primary' : 'default'}
                  onClick={() => onSwitch(account)}
                  className="account-button defaultButton"
                >
                  {currentAccount?.id === account.id ? 'Current' : 'Switch'}
                  </Button>
                </div>
                <div className="secondary-actions">

                  <Button
                    icon={<CopyFilled />}
                    onClick={() => {
                      navigator.clipboard.writeText(account.address);
                      message.success('Address copied to clipboard');
                    }}
                    className="account-button defaultButton"
                  />
                  
                    <Popconfirm
                      title="Delete Account"
                      description="Are you sure you want to delete this account?"
                      onConfirm={() => handleDeleteAccount(account)}
                      okText="Yes"
                      cancelText="No"
                      placement="left"
                    >
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        className="account-button defaultButton"
                      />
                    </Popconfirm>
                </div>
              </div>
            </List.Item>
          )}
        />
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={() => setShowAddModal(true)}
          className="add-account-button defaultButton"
        >
          Add Account
        </Button>
      </Modal>

      <Modal
        title="Add Account"
        open={showAddModal}
        onOk={handleAddAccount}
        onCancel={() => setShowAddModal(false)}
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
        <Input
          placeholder="Account Name"
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
          style={{ marginBottom: '10px' }}
        />
        <Input.TextArea
          rows={4}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter mnemonic phrase or private key"
        />
      </Modal>

      <Modal
        title="Edit Account Name"
        open={showEditModal}
        onOk={handleEditName}
        onCancel={() => setShowEditModal(false)}
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
        <Input
          placeholder="Account Name"
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
        />
      </Modal>
    </>
  );
};

export default AccountManager; 