import { ethers } from 'ethers';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateWallet") {
    (async () => {
      try {
        const wallet = ethers.Wallet.createRandom();
        const response = {
          success: true,
          wallet: {
            mnemonic: wallet.mnemonic.phrase,
            privateKey: wallet.privateKey,
            publicKey: wallet.publicKey,
            address: wallet.address
          }
        };
        sendResponse(response);
      } catch (error) {
        console.error('Wallet generation error:', error);
        sendResponse({
          success: false,
          error: error.message
        });
      }
    })();
    return true;
  }
});
