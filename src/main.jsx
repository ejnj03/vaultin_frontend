import React from 'react'
import ReactDOM from 'react-dom/client'
import { LandingPage, Portfolio, Transfer, Contacts, Requests, Dashboard, Swap } from './pages/index.jsx'
import { Web3Provider } from './Web3Provider.jsx'
import { CryptoDataProvider } from './contexts/CryptoDataContext.jsx'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './Layout.jsx'
import { useAccount } from 'wagmi'

function IndexRoute() {
  const { isConnected } = useAccount();
  if (isConnected) return <Navigate to="/portfolio" replace />;
  return <LandingPage />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Web3Provider>
    <CryptoDataProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>

          <Route index element={<IndexRoute />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/swap" element={<Swap />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </CryptoDataProvider>
  </Web3Provider>
)
