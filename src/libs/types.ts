// types.ts
export interface NetworkConfig {
    name: string;
    symbol: string;
    rpc: string;
    scanner: string;
    scannerKey: string;
    currency: string;
    chainId: number;
    explorer: string;
    imageUrl: string;
}

export interface Networks {
    [key: string]: {
        name: string;
        symbol: string;
        rpc: string;
        scanner: string;
        scannerKey: string;
        currency: string;
        chainId: number;
        explorer: string;
        imageUrl: string;
    };
}

export interface TokenBalance {
    symbol: string;
    name: string;
    balance: string;
    address: string;
    decimals: number;
    network: string;
    networkName: string;
    price?: number;
    imageUrl?: string;
    networkImageUrl?: string;
}

export interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timestamp: number;
    tokenSymbol?: string;
    tokenAmount?: string;
    type: 'send' | 'receive' | 'swap';
    network: string;
    status: 'success' | 'failed' | 'pending';
}

export interface NFTBalance {
    tokenId: string;
    contractAddress: string;
    name: string;
    symbol: string;
    network: string;
    networkName: string;
    timestamp: number;
}

export interface WalletAccount {
    id: string;
    name: string;
    privateKey: string;
    mnemonic?: string;
    address: string;
    avatar?: string;
}
