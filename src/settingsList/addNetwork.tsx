import React, { useEffect, useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import IconButton from '../libs/IconButton';
import { NetworkConfig } from '../libs/types';

import '../css/addNetwork.css';
import { MAINNETS } from '../libs/constants';
import { TESTNETS } from '../libs/constants';

const AddNetworkPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isTestnet = localStorage.getItem('isTestnet') === 'true';

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      // Определяем параметры сканера на основе chainId
      let scanner = values.scanner || '';
      let scannerKey = values.scannerKey || '';
      let explorer = values.explorer || '';

      const newNetwork: NetworkConfig = {
        name: values.name,
        symbol: values.symbol,
        rpc: values.rpc,
        scanner: scanner,
        scannerKey: scannerKey,
        currency: values.currency || values.symbol,
        chainId: parseInt(values.chainId),
        explorer: explorer,
        imageUrl: values.imageUrl || ''
      };

      // Проверяем подключение к RPC
      try {
        const response = await fetch(values.rpc, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_chainId',
            params: [],
            id: 1
          })
        });

        if (!response.ok) {
          throw new Error('Failed to connect to RPC endpoint');
        }

        const data = await response.json();
        const chainIdFromRPC = parseInt(data.result, 16);

        if (chainIdFromRPC !== parseInt(values.chainId)) {
          throw new Error('Chain ID mismatch');
        }

        // Сохраняем новую сеть
        const storedCustomNetworks = localStorage.getItem('customNetworks');
        const customNetworks = storedCustomNetworks ? JSON.parse(storedCustomNetworks) : {};

        const networkId = values.name.toLowerCase().replace(/\s+/g, '');
        customNetworks[networkId] = newNetwork;

        localStorage.setItem('customNetworks', JSON.stringify(customNetworks));
        
        // Обновляем networks в localStorage
        const isTestnet = localStorage.getItem('isTestnet') === 'true';
        const baseNetworks = isTestnet ? TESTNETS : MAINNETS;
        const networks = {
          ...baseNetworks,
          [networkId]: newNetwork
        };
        localStorage.setItem('networks', JSON.stringify(networks));

        message.success('Network added successfully');
        navigate(-1);

      } catch (error) {
        message.error('Failed to validate RPC endpoint');
        return;
      }
    } catch (error) {
      message.error('Please fill all required fields correctly');
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
    <div className="container">
      <header className="header">
        <IconButton
          className="back-icon"
          icon={<FaArrowLeftLong style={{ fill: 'pink' }} size={24} />}
          onClick={() => navigate(-1)}
        />
        <p>Add {isTestnet ? 'Testnet' : 'Mainnet'} Network</p>
      </header>

      <div className="body">
        <div className="content">
          <div className="message-container"></div>
          <Form
            form={form}
            layout="vertical"
            className="add-network-form"
          >
            <Form.Item
              name="name"
              label="Network Name"
              rules={[{ required: true, message: 'Please input network name' }]}
            >
              <Input placeholder="e.g. Ethereum" />
            </Form.Item>

            <Form.Item
              name="symbol"
              label="Native Currency Symbol"
              rules={[{ required: true, message: 'Please input currency symbol' }]}
            >
              <Input placeholder="e.g. ETH" />
            </Form.Item>

            <Form.Item
              name="rpc"
              label="RPC URL"
              rules={[
                { required: true, message: 'Please input RPC URL' },
                { type: 'url', message: 'Please enter a valid URL' }
              ]}
            >
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item
              name="chainId"
              label="Chain ID"
              rules={[
                { required: true, message: 'Please input chain ID' },
                { pattern: /^\d+$/, message: 'Please enter a valid number' }
              ]}
            >
              <Input placeholder="e.g. 1" />
            </Form.Item>

            <Form.Item
              name="scanner"
              label="Block Explorer API URL (Optional)"
            >
              <Input placeholder="https://api..." />
            </Form.Item>

            <Form.Item
              name="scannerKey"
              label="Block Explorer API Key (Optional)"
            >
              <Input placeholder="Your API key" />
            </Form.Item>

            <Form.Item
              name="explorer"
              label="Block Explorer URL (Optional)"
            >
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item
              name="imageUrl"
              label="Network Logo URL (Optional)"
            >
              <Input placeholder="https://..." />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                block
              >
                Add Network
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AddNetworkPage; 