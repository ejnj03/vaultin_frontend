import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, arbitrum, polygon } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

// This defines how your app connects to blockchains
const config = createConfig(
  getDefaultConfig({
    // Which blockchains your app supports
    //just mainnet for now
    chains: [mainnet],
    
    // RPC endpoints - how to talk to each blockchain
    transports: {
      [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`),
      [arbitrum.id]: http(`https://arb-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`),
      [polygon.id]: http(`https://polygon-mainnet.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`),
    },

    // WalletConnect configuration
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,

    // App metadata (shows in wallet when connecting)
    appName: "Vault.io",
    appDescription: "Automate Your Wallet with Vault",
    appUrl: "https://vault.io",
  }),
);

// Handles caching of blockchain data
const queryClient = new QueryClient();

// This wraps your app and provides wallet context
export const Web3Provider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
            customTheme={{
                "--ck-connectbutton-font-size": "20px",        // Larger text
                "--ck-connectbutton-font-weight": "600",       // Semibold (400=normal, 600=semibold, 700=bold)
            }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
