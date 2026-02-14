import React from 'react'
import ReactDOM from 'react-dom/client'
import { WalletBalances, Home, MyERC, EntityIndex, LabelAnalytics } from './pages/index.jsx'
import { Web3Provider } from './Web3Provider.jsx'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout.jsx'
import { useAccount } from 'wagmi'

function IndexRoute() {
  const { isConnected } = useAccount();
  if (isConnected) return <Navigate to="/my-erc" replace />;
  return <Home />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Web3Provider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<IndexRoute />} />
          <Route path="/wallet-balances" element={<WalletBalances />} />
          <Route path="/my-erc" element={<MyERC />} />
          <Route path="/track-flows" element={<EntityIndex />} />
          <Route path="/label/:labelName" element={<LabelAnalytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </Web3Provider>
)
