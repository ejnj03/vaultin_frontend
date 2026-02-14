
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { TokenCard, TokenCardSkeleton } from '../components/TokenCard';

function MyERC20() {
  const [isChecking, setIsChecking] = useState(true)
  const { address, isConnected } = useAccount()
  const [data, setData] = useState({});
  const [tokenDataObjects, setTokenDataObjects] = useState({});
  const [state, setState] = useState('Idle');
  //whether we have cached data 

  async function getTokenBalance() {
    console.log(address)
    //1. Get user's token balances
    //catch when invalid address error

    setState('Fetching User Token Balances...')

    let results;
    try {
      const response = await fetch(`/api/balances?address=${address}`);
      results = await response.json();
      //console.log(results);

    } catch (error) {
      console.log(error)
      //set error reason to show to user
      setState(error.reason || "Error Fetching Balances")
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

    //Save fresh data to the cache
    const cacheKey = `token_cache_${address}`
    const cacheData = {
      balances,
      metadata: updatedData
    }
    //console.log("updating cache: ", cacheData)
    localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    setState('Idle');
  }

  //runs once when wallet is connected or address is changed
  useEffect(() => {
    //checked if acct was loaded
    const timer = setTimeout(() => setIsChecking(false), 1000)

    if(isConnected && address) {
      //1. try to load from cache
      const cacheKey = `token_cache_${address}`
      const cached = localStorage.getItem(cacheKey)

      //if cached data for this address exists
      if (cached) {
        //indicate we have cached data
        //setCached(true);
        const parsedCache = JSON.parse(cached)
        //load to state immediately
        setData(parsedCache.balances)
        setTokenDataObjects(parsedCache.metadata)
        //console.log("retrieved: ", parsedCache)
        //console.log(tokenDataObjects)
        //so that this is displayed while loading new data in the background
        setState('Idle')
        getTokenBalance();
      } else {
        getTokenBalance();
      }
    }
    return () => clearTimeout(timer)
  }, [isConnected, address])

  //When something happens to the component onChange is field of, event object is triggered which contains info about what happened
  //event.target = the DOM element that triggered the event
  return (
    
      <div className="relative flex flex-col min-h-screen w-full px-10 pt-10 g-base-100">
        <div className="bg-base-100 rounded-2xl shadow-lg border border-base-300 overflow-hidden mb-8">
          <div className="px-6 py-4 bg-primary/10">
            <h1 className="text-2xl font-bold text-primary tracking-wide">ERC-20 Balances</h1>
          </div>
        </div>
        {/*anchor 50% from left; shift back by 50% of element width*/}
          {/*Results (px for horizontal border)*/}
          <div className='flex w-full justify-center items-center mt-4'>
            {/*conditional rendering for search results */}
            {/* js compares objects by reference (memory location) so results === [] will always return false */}
            {/*conditional rendering for displaying search results */}
            {state === 'Idle' && !isConnected ? 
              (isChecking ? 
                <p className='text-2xl font-semibold text-primary'>Loading Connected Wallet...</p> 
                :
                <p className='text-2xl font-semibold text-primary'>Connect Wallet to Display Balances</p> 
              )
            : 
              state != 'Idle' && Object.keys(tokenDataObjects).length == 0 ?
                <p className='text-2xl font-semibold text-primary animate-pulse'>{state}</p>
                :
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full'>
                  {Object.entries(tokenDataObjects).map(([contractAddr, token]) =>
                    token ?
                      (BigInt(data[contractAddr] || '0x0') != 0n &&
                        <TokenCard key={contractAddr} token={token} balance={data[contractAddr]} />
                      )
                      :
                      <TokenCardSkeleton key={contractAddr} />
                  )}
                </div>
            } 
          </div>
      </div>
  );
}

export default MyERC20;
