import { useState } from 'react'

export default function ExpandableDetails({ description, details, colorClass = "text-base-content" }) {
    const [isExpanded, setIsExpanded] = useState(false)

    if (!description && !details) return null

    return (
        <div className={`mt-1 ${colorClass}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`text-xs ${colorClass}/50 hover:${colorClass}/70 cursor-pointer flex items-center gap-1`}
            >
                <span>{isExpanded ? '▼' : '▶'}</span>
                <span>{isExpanded ? 'Hide Description' : 'Description'}</span>
            </button>
            {isExpanded && (
                <div className="mt-2 space-y-1">
                    {description && <p className={`text-sm ${colorClass}/60 whitespace-pre-line`}>{description}</p>}
                    {details && <p className={`text-xs ${colorClass}/40 whitespace-pre-line`}>{details}</p>}
                </div>
            )}
        </div>
    )
}
