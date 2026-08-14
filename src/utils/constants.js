export const SUPPORTED_TOKENS = {
  arbitrum:  ["ETH", "USDC", "USDT"],
  polygon:   ["POL", "USDC", "USDT"],
  optimism:  ["ETH", "USDC", "USDT"],
  base:      ["ETH", "USDC"],
  ethereum:  ["ETH", "USDC", "USDT"],
};

// Verified ERC-20 contract addresses per network (lowercase)
// Used to filter out fake Transfer events and address poisoning scams
export const VERIFIED_CONTRACTS = {
  ethereum: {
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
    '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
    '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
    '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK',
    '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'UNI',
    '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9': 'AAVE',
  },
  polygon: {
    '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359': 'USDC',
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': 'USDT',
    '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': 'WETH',
  },
  base: {
    '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC',
    '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2': 'USDT',
    '0x4200000000000000000000000000000000000006': 'WETH',
  },
  optimism: {
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85': 'USDC',
    '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': 'USDT',
    '0x4200000000000000000000000000000000000006': 'WETH',
  },
  arbitrum: {
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831': 'USDC',
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': 'USDT',
    '0x82af49447d8a07e3bd95bd0d56f35241523fBab1': 'WETH',
  },
};

const SWAP_CONTRACTS = {
  ethereum: {
    "0x000000000022d473030f116ddee9f6b43ac78ba3": "Permit2",
    "0x66a9893cc07d91d95644aedd05d03f95e1dba8af": "Uniswap Universal Router",
    "0xbe05ee4ed9eb2f28c14c7af52c66ff21e1c8a5ba": "Uniswap V4 Pool Manager",
  },
  arbitrum: {
    "0x000000000022d473030f116ddee9f6b43ac78ba3": "Permit2",
    "0xa51afafe0263b40edaef0df8781ea9aa03e381a3": "Uniswap Universal Router",
    "0xa6b3e1a7e3c6b3c9b5e2ad2a3ef2a6b5b6e3c9b5": "Uniswap V4 Pool Manager",
  },
  optimism: {
    "0x000000000022d473030f116ddee9f6b43ac78ba3": "Permit2",
    "0x851116d9223fabed8e56c0e6b8ad0c31d98b3507": "Uniswap Universal Router",
    "0x9a13f53f2ba0c4d8e4c5b6a3e2d1c0b9a8e7f6d5": "Uniswap V4 Pool Manager",
  },
  polygon: {
    "0x000000000022d473030f116ddee9f6b43ac78ba3": "Permit2",
    "0x1095692a6237d83c6a72f3f5efedb9a670c49223": "Uniswap Universal Router",
    "0x67366782082b6843b6c5a8b1fc8e47e2eea68073": "Uniswap V4 Pool Manager",
  },
  base: {
    "0x000000000022d473030f116ddee9f6b43ac78ba3": "Permit2",
    "0x6ff5693b99212da76ad316178a184ab56d299b43": "Uniswap Universal Router",
    "0x498581ff718922c3f8e6a244956af099b2652b2b": "Uniswap V4 Pool Manager",
  },
}

// Flat lookup: address (lowercase) → symbol (across all networks) for quick filtering
export const VERIFIED_CONTRACTS_FLAT = Object.fromEntries(
  Object.values(VERIFIED_CONTRACTS).flatMap(contracts =>
    Object.entries(contracts).map(([addr, sym]) => [addr.toLowerCase(), sym])
  )
);

// Counterparties worth naming in the transaction feed. Without these, a swap
// through Uniswap is indistinguishable from paying a stranger — both render as
// "External" plus an address.
//
// These are the contracts vault-payments builds swaps against, copied from
// vaultin-backend: swap/v4/uniswap_v4_constants.py (UNIVERSAL_ROUTER,
// POOL_MANAGER, PERMIT2) and swap/v3/uniswap_constants.py (UNISWAP_ROUTER).
// Keep in sync with those; they are the authoritative source, since the backend
// uses them to construct the transactions this feed later displays.
//
// Quoter and StateView addresses are deliberately absent — they are read-only
// eth_call targets and never appear as a transfer counterparty.
//
// Anything not listed falls back to an eth_getCode check, which distinguishes a
// contract from a wallet even when the specific contract is unrecognised.
export const KNOWN_ADDRESSES = {
  ethereum: {
    '0x66a9893cc07d91d95644aedd05d03f95e1dba8af': 'Uniswap',
    '0x000000000004444c5dc75cb358380d2e3de08a90': 'Uniswap',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap',
    '0x000000000022d473030f116ddee9f6b43ac78ba3': 'Permit2',
    // Observed in transaction history; confirmed a contract via eth_getCode
    '0x881d40237659c251811cec9c364ef91dc08d300c': 'MetaMask Swaps',
  },
  arbitrum: {
    '0xa51afafe0263b40edaef0df8781ea9aa03e381a3': 'Uniswap',
    '0x360e68faccca8ca495c1b759fd9eee466db9fb32': 'Uniswap',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap',
    '0x000000000022d473030f116ddee9f6b43ac78ba3': 'Permit2',
  },
  optimism: {
    '0x851116d9223fabed8e56c0e6b8ad0c31d98b3507': 'Uniswap',
    '0x9a13f98cb987694c9f086b1f5eb990eea8264ec3': 'Uniswap',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap',
    '0x000000000022d473030f116ddee9f6b43ac78ba3': 'Permit2',
  },
  polygon: {
    '0x1095692a6237d83c6a72f3f5efedb9a670c49223': 'Uniswap',
    '0x67366782805870060151383f4bbff9dab53e5cd6': 'Uniswap',
    '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap',
    '0x000000000022d473030f116ddee9f6b43ac78ba3': 'Permit2',
  },
  base: {
    '0x6ff5693b99212da76ad316178a184ab56d299b43': 'Uniswap',
    '0x498581ff718922c3f8e6a244956af099b2652b2b': 'Uniswap',
    '0x2626664c2603336e57b271c5c0b26f421741e481': 'Uniswap',
    '0x000000000022d473030f116ddee9f6b43ac78ba3': 'Permit2',
  },
};

// Flat lookup: address (lowercase) → label. Safe to flatten because a 20-byte
// address is globally unique, so no chain can shadow another's entry.
export const KNOWN_ADDRESSES_FLAT = Object.fromEntries(
  Object.values(KNOWN_ADDRESSES).flatMap(addrs =>
    Object.entries(addrs).map(([addr, label]) => [addr.toLowerCase(), label])
  )
);

export const CHAIN_IDS = {
  'ethereum': '0x1',
  'polygon': '0x89',
  'base': '0x2105',
  'optimism': '0xa',
  'arbitrum': '0xa4b1',
  'sepolia': '0xaa36a7'
};

export const CHAIN_IDS_INT = {
  'ethereum': 1,
  'polygon': 137,
  'base': 8453,
  'optimism': 10,
  'arbitrum': 42161,
  'sepolia': 11155111
};
