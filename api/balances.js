import { Alchemy, Network } from 'alchemy-sdk';

export default async function handler(req, res) {
  // 1. Extract inputs from request
    const { address } = req.query; // or req.body for POST

    const alchemy_key = process.env.ALCHEMY_API_KEY;

    const config = {
        apiKey: alchemy_key,
        network: Network.ETH_MAINNET,
    };
    // 2. Do your logic (using secrets from env vars)
    const alchemy = new Alchemy(config);
    const result = await alchemy.core.getTokenBalances(address);
  
    // 3. Return response if want to wrap (i.e., data : ...., then do data : result)
    // if do { result } then wraps in result : ....
    res.status(200).json(result);
}