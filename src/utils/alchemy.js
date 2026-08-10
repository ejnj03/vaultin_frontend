import { Alchemy, Network } from "alchemy-sdk";

const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

export const GAS_FEE_LIMIT = 50;
export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const alchemyInstances = {
  ethereum: new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.ETH_MAINNET }),
  arbitrum: new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.ARB_MAINNET }),
  polygon:  new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.MATIC_MAINNET }),
  optimism: new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.OPT_MAINNET }),
  base:     new Alchemy({ apiKey: ALCHEMY_KEY, network: Network.BASE_MAINNET }),
};
