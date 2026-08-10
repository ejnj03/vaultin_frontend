import ethereumLogo from '../assets/ethereum.png';
import polygonLogo from '../assets/polygon.png';
import arbitrumLogo from '../assets/arbitrium.png';
import optimismLogo from '../assets/optimism.png';
import EURCToken from '../assets/EURC.png'
import cbBTCToken from '../assets/cbBTC.png'
import USDCToken from '../assets/USDC.png'
import baseLogo from '../assets/base.png';

export const NETWORK_LOGOS = {
  ethereum: ethereumLogo,
  polygon: polygonLogo,
  arbitrum: arbitrumLogo,
  optimism: optimismLogo,
  base: baseLogo,
};

// Token logos — native tokens use network logo, stablecoins use CoinGecko CDN
export const TOKEN_LOGOS = {
  ETH: ethereumLogo,
  POL: polygonLogo,
  USDC: USDCToken,
  USDT: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  cbBTC: cbBTCToken,
  EURC: EURCToken
};

// Network display names
export const NETWORK_NAMES = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  arbitrum: 'Arbitrum',
  optimism: 'Optimism',
  base: 'Base',
};
