import { Utils } from 'alchemy-sdk';

// Skeleton card shown while loading
export function TokenCardSkeleton() {
  return (
    <div className='card w-full bg-base-200/300 text-base-content shadow-xl border-2 border-primary/10 animate-pulse'>
      <div className="card-body p-6">
        <div className="flex flex-col items-start gap-5">
          {/* Match the header section */}
          <div className="flex flex-row gap-4 items-center pb-4 border-b border-primary/20 w-full">
            <div className='w-12 h-12 bg-primary/20 rounded-full'></div>
            <div className='flex-1'>
              <div className='h-5 bg-primary/20 rounded w-3/4 mb-2'></div>
              <div className='h-4 bg-primary/10 rounded w-1/2'></div>
            </div>
          </div>
          {/* Match the balance section */}
          <div className="w-full bg-base-100/30 rounded-lg p-4">
            <div className='h-3 bg-primary/10 rounded w-1/3 mb-2'></div>
            <div className='h-8 bg-primary/20 rounded w-full mb-1'></div>
            <div className='h-4 bg-primary/10 rounded w-1/4'></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main token card component
export function TokenCard({ token, balance }) {
  return (
    <div className='card w-full bg-gradient-to-br from-base-200 to-base-300 text-base-content shadow-2xl hover:shadow-primary/30 transition-all duration-300 border-2 border-primary/20 hover:border-primary/50 hover:scale-105'>
      <div className="card-body p-6 text-left">
        <div className="flex flex-col w-full gap-5">
          <div className="flex flex-row gap-4 items-start pb-4 border-b border-primary/20">
            {token.logo ?
              <img src={token.logo} className='w-12 h-12 rounded-full' alt={token.symbol} />
              :
              <div className='w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-primary-content font-black text-xl shadow-lg'>
                {token.symbol?.[0] || '?'}
              </div>
            }
            <div className="flex flex-col items-start flex-1">
              <h2 className="text-xl font-extrabold text-base-content truncate">{token.name}</h2>
              <p className="text-sm text-primary font-semibold">${token.symbol}</p>
            </div>
          </div>
          <div className="w-full bg-base-100/30 rounded-lg p-4">
            <p className="text-xs text-base-content/60 uppercase tracking-widest mb-2 font-bold">Account Balance</p>
            <div className="flex flex-row items-baseline">
              <span className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent break-all pr-3">
                {Utils.formatUnits(balance, token.decimals)}
              </span>
              <span className="text-sm text-base-content/70 font-semibold">{token.symbol}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenCard;
