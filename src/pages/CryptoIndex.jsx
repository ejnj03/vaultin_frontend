import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useCryptoData } from "../contexts/CryptoDataContext"

function formatCurrency(value) {
  if (value == null) return '—';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(6)}`;
}

function formatPrice(value) {
  if (value == null) return '—';
  if (value >= 1) return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toFixed(6)}`;
}

function PctBadge({ value }) {
  if (value == null) return <span className="text-base-content/30">—</span>;
  const up = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium ${up ? 'text-success' : 'text-error'}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-3 h-3 ${up ? '' : 'rotate-180'}`}>
        <path fillRule="evenodd" d="M8 3.293l4.354 4.354-.708.707L8.5 5.207V12.5h-1V5.207L4.354 8.354l-.708-.707L8 3.293z" clipRule="evenodd" />
      </svg>
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

const SORT_OPTIONS = [
  { key: 'market_cap_rank', label: 'Market Cap' },
  { key: 'price_change_percentage_1h_in_currency', label: '1h Change' },
  { key: 'price_change_percentage_24h', label: '24h Change' },
  { key: 'price_change_percentage_7d_in_currency', label: '7d Change' },
  { key: 'total_volume', label: 'Volume' },
];

export default function CryptoIndex() {
  const { data, loading } = useCryptoData()
  const [sortBy, setSortBy] = useState('market_cap_rank')
  const [sortAsc, setSortAsc] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = [...data];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const av = a[sortBy] ?? 0;
      const bv = b[sortBy] ?? 0;
      return sortAsc ? av - bv : bv - av;
    });

    return list;
  }, [data, sortBy, sortAsc, search]);

  const stats = useMemo(() => {
    if (!data) return null;
    const totalMcap = data.reduce((s, c) => s + (c.market_cap || 0), 0);
    const totalVol = data.reduce((s, c) => s + (c.total_volume || 0), 0);
    const gainers = data.filter(c => (c.price_change_percentage_24h || 0) > 0).length;
    return { totalMcap, totalVol, count: data.length, gainers };
  }, [data]);

  function handleSort(key) {
    if (sortBy === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(key);
      setSortAsc(key === 'market_cap_rank');
    }
  }

  function SortIcon({ col }) {
    if (sortBy !== col) return null;
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={`w-3 h-3 inline ml-0.5 transition-transform ${sortAsc ? '' : 'rotate-180'}`}>
        <path fillRule="evenodd" d="M8 3.293l4.354 4.354-.708.707L8.5 5.207V12.5h-1V5.207L4.354 8.354l-.708-.707L8 3.293z" clipRule="evenodd" />
      </svg>
    );
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-[1200px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Crypto Markets</h1>
            <p className="text-sm text-base-content/40 mt-1">Real-time prices and market data</p>
          </div>
        </div>
        <div className="bg-base-200 rounded-box border border-base-content/5 flex flex-col items-center justify-center py-20 px-6">
          <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
          <h2 className="text-xl font-bold text-base-content/70 mb-2">Loading Markets...</h2>
          <p className="text-sm text-base-content/40">Fetching latest prices and market data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crypto Markets</h1>
          <p className="text-sm text-base-content/40 mt-1">Real-time prices and market data</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm bg-base-200 border border-base-content/10 focus:border-primary/40 focus:outline-none pl-9 w-48 sm:w-56 rounded-full text-sm"
            />
          </div>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm border border-base-content/10 hover:border-primary/30 gap-1.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              <span className="hidden sm:inline text-xs">Sort</span>
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-200 rounded-box z-10 w-44 p-1 shadow-lg border border-base-content/5 mt-2">
              {SORT_OPTIONS.map(opt => (
                <li key={opt.key}>
                  <button
                    onClick={() => handleSort(opt.key)}
                    className={`text-sm ${sortBy === opt.key ? 'text-primary font-medium' : ''}`}
                  >
                    {opt.label}
                    {sortBy === opt.key && (
                      <span className="text-xs text-base-content/40 ml-auto">{sortAsc ? 'Asc' : 'Desc'}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-base-200 rounded-box p-5 border border-base-content/5">
            <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium mb-1">Total Market Cap</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalMcap)}</p>
          </div>
          <div className="bg-base-200 rounded-box p-5 border border-base-content/5">
            <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium mb-1">24h Volume</p>
            <p className="text-2xl font-bold text-secondary">{formatCurrency(stats.totalVol)}</p>
          </div>
          <div className="bg-base-200 rounded-box p-5 border border-base-content/5">
            <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium mb-1">Tokens</p>
            <p className="text-2xl font-bold text-accent">{stats.count}</p>
          </div>
          <div className="bg-base-200 rounded-box p-5 border border-base-content/5">
            <p className="text-xs text-base-content/40 uppercase tracking-wider font-medium mb-1">Gainers / Losers</p>
            <p className="text-2xl font-bold">
              <span className="text-success">{stats.gainers}</span>
              <span className="text-base-content/20 mx-1">/</span>
              <span className="text-error">{stats.count - stats.gainers}</span>
            </p>
          </div>
        </div>
      )}

      {/* Token Table */}
      <div className="bg-base-200 rounded-box border border-base-content/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-base-content/5">
                <th className="text-xs text-base-content/40 uppercase tracking-wider font-medium pl-8 pr-6 py-3 w-12 text-center">#</th>
                <th className="text-xs text-base-content/40 uppercase tracking-wider font-medium px-6 py-3">Token</th>
                <th className="text-xs text-base-content/40 uppercase tracking-wider font-medium px-6 py-3 text-center">Price</th>
                <th
                  className="text-xs text-base-content/40 uppercase tracking-wider font-medium px-6 py-3 text-center cursor-pointer hover:text-base-content/60 hidden sm:table-cell"
                  onClick={() => handleSort('price_change_percentage_1h_in_currency')}
                >
                  1h <SortIcon col="price_change_percentage_1h_in_currency" />
                </th>
                <th
                  className="text-xs text-base-content/40 uppercase tracking-wider font-medium px-6 py-3 text-center cursor-pointer hover:text-base-content/60"
                  onClick={() => handleSort('price_change_percentage_24h')}
                >
                  24h <SortIcon col="price_change_percentage_24h" />
                </th>
                <th
                  className="text-xs text-base-content/40 uppercase tracking-wider font-medium px-6 py-3 text-center cursor-pointer hover:text-base-content/60 hidden md:table-cell"
                  onClick={() => handleSort('price_change_percentage_7d_in_currency')}
                >
                  7d <SortIcon col="price_change_percentage_7d_in_currency" />
                </th>
                <th
                  className="text-xs text-base-content/40 uppercase tracking-wider font-medium px-6 py-3 text-center cursor-pointer hover:text-base-content/60 hidden lg:table-cell"
                  onClick={() => handleSort('market_cap_rank')}
                >
                  Market Cap <SortIcon col="market_cap_rank" />
                </th>
                <th
                  className="text-xs text-base-content/40 uppercase tracking-wider font-medium pl-6 pr-8 py-3 text-center cursor-pointer hover:text-base-content/60 hidden lg:table-cell"
                  onClick={() => handleSort('total_volume')}
                >
                  Volume (24h) <SortIcon col="total_volume" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coin, index) => (
                <tr
                  key={coin.id}
                  className="border-b border-base-content/5 hover:bg-base-content/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigate(`/crypto/${coin.id}`)}
                >
                  <td className="pl-8 pr-6 py-4 text-center text-sm text-base-content/40 font-mono">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-8 h-8 rounded-full"
                        loading="lazy"
                      />
                      <div>
                        <p className="font-semibold text-sm">{coin.name}</p>
                        <p className="text-xs text-base-content/40 uppercase">{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-sm font-medium">
                    {formatPrice(coin.current_price)}
                  </td>
                  <td className="px-6 py-4 text-center text-sm hidden sm:table-cell">
                    <PctBadge value={coin.price_change_percentage_1h_in_currency} />
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    <PctBadge value={coin.price_change_percentage_24h} />
                  </td>
                  <td className="px-6 py-4 text-center text-sm hidden md:table-cell">
                    <PctBadge value={coin.price_change_percentage_7d_in_currency} />
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-sm text-base-content/60 hidden lg:table-cell">
                    {formatCurrency(coin.market_cap)}
                  </td>
                  <td className="pl-6 pr-8 py-4 text-center font-mono text-sm text-base-content/40 hidden lg:table-cell">
                    {formatCurrency(coin.total_volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Results footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-base-content/5 text-xs text-base-content/40">
          <span>Showing {filtered.length} of {data.length} tokens</span>
          <span>Last updated {new Date(data[0]?.last_updated).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
