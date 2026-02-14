import { categorizeAddress } from './utils.js'
export default async function handler(req, res) {
    const { accounts } = req.body
    //console.log(accounts)
    const sorted = accounts.map(account => {
        const { category, subcategory } = categorizeAddress(account.nametag)
        return {
            ...account, 
            category,
            subcategory
        }
    })
    res.json(sorted)
}