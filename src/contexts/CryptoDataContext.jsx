import { createContext, useContext, useRef, useState, useEffect } from 'react';
import { useUser } from './UserContext';

const COINBASE_WS_URL = 'wss://ws-feed.exchange.coinbase.com';
const USD = {'ETH-USD':"eth", 'POL-USD':"pol", 'SOL-USD': "sol"};

const CryptoDataContext = createContext(null);

export function CryptoDataProvider({ children }) {
  const { userData } = useUser();
  const [data, setData] = useState({"usdc":{"usd":1.00}, "usdt":{"usd":1.00}});
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null)

  useEffect(() => {
    if (!userData?.username) return;

    //connect to ws stream
    function connect() {
      const ws = new WebSocket(COINBASE_WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        //subscribe to websocket on open
        ws.send(JSON.stringify({
          type: "subscribe",
          product_ids: Object.keys(USD),
          channels: ['ticker']
        }))
      }

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        //console.log(msg)
        if (msg.type !== 'ticker') return

        //const tickers = msg.events?.flatMap(e => e.tickers ?? []) ?? [];
        const tickers = [msg]
        if (tickers.length === 0) return

        setData(prev => {
          const updated = { ...(prev ?? {}) };

          for (const ticker of tickers) {
            const token_id = USD[ticker.product_id]
            if (!(token_id in updated)) {
              updated[token_id] = {}
            }
            updated[token_id].usd = parseFloat(ticker.price)
          }
          return updated
        })
        setLoading(false)
      }

      ws.onclose = () => {
        if (!wsRef.current) return //dont reconnect if deliberately closed
        reconnectRef.current = setTimeout(connect, 2000)
      }

      ws.onerror = () => ws.close()
    }

    connect();
    
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current = null
      wsRef.current?.close()
    }
  }, [userData?.username]);

  return (
    <CryptoDataContext.Provider value={{ data, loading }}>
      {children}
    </CryptoDataContext.Provider>
  );
}

export function useCryptoData() {
  return useContext(CryptoDataContext);
}
