import React, { useState } from 'react';
import { Button } from 'antd';

import "./css/popup.css";



const Popup = () => {
  // if (typeof chrome !== "undefined" && chrome.runtime) {
  //   console.log("Running in a Chrome extension environment");
  //   } else {
      // import("./background.js").then((module: typeof import("./background.js")) => {
      //   module.generateWallet().then((wallet) => {
      //     const response = undefined;
      //   });
      // }); 
  // }



  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [error, setError] = useState(null);

  const generateWallet = () => {
    // Проверяем доступность API Chrome
    if (typeof chrome !== "undefined" && chrome.runtime) {
      // Если Chrome API доступен, отправляем сообщение для генерации кошелька
      chrome.runtime.sendMessage({ action: "generateWallet" }, function(response) {
        if (response.success) {
          setWalletInfo(response.wallet);
          setError(null);
        } else {
          setError(response.error);
          setWalletInfo(null);
        }
      });
    } else {
      // Если Chrome API недоступен, выполняем динамическую загрузку модуля background.js
      import("./background.js").then((module: typeof import("./background.js")) => {
        // Вызов функции generateWallet из загруженного модуля
        module.generateWallet().then((wallet) => {
          // Обработка результата, можно установить аналогичный результат, как при использовании Chrome API
          if (wallet) {
            setWalletInfo(wallet);  // Устанавливаем данные о кошельке
            setError(null);         // Обнуляем ошибки
          } else {
            setWalletInfo(null);    // Очищаем информацию о кошельке
          }
        }).catch((error) => {
          // Обрабатываем возможные ошибки при вызове generateWallet
          setWalletInfo(null);
        });
      }).catch((error) => {
        // Обрабатываем возможные ошибки при импорте модуля background.js
        setWalletInfo(null);
      });
    }
  };

  return (
    <div className="App">
      <h1>Wallet Generator</h1>
      <Button className='button' onClick={generateWallet}>Generate Wallet</Button>
      {walletInfo && (
        <div>
          <p><strong>Mnemonic:</strong> {walletInfo.mnemonic}</p>
          <p><strong>Private Key:</strong> {walletInfo.privateKey}</p>
          <p><strong>Public Key:</strong> {walletInfo.publicKey}</p>
          <p><strong>Address:</strong> {walletInfo.address}</p>
        </div>
      )}
      {error && <p className="error">Error: {error}</p>}
    </div>
  );
};

export default Popup;