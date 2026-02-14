import { useState, useEffect, useRef } from 'react'

export default function ScrollableAccountList({ accounts }) {
    const listRef = useRef(null)
    const [canScrollDown, setCanScrollDown] = useState(false)
    const [canScrollUp, setCanScrollUp] = useState(false)

    useEffect(() => {
        const el = listRef.current
        if (!el) return
        const checkScroll = () => {
            const isScrollable = el.scrollHeight > el.clientHeight
            const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5
            const atTop = el.scrollTop <= 5
            setCanScrollDown(isScrollable && !atBottom)
            setCanScrollUp(isScrollable && !atTop)
        }
        checkScroll()
        el.addEventListener('scroll', checkScroll)
        return () => el.removeEventListener('scroll', checkScroll)
    }, [accounts])

    const scrollToTop = () => {
        listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className="relative">
            <ul ref={listRef} className="space-y-2 max-h-60 overflow-y-auto">
                {accounts.map((account, index) => (
                    <li key={index} className='bg-base-100 rounded-lg p-3 hover:bg-base-300/50 transition-colors border border-base-300/50'>
                        <div className='font-medium text-base-content mb-1'>
                            {account.nametag}
                        </div>
                        <div className="text-xs font-mono text-primary/70 break-all">{account.address}</div>
                    </li>
                ))}
            </ul>
            {canScrollDown && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-base-200/90 to-transparent pt-4 pb-1 text-center pointer-events-none">
                    <span className="text-xs text-base-content/50">↓ scroll for more</span>
                </div>
            )}
            {canScrollUp && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-base-200/90 to-transparent pb-4 pt-1 text-center">
                    <button onClick={scrollToTop} className="text-xs text-base-content/50 hover:text-base-content/70 cursor-pointer">
                        ↑ back to top
                    </button>
                </div>
            )}
        </div>
    )
}
