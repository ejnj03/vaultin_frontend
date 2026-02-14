import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'

//page should be able to render immediately
export default function EntityIndex() {
    const [activeCategory, setActiveCategory] = useState(null)
    const [activeSubcategory, setActiveSubcategory] = useState(null)

    const [categories, setCategories] = useState([])
    const [subcategories, setSubcategories] = useState([])
    const [labels, setLabels] = useState([])

    const navigate = useNavigate()

    //categories
    const cat_func = 'get_distinct_categories'
    const getCategories = async () => {return await fetch(`/api/supabase/query?func=${cat_func}`).then(response => response.json())}
    // [] means run once on mount, nothing means on every render
    useEffect(()=> {
        //try to load from cache first
        const cached = localStorage.getItem('entity_categories')
        if (cached) {
            setCategories(JSON.parse(cached))
        }
        //fetch fresh data and update cache
        getCategories().then(data => {
            const sorted = data.map(item => item.category).sort()
            setCategories(sorted)
            localStorage.setItem('entity_categories', JSON.stringify(sorted))
        })
    }, [])

    //subcategories
    const subcat_func = 'get_subcategories'
    const selected_category = activeCategory
    const getSubcategories = async () => {return await fetch(`/api/supabase/query?func=${subcat_func}&selected_category=${selected_category}`).then(response => response.json())}
    //run when active category changes
    useEffect(()=> {
        console.log(activeCategory)
        //means a category was selected
        //reset subcategory first (both selected and displayed)
        setActiveSubcategory(null)
        if (!activeCategory) {
            setSubcategories([])
            return
        }
        //try to load from cache first
        const cacheKey = `entity_subcategories_${activeCategory}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            setSubcategories(JSON.parse(cached))
        } else {
            setSubcategories([])
        }
        //fetch fresh data and update cache
        getSubcategories().then(data => {
            const sorted = data.map(item => item.subcategory).sort()
            setSubcategories(sorted)
            localStorage.setItem(cacheKey, JSON.stringify(sorted))
        })
    }, [activeCategory])
    
    //labels 
    const labels_func = 'get_labels'
    const getLabels = async(cat, subcat) => {
        if (cat && subcat) {
            return await fetch(`/api/supabase/query?func=${labels_func}&selected_cat=${cat}&selected_subcat=${subcat}`).then(response => response.json())
        } else if (cat) {
            //cat selected but subcat not selected
            return await fetch(`/api/supabase/query?func=${labels_func}&selected_cat=${cat}`).then(response => response.json())
        } else {
            //no selection
            return await fetch(`/api/supabase/query?func=${labels_func}`).then(response => response.json())
        }
    }
    //runs once on mount and then on any change to selected category or subcategory
    useEffect(()=> {
        //flag to track if this effect is still alive (i.e., the state that triggered this is same as curr state (cat & subcat))
        let isCurrent = true
        //fetch fresh data and update cache

        console.log(activeSubcategory)
        //try to load from cache first
        const cacheKey = `entity_labels_${activeCategory || 'all'}_${activeSubcategory || 'all'}`
        let cached = localStorage.getItem(cacheKey)
        if (cached) {
            console.log("cached data for ", cacheKey, cached.slice(0,50))
            setLabels(JSON.parse(cached))
        } else {
            setLabels([])
        }

        getLabels(activeCategory, activeSubcategory).then(data => {
            //if parent function already cleaned up, return 
            const sorted = data.map(item => item.label).sort()
            localStorage.setItem(cacheKey, JSON.stringify(sorted))
            console.log("updated cached data for ", cacheKey, data.slice(0,50))
            //if not in different category
            if (!isCurrent) return //dont assign if in different category
            //if is active, set it to labels
            setLabels(sorted)
            //console.log("current active cat/subcat", activeCategory, activeSubcategory)
        })

        //runs what is in {} after cleanup (i.e., when user switches category (another useEffect is triggered))
        return () => {isCurrent = false}
    }, [activeCategory, activeSubcategory])
    
    
    return (
        <div className='w-screen px-15'>
            <div className='flex w-full px-20 py-5 gap-5 mx-auto justify-center'>
                {categories.map((category, index) => (
                    <button 
                        key={index} 
                        className={`btn flex-1 min-w-20 max-w-80 text-lg ${activeCategory === category ? 'bg-primary text-white' : 'bg-base-300'}`}
                        onClick={() => activeCategory !== category ? setActiveCategory(category) : setActiveCategory(null)}
                    >
                        {category}
                    </button>
                ))}
            </div>
            <div className='flex flex-wrap max-w-screen-2xl mx-auto px-20 py-5 gap-3'>
                {subcategories.map((subcategory, index) => (
                    <button 
                        key={index} 
                        className={`btn flex-shrink-0 w-40 text-base ${activeSubcategory === subcategory ? 'bg-primary text-white' : 'bg-base-300'}`}
                        onClick={() => activeSubcategory !== subcategory ? setActiveSubcategory(subcategory) : setActiveSubcategory(null)}
                    >
                        {subcategory}
                    </button>
                ))}
            </div>
            <ul className="list bg-base-200 rounded-box shadow-md">
                <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">Known Entities</li>
                {labels.map((label) => (
                    <details 
                        key={label}
                        className="collapse bg-base-100 border border-base-300"
                    >
                <summary className="collapse-title flex justify-between items-center">
                <div>
                    <span className="text-lg font-semibold">{label}</span>
                    <span className="text-xs text-gray-500 ml-2"></span>
                </div>
                <button className="btn btn-sm bg-base text-white hover:bg-primary"
                    onClick={() => navigate(`/label/${label}`)}    
                >GO</button>
                </summary>
                         <div className="collapse-content text-sm">
                            TO DO: analytics summary for {label}
                         </div>
                    </details>
                ))}
            </ul>
        </div>

        
    )
}