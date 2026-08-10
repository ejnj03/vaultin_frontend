import React from 'react'
import ReactDOM from 'react-dom/client'
import { LandingPage, Dashboard, Wallet, Contacts, RequestsInbox, Settings } from './pages/index.jsx'
import Trade from './pages/Trade.jsx'
import Onboarding from './pages/Onboarding.jsx'
import { Web3Provider } from './Web3Provider.jsx'
import { CryptoDataProvider } from './contexts/CryptoDataContext.jsx'
import { UserProvider } from './contexts/UserContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout.jsx'
import { useAccount } from 'wagmi'

function IndexRoute() {
  const { isConnected } = useAccount();
  if (isConnected) return <Navigate to="/wallet" replace />;
  return <LandingPage />;
}

// Redirect /swap, /transfer, /request to /trade?tab=...
function TradeRedirect({ tab }) {
  return <Navigate to={`/trade?tab=${tab}`} replace />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Web3Provider>
    <UserProvider>
    <CryptoDataProvider>
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>

          <Route index element={<IndexRoute />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/swap" element={<TradeRedirect tab="swap" />} />
          <Route path="/transfer" element={<TradeRedirect tab="transfer" />} />
          <Route path="/request" element={<TradeRedirect tab="request" />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/requests" element={<RequestsInbox />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
    </CryptoDataProvider>
    </UserProvider>
  </Web3Provider>
)
