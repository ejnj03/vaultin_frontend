import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = "https://9djqt1k5r5.execute-api.us-east-1.amazonaws.com"

const CryptoDataContext = createContext(null);

export function CryptoDataProvider({ children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/prices`)
      .then(res => res.json())
      .then(result => {
        setData(result);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <CryptoDataContext.Provider value={{ data, loading }}>
      {children}
    </CryptoDataContext.Provider>
  );
}

export function useCryptoData() {
  return useContext(CryptoDataContext);
}
