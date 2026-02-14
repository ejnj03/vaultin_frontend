import { supabase } from '../lib/supabase.js'

export default async function handler(req, res) {
    //pass in the function to run as req
    //use the first arg as func and the rest as params
    const { func, ...params } = req.query;
    //the sql function to execute
    const { data } = await supabase.rpc(func, params)
    //returns a arr of obj {category: '..'}
    res.status(200).json(data);
}