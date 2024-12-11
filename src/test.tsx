import React, { useState, useEffect } from 'react';
import { Typography, Spin } from 'antd';
import { MultiChainWalletScanner } from './libs/scanner';
import { TokenBalance } from './libs/types';
// import { NETWORKS } from './libs/constants';

import './css/test.css';

const { Title } = Typography;

const Test: React.FC = () => {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setError(null);
        const scanner = new MultiChainWalletScanner(
          '0xf47036897bd32eb2dac88498b7440fd6ab2a2194a580feaccd8e6bce747a001f'
        );

        // Сначала получаем балансы без цен
        const balances = await scanner.getAllTokenBalances();
        setTokens(balances); // Показываем балансы пользователю

        // Затем обновляем цены
        //     const enrichedTokens = await scanner.getTokenPrices(balances);
        //     setTokens(prevTokens =>
        //       prevTokens.map(token => ({
        //         ...token,
        //         price: enrichedTokens[token.symbol] || 0
        //       }))
        //     );
        //   } catch (error) {
        //     console.error('Error fetching tokens:', error);
        //     setError('Failed to fetch token data. Please try again later.');
        //   } finally {
        //     setLoading(false);
        //   }
        // };

        const enrichedTokens = await scanner.getEnrichedTokenBalances();
        setTokens(enrichedTokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Failed to fetch token data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  if (loading && tokens.length === 0) {
    return (
      <div className="container flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }



  return (
    <div className="container">
      1
      {/* <header className="header">
        <Title level={2}>Your Tokens</Title>
      </header>

      <div className="body">
        <div className="content">
          {tokens.map((token, index) => (
            <div
              key={`${token.network}-${token.address}-${index}`}
              className="token-test"
            >
              <div className="token-image-container">
                {token.imageUrl && <img className="image-test" src={token.imageUrl} alt={token.name} />} */}
                {/* {token.address !== 'native' && NETWORKS[token.network]?.imageUrl && (
                  <img 
                    className="networkIcon-test" 
                    src={NETWORKS[token.network].imageUrl} 
                    alt={NETWORKS[token.network].name} 
                  />
                )} */}
              {/* </div>
              <p className="tokenName-test">
                {token.name} ({token.symbol})
              </p>
              <div className="token-test">
                <p>Balance: {parseFloat(token.balance).toFixed(3)}</p>
                <p>Price: {token.price ? `$${token.price.toFixed(4)}` : 'Loading...'}</p>
                <p>Balance in $: {token.price && token.balance ? `$${(token.price * parseFloat(token.balance as string)).toFixed(2)}` : 'Loading...'}</p>
              </div>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
};

export default Test;