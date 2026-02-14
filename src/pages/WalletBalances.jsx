
import { useState, useEffect } from 'react';
import { TokenCard, TokenCardSkeleton } from '../components/TokenCard';

function WalletBalances() {
  const [searchHistory, setSearchHistory] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [userAddress, setUserAddress] = useState('');
  const [data, setData] = useState({});
  const [tokenDataObjects, setTokenDataObjects] = useState({});
  const [state, setState] = useState('Idle');

  useEffect(() => {
    const history = localStorage.getItem('search_history')
    if (history) {
      setSearchHistory(JSON.parse(history))
    }
  }, [])

  async function getTokenBalance() {
    //1. try to load from cache
    const cacheKey = `token_cache_${userAddress}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      //indicate we have cached data
      //setCached(true);
      const parsedCache = JSON.parse(cached)
      //load to state immediately
      setData(parsedCache.balances)
      setTokenDataObjects(parsedCache.metadata)
      console.log("retrieved: ", parsedCache)
      console.log(tokenDataObjects)
      //so that this is displayed while loading new data in the background
      setState('Idle')
    } else {
      setData([]);
      //reset token data objects
      setTokenDataObjects([]);
      //set currentQuery to userAddress
    }
    setState('Fetching User Token Balances...')
    //0. reset states
    //reset the states from the previous query


    console.log("User Address: ", userAddress)

    //1. Get user's token balances
    //catch when invalid address error
    let results;
    try {
      const response = await fetch(`/api/balances?address=${userAddress}`);
      results = await response.json();
      console.log(results);
      //update search history
      const newHistory = [userAddress, ...searchHistory.filter(addr => addr !== userAddress)].slice(0, 5)
      setSearchHistory(newHistory)
      localStorage.setItem('search_history', JSON.stringify(newHistory))
    } catch (error) {
      console.log(error)
      //set error reason to show to user
      setState(error.reason || "Error Fetching Balances: Try again with a valid address.")
      return;
    }
    setData(results);
    //if no coins then nothing to query
    if(results.tokenBalances.length == 0) {
      setState('User has no ECR-20 Tokens')
      return;
    }

      //contract address : balance mapping
    const balances = results.tokenBalances.reduce((balancesObject, balance) => {
      balancesObject[balance.contractAddress] = balance.tokenBalance
      //console.log(balancesObject)
      return balancesObject;
    }, {})

    setData(balances)
    
    //console.log("balances: ", balances)
    //console.log(Object.keys(balances))
    //2. Fetch token metadata
    setState('Fetching Token MetaData...')

    const tokenDataPromises = {};

    //iterate over contract addresses
    for (const contractAddr of Object.keys(balances)) {
      const tokenData = fetch(`/api/metadata?contract_address=${contractAddr}`).then(response => response.json())
      tokenDataPromises[contractAddr] = tokenData;
    }

    //add data as promises resolve
    //list((listItem, index) => {some function to execute})
    //promise.then(returnVal => {function})
    //SetterFunction(current value => {return value to update to})
    //only update the index that is currently resolved in the current array
    //for synchronous updates based on fetch for each token
    Object.entries(tokenDataPromises).forEach(item => {
      const [contractAddr, promise] = item;
      promise.then(tokenData => {
        setTokenDataObjects(data => {
          //create copy (react wont detect change (new array item) since the array is the same array (same place in memory))
          data[contractAddr] = tokenData;
          //console.log(tokenData);
          return data;
        })
      })
    })
    
    //for caching all the results
    //resolves to objects
    const updatedData = Object.fromEntries(
      await Promise.all(
        Object.entries(tokenDataPromises).map(async ([key, promise]) => [key, await promise])
      )
    )

    const cacheData = {
      balances,
      metadata: updatedData
    }
    console.log("updating cache: ", cacheData)
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    setState('Idle');
  }

  //When something happens to the component onChange is field of, event object is triggered which contains info about what happened
  //event.target = the DOM element that triggered the event
  return (
      <div className="relative flex flex-col min-h-screen text-center w-full bg-base-100">
        {/*anchor 50% from left; shift back by 50% of element width*/}
        <div className='sticky top-10 z-10 pt-20  rounded-2xl flex justify-center items-center'>
          <div className='relative'>
            <input
              type="text"
              onChange={(e) => setUserAddress(e.target.value)}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              value={userAddress}
              placeholder="Enter wallet address to see wallet ERC-20 Balances"
              className="input input-lg bg-base-300/80 pl-5 w-180 text-base-content placeholder:text-base-content/40 text-lg font-mono border-2 border-primary/30 focus:border-primary focus:outline-none transition-all"
            />
            {showDropdown && searchHistory.length > 0 && (
              <div className='absolute top-full left-0 w-full bg-base-200/95 backdrop-blur-sm rounded-xl mt-2 shadow-xl border border-base-300 overflow-hidden'>
                <div className='px-4 py-2 text-xs font-semibold text-left text-base-content/50 uppercase tracking-wider border-b border-base-300'>
                  Recent Searches
                </div>
                {searchHistory.map((addr, index) => (
                  <div
                    key={addr}
                    onClick={() => { setUserAddress(addr) }}
                    className={`px-4 py-3 hover:bg-primary/10 cursor-pointer flex items-center gap-3 transition-colors ${index !== searchHistory.length - 1 ? 'border-b border-base-300/50' : ''}`}
                  >
                    <span className='text-primary/60'>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                    <span className='font-mono text-sm text-base-content truncate'>{addr}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={getTokenBalance} className='btn btn-primary w-30 btn-lg absolute right-0.25 text-lg font-bold shadow-lg hover:shadow-primary/50 transition-all'>Search</button>
          </div>
        </div>
          {/*Results (px for horizontal border)*/}
        <div className='flex w-full justify-center items-center mt-4 px-10 py-5 pt-10'>
          {/*conditional rendering for search results */}
          {/* js compares objects by reference (memory location) so results === [] will always return false */}
          {/*conditional rendering for displaying search results */}
          {state == 'Idle' && Object.keys(tokenDataObjects).length == 0 ? <p className='text-2xl font-semibold text-primary'>Search to Display Balances</p> : 
            state != 'Idle' && Object.keys(tokenDataObjects).length == 0 ?
              <p className='text-2xl font-semibold text-primary animate-pulse'>{state}</p>
              :
              <div className='w-full text-left'>
                <span className="text-xs text-gray-500 pl-5">Displaying Results for Account: {userAddress}</span>
                <div className='pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'>
                  {Object.entries(tokenDataObjects).map(([contractAddr, token]) =>
                    token ?
                      (BigInt(data[contractAddr] || '0x0') != 0n &&
                        <TokenCard key={contractAddr} token={token} balance={data[contractAddr]} />
                      )
                      :
                      <TokenCardSkeleton key={contractAddr} />
                  )}
                </div>
              </div>
          } 
        </div>
      </div>
  );
}

export default WalletBalances;
