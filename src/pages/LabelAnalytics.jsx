import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { subcategoryInfo } from '../utils/subcategoryConfig';
import { categoryInfo } from '../utils/categoryConfig';
import ScrollableAccountList from '../components/ScrollableAccountList';
import ExpandableDetails from '../components/ExpandableDetails';

export default function LabelAnalytics() {

    //const analyticsCategories = ["TREASURY", "DEVELOPMENT", "USAGE", "GOVERNANCE", "TOKEN", "LEGACY"]
    
    //fetch from the url
    const { labelName } = useParams()
    const [accounts, setAccounts] = useState([])
    const [acctsWCat, setAcctsWCat] = useState([])
    const [sortedAccounts, setSortedAccounts] = useState({})

    const label_func = "get_accounts"
    const getAccounts = async () => {return await fetch(`/api/supabase/query?func=${label_func}&selected_label=${labelName}`).then(response => response.json())}
    //post method
    const sortAccounts = async () => {
        return await fetch('/api/sortAddress', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({accounts})
        }).then(response => response.json())
    }
    //group sorted accts
    const group = () => {
        return acctsWCat.reduce((obj, account) => {
            const category = account.category
            const subcategory = account.subcategory
            //if the category doesnt exist in obj yet
            if (!obj[category]) obj[category] = {}
            if (!obj[category][subcategory]) obj[category][subcategory] = []
            //add acct to the category's array
            obj[category][subcategory].push(account)
            //return the updated object for the next iteration
            return obj
        }, {}) //start with empty obj (this is the 1st iterations obj)
    }

    // [] means run once on mount, nothing means on every render
    useEffect(()=> {
        //will return after promise resolves which will set Categories
        getAccounts().then(data => {console.log(data), setAccounts(data)})
        
    }, [labelName])
    useEffect(() => {
        if (accounts.length == 0) return //dont run if empty
        sortAccounts().then(data => setAcctsWCat(data))
    }, [accounts])
    useEffect(() => {setSortedAccounts(group())}, [acctsWCat])

    if (Object.keys(sortedAccounts).length === 0) return <div className="p-8 text-lg text-base-content/50 tracking-wide text-center">Loading...</div>

    console.log("Sorted Accounts: ", sortedAccounts)
    return (
        <div className='w-full justify-center px-30 py-10'>
            <div className="bg-base-100 rounded-2xl shadow-lg border border-base-300 overflow-hidden mb-8">
                <div className="px-6 py-4 bg-primary/10">
                    <h1 className="text-2xl font-bold text-primary tracking-wide">{labelName}</h1>
                </div>
            </div>
            <div className='columns-3 gap-8 space-y-8'>
                {Object.entries(sortedAccounts).map(([category, subcategories]) => {
                    const catInfo = categoryInfo[category] || { title: "", description: "", details: "" }
                    return (
                        <div key={category} className="bg-base-100 rounded-2xl shadow-lg border border-base-300 overflow-hidden">
                            <div className="px-6 py-4 bg-primary/10 border-b border-base-300">
                                <h2 className="text-xl font-bold text-primary tracking-wide">{category}</h2>
                                {catInfo.title && <p className="text-sm text-primary/80 font-semibold mt-1">{catInfo.title}</p>}
                                <ExpandableDetails description={catInfo.description} details={catInfo.details} colorClass='text-primary/70'/>
                            </div>
                            <div className="p-4 space-y-4">
                                {Object.entries(subcategories).map(([subcategory, accounts]) => {
                                    const subInfo = subcategoryInfo[subcategory] || { title: "", description: "", details: "" }
                                    return (
                                        <div key={subcategory} className="bg-base-200/50 rounded-xl p-4">
                                            <div className="mb-3 border-b border-base-300 pb-2">
                                                <h3 className="text-base-content/80 font-semibold">{subcategory} Accounts ({accounts.length})</h3>
                                                {subInfo.title && <p className="text-sm text-base-content/60 font-semibold mt-1">{subInfo.title}</p>}
                                                <ExpandableDetails description={subInfo.description} details={subInfo.details} />
                                            </div>
                                            <ScrollableAccountList accounts={accounts} />
                                        </div>)
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}