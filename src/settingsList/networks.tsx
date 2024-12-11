import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, Button, Switch, Space, Typography, List, Avatar } from 'antd';
import { FaArrowLeftLong } from 'react-icons/fa6';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import IconButton from '../libs/IconButton';
import { MAINNETS, TESTNETS } from '../libs/constants';
import { NetworkConfig } from '../libs/types';
import AddNetwork from '../components/AddNetwork';
import CustomSwitch from '../components/CustomSwitch';

import '../css/networks.css';

const { Option } = Select;
const { Text } = Typography;

const Networks: React.FC = () => {
  const navigate = useNavigate();
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [isTestnet, setIsTestnet] = useState<boolean>(false);
  const [customNetworks, setCustomNetworks] = useState<{ [key: string]: NetworkConfig }>({});
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const storedIsTestnet = localStorage.getItem('isTestnet') === 'true';
    setIsTestnet(storedIsTestnet);

    // Загружаем пользовательские сети
    const storedCustomNetworks = localStorage.getItem('customNetworks');
    if (storedCustomNetworks) {
      setCustomNetworks(JSON.parse(storedCustomNetworks));
    }

    // Get current provider from localStorage
    const storedProvider = localStorage.getItem('userProvider');
    if (storedProvider) {
      setSelectedProvider(storedProvider);
    } else {
      const defaultNetwork = storedIsTestnet ? Object.values(TESTNETS)[0] : Object.values(MAINNETS)[0];
      setSelectedProvider(defaultNetwork.rpc);
    }
  }, []);

  const handleNetworkTypeChange = (checked: boolean) => {
    setIsTestnet(checked);
    const defaultNetwork = checked ? Object.values(TESTNETS)[0] : Object.values(MAINNETS)[0];
    setSelectedProvider(defaultNetwork.rpc);
  };

  const getCurrentNetworks = () => {
    const baseNetworks = isTestnet ? TESTNETS : MAINNETS;
    const currentCustomNetworks = Object.entries(customNetworks)
      .filter(([_, network]) => network.chainId > (isTestnet ? 0 : 1000000))
      .reduce((acc, [key, network]) => ({ ...acc, [key]: network }), {});

    return { ...baseNetworks, ...currentCustomNetworks };
  };

  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
  };

  const handleAddNetwork = (network: NetworkConfig) => {
    const networkId = network.name.toLowerCase().replace(/\s+/g, '');
    const newCustomNetworks = {
      ...customNetworks,
      [networkId]: network
    };
    setCustomNetworks(newCustomNetworks);
    localStorage.setItem('customNetworks', JSON.stringify(newCustomNetworks));
  };

  const handleDeleteNetwork = (networkId: string) => {
    const newCustomNetworks = { ...customNetworks };
    delete newCustomNetworks[networkId];
    setCustomNetworks(newCustomNetworks);
    localStorage.setItem('customNetworks', JSON.stringify(newCustomNetworks));
  };

  const handleSave = () => {
    localStorage.setItem('userProvider', selectedProvider);
    localStorage.setItem('isTestnet', isTestnet.toString());
    localStorage.setItem('networks', JSON.stringify(getCurrentNetworks()));
    navigate(-1);
  };

  const networks = getCurrentNetworks();

  return (
    <div className="container">
      <header className="header">
        <IconButton
          className="back-icon"
          icon={<FaArrowLeftLong style={{ fill: 'pink' }} size={24} />}
          onClick={() => navigate(-1)}
        />
        <h1>Network Settings</h1>
      </header>

      <div className="body">
        <div className="content">
          <Space direction="vertical" size="large" className='networksContainer-settings'>
            <Space className='switch-settings'>
              <Text>Mainnet</Text>
              <CustomSwitch
                checked={isTestnet}
                onChange={handleNetworkTypeChange}
                activeColor="pink"
                inactiveColor="rgba(255, 255, 255, 0.2)"
              />
              <Text>Testnet</Text>
            </Space>

            <List
              className='networksList-settings'
              dataSource={Object.entries(networks)}
              renderItem={([key, network]) => (
                <List.Item
                  actions={[
                    customNetworks[key] && (
                      <Button
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteNetwork(key)}
                        danger
                      />
                    )
                  ]}
                >
                  <List.Item.Meta

                    avatar={network.imageUrl && <Avatar className='network-avatar' src={network.imageUrl} />}
                    title={network.name}
                    description={`Chain ID: ${network.chainId}`}
                    style={{ color: 'white' }}

                  />
                </List.Item>
              )}
            />

            {/* <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => navigate('/addNetwork')}
              block
            >
              Add Custom Network
            </Button> */}

            <Button type="primary" onClick={handleSave} className='saveButton-settings'>
              Save Changes
            </Button>

          </Space>
        </div>
      </div>

      <AddNetwork
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddNetwork}
        isTestnet={isTestnet}
      />
    </div>
  );
};

export default Networks;
