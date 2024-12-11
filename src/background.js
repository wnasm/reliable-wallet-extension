
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { privateToPublic } from 'ethereumjs-util';
import { HDNodeWallet } from 'ethers';
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Функция для генерации кошелька
async function generateWallet() {
    // Генерация мнемонической фразы
    const mnemonic = generateMnemonic();

    // Создание seed из мнемоники
    const seed = mnemonicToSeedSync(mnemonic);

    // Создание HD кошелька с использованием ethers.js
    const hdWallet = HDNodeWallet.fromSeed(seed);

    // Деривация для первого адреса по пути "m/44'/60'/0'/0/0"
    const wallet = hdWallet.derivePath("m/44'/60'/0'/0/0");

    // Приватный ключ
    const privateKey = wallet.privateKey;

    // Публичный ключ
    const publicKeyBuf = privateToPublic(Buffer.from(privateKey.slice(2), 'hex'));
    const publicKey = "0x" + publicKeyBuf.toString('hex');

    // Адрес кошелька
    const address = wallet.address;

    return {
        mnemonic: mnemonic,
        privateKey: privateKey,
        publicKey: publicKey,
        address: address
    };
}

export { generateWallet };

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//     if (request.action === "generateWallet") {
//         generateWallet().then(wallet => {
//             sendResponse({ success: true, wallet: wallet });
//         }).catch(error => {
//             sendResponse({ success: false, error: error.message });
//         });
//         return true; // Indicate that we will send a response asynchronously
//     }
// });
