import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { NetworkConfig } from '../libs/types';

interface AddNetworkProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (network: NetworkConfig) => void;
  isTestnet: boolean;
}

const AddNetwork: React.FC<AddNetworkProps> = ({ visible, onClose, onAdd, isTestnet }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const newNetwork: NetworkConfig = {
        name: values.name,
        symbol: values.symbol,
        rpc: values.rpc,
        scanner: values.scanner || '',
        scannerKey: values.scannerKey || '',
        currency: values.currency,
        chainId: parseInt(values.chainId),
        explorer: values.explorer || '',
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
      } catch (error) {
        message.error('Failed to validate RPC endpoint');
        return;
      }

      onAdd(newNetwork);
      form.resetFields();
      onClose();
      message.success('Network added successfully');
    } catch (error) {
      message.error('Please fill all required fields correctly');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Add ${isTestnet ? 'Testnet' : 'Mainnet'} Network`}
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Add Network
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
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
      </Form>
    </Modal>
  );
};

export default AddNetwork; 