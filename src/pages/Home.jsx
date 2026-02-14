import { useState, useEffect, useMemo } from 'react';
import { ConnectKitButton } from 'connectkit';

function HeroBackground() {
  const particles = useMemo(() =>
    Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.5 + 0.2,
    })), []);

  const shapes = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 30 + 10,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      rotation: Math.random() * 360,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient base */}
      <div className="absolute inset-0 hero-gradient-bg" />

      {/* Glowing orbs */}
      <div className="glow-orb w-[400px] h-[400px] bg-primary/20 top-[10%] left-[15%]"
        style={{ animationDuration: '6s' }} />
      <div className="glow-orb w-[500px] h-[500px] bg-secondary/15 bottom-[10%] right-[10%]"
        style={{ animationDuration: '8s', animationDelay: '2s' }} />
      <div className="glow-orb w-[300px] h-[300px] bg-accent/10 top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2"
        style={{ animationDuration: '10s', animationDelay: '4s' }} />

      {/* Rising particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle bg-primary"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Drifting geometric shapes */}
      {shapes.map((s) => (
        <div
          key={s.id}
          className="drift-shape border border-primary/10"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            borderRadius: s.id % 2 === 0 ? '50%' : '2px',
            transform: `rotate(${s.rotation}deg)`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
          }}
        />
      ))}

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Top vignette fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-base-100/80 via-transparent to-base-100/60" />
    </div>
  );
}

const TICKER_DATA = [
  { symbol: 'BTC', price: '97,342.18', change: '+2.4%', up: true },
  { symbol: 'ETH', price: '3,421.07', change: '-1.2%', up: false },
  { symbol: 'SOL', price: '187.54', change: '+5.7%', up: true },
  { symbol: 'ADA', price: '0.72', change: '+0.8%', up: true },
  { symbol: 'AVAX', price: '38.91', change: '-3.1%', up: false },
  { symbol: 'DOT', price: '8.43', change: '+1.5%', up: true },
  { symbol: 'LINK', price: '18.22', change: '+3.2%', up: true },
  { symbol: 'MATIC', price: '1.08', change: '-0.5%', up: false },
];

const TABLE_DATA = [
  { rank: 1, name: 'Bitcoin', symbol: 'BTC', price: '$97,342.18', change: '+2.4%', up: true, cap: '$1.91T', volume: '$28.4B' },
  { rank: 2, name: 'Ethereum', symbol: 'ETH', price: '$3,421.07', change: '-1.2%', up: false, cap: '$411B', volume: '$14.1B' },
  { rank: 3, name: 'Solana', symbol: 'SOL', price: '$187.54', change: '+5.7%', up: true, cap: '$86B', volume: '$3.8B' },
  { rank: 4, name: 'Cardano', symbol: 'ADA', price: '$0.72', change: '+0.8%', up: true, cap: '$25B', volume: '$892M' },
  { rank: 5, name: 'Avalanche', symbol: 'AVAX', price: '$38.91', change: '-3.1%', up: false, cap: '$15B', volume: '$612M' },
];

function Home() {
  const [visibleStats, setVisibleStats] = useState([false, false, false, false]);

  useEffect(() => {
    const timers = visibleStats.map((_, i) =>
      setTimeout(() => {
        setVisibleStats(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 200 * i)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero min-h-[80vh] relative overflow-hidden">
        <HeroBackground />

        {/* Content */}
        <div className="hero-content text-center flex-col gap-6 relative z-10">
          <div className="max-w-2xl">
            <div className="badge badge-outline badge-primary gap-2 mb-6 py-3 px-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Live Market Data
            </div>
            <h1 className="text-7xl font-extrabold leading-tight tracking-tight">
              Your Crypto,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
                One Vault.
              </span>
            </h1>
            <p className="py-6 text-lg text-base-content/50 max-w-md mx-auto leading-relaxed">
              Track markets in real-time, analyze trends with powerful charts, and manage your portfolio — all in one place.
            </p>
            <div className="flex gap-4 justify-center mt-2">
              <ConnectKitButton.Custom>
                {({ isConnected, show, truncatedAddress, ensName }) => (
                  <button
                    onClick={show}
                    className="btn btn-primary btn-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
                  >
                    {isConnected ? ensName ?? truncatedAddress : "Launch App"}
                  </button>
                )}
              </ConnectKitButton.Custom>
              <button className="btn btn-ghost btn-lg border border-base-content/10 hover:border-primary/30">
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Scrolling Ticker */}
      <section className="bg-base-300/80 border-y border-base-content/5 py-3 overflow-hidden">
        <div className="flex whitespace-nowrap" style={{ animation: 'ticker-scroll 20s linear infinite' }}>
          {[...TICKER_DATA, ...TICKER_DATA].map((t, i) => (
            <span key={i} className="inline-flex items-center gap-2 mx-6 text-sm font-mono">
              <span className="font-bold text-base-content/80">{t.symbol}</span>
              <span className="text-base-content/50">${t.price}</span>
              <span className={t.up ? 'text-success' : 'text-error'}>{t.change}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-10 px-8">
        <div className="flex justify-center gap-8 flex-wrap max-w-4xl mx-auto">
          {[
            { value: '$2.1T', label: 'Total Market Cap', color: 'text-primary' },
            { value: '$84.2B', label: '24h Volume', color: 'text-secondary' },
            { value: '12,400+', label: 'Tokens Tracked', color: 'text-accent' },
            { value: '50K+', label: 'Active Users', color: 'text-info' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`stat bg-base-200 rounded-box shadow-sm border border-base-content/5 transition-all duration-500 ${visibleStats[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            >
              <div className={`stat-value text-2xl ${stat.color}`}>{stat.value}</div>
              <div className="stat-desc text-base-content/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-4">Why Vaultin?</h2>
        <p className="text-center text-base-content/40 mb-12 max-w-md mx-auto">Everything you need to navigate the crypto markets with confidence.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📊', title: 'Market Analytics', desc: 'Real-time price tracking, volume analysis, and trend detection across thousands of tokens.' },
            { icon: '💰', title: 'Wallet Manager', desc: 'Connect multiple wallets, view balances, and track your holdings across chains in one dashboard.' },
            { icon: '🔔', title: 'Smart Alerts', desc: 'Set custom price alerts, whale movement notifications, and portfolio threshold warnings.' },
          ].map((feature, i) => (
            <div key={i} className="card bg-base-200 border border-base-content/5 hover:border-primary/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
              <div className="card-body items-center text-center gap-3">
                <div className="text-4xl mb-1">{feature.icon}</div>
                <h3 className="card-title text-lg">{feature.title}</h3>
                <p className="text-base-content/50 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Market Table */}
      <section className="py-16 px-8 bg-base-200/50">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Trending Now</h2>
            <button className="btn btn-ghost btn-sm text-primary">View All</button>
          </div>
          <div className="overflow-x-auto rounded-box border border-base-content/5">
            <table className="table">
              <thead className="bg-base-300/50">
                <tr>
                  <th>#</th>
                  <th>Token</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>Market Cap</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                {TABLE_DATA.map((token) => (
                  <tr key={token.rank} className="hover:bg-base-300/30 transition-colors cursor-pointer">
                    <td className="text-base-content/40">{token.rank}</td>
                    <td>
                      <div>
                        <span className="font-bold">{token.name}</span>
                        <span className="text-base-content/40 ml-2 text-xs">{token.symbol}</span>
                      </div>
                    </td>
                    <td className="font-mono">{token.price}</td>
                    <td>
                      <span className={`badge badge-sm ${token.up ? 'badge-success' : 'badge-error'} badge-outline`}>
                        {token.change}
                      </span>
                    </td>
                    <td className="text-base-content/60">{token.cap}</td>
                    <td className="text-base-content/40">{token.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="max-w-xl mx-auto relative z-10">
          <h2 className="text-4xl font-bold mb-4">Ready to enter the Vault?</h2>
          <p className="text-base-content/40 mb-8">
            Join thousands of traders and investors who trust Vaultin for their crypto insights.
          </p>
          <div className="join shadow-lg">
            <input className="input join-item bg-base-200 border-base-content/10 focus:outline-none" placeholder="Enter your email" />
            <button className="btn btn-primary join-item">Sign Up</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer footer-center bg-base-300/50 border-t border-base-content/5 text-base-content p-10">
        <p className="text-base-content/30 text-sm">Vaultin &copy; 2026 </p>
      </footer>
    </div>
  );
}

export default Home;