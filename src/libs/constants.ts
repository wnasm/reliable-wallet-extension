import networksConfig from '../config/networks.json';

export const MAINNETS = networksConfig.mainnets;
export const TESTNETS = networksConfig.testnets;

// ERC20 ABI для работы с токенами
export const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function transfer(address to, uint amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint value) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint amount)"
];

// Адрес и ABI роутера Uniswap для свапов
export const UNISWAP_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

export const UNISWAP_ROUTER_ABI = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
    'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
    'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
    'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
];

// Alchemy API ключ (если используется)
export const ALCHEMY_API_KEY = 't7bZADDohemojL-KHr4ecd6_VDC1PmZ-';

// Преобразуем networks.json в правильный формат для TypeScript
export const NETWORKS = {
    ...networksConfig.mainnets,
    ...networksConfig.testnets
};

// Функция для получения конфигурации сети
export const getNetworkConfig = (networkId: string, isTestnet: boolean) => {
    const networks = isTestnet ? TESTNETS : MAINNETS;
    return networks[networkId];
};

// Остальные константы...