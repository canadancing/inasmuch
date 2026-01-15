import { useState, useMemo } from 'react';

/**
 * SearchableSection - A reusable component for displaying searchable/collapsible lists
 * 
 * @param {string} title - Section title
 * @param {ReactNode} icon - Icon to display before title
 * @param {boolean} defaultExpanded - Whether section is expanded by default
 * @param {string} searchPlaceholder - Placeholder text for search input
 * @param {Array} items - Array of items to display
 * @param {Function} renderItem - Function to render each item (item, index) => ReactNode
 * @param {Function} filterFunction - Function to filter items based on search (item, searchTerm) => boolean
 * @param {string} emptyMessage - Message to show when no items match
 * @param {number} count - Optional count badge
 * @param {ReactNode} headerActions - Optional actions to show in header
 */
export default function SearchableSection({
    title,
    icon,
    defaultExpanded = true,
    searchPlaceholder = 'Search...',
    items = [],
    renderItem,
    filterFunction,
    emptyMessage = 'No items found',
    count,
    headerActions
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter items based on search
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return items;
        return items.filter(item => filterFunction(item, searchTerm));
    }, [items, searchTerm, filterFunction]);

    const displayCount = count !== undefined ? count : filteredItems.length;

    return (
        <div className="space-y-3">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all group"
            >
                <div className="flex items-center gap-3">
                    {/* Chevron Icon */}
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    {/* Icon */}
                    {icon && <span className="text-xl">{icon}</span>}

                    {/* Title */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>

                    {/* Count Badge */}
                    {displayCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                            {displayCount}
                        </span>
                    )}
                </div>

                {/* Header Actions */}
                {headerActions && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {headerActions}
                    </div>
                )}
            </button>

            {/* Expandable Content */}
            <div
                className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="space-y-3">
                    {/* Search Bar */}
                    {isExpanded && items.length > 0 && (
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full pl-10 pr-10 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-0 transition-colors"
                            />
                            {/* Search Icon */}
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {/* Clear Button */}
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    aria-label="Clear search"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Items List */}
                    {isExpanded && (
                        <div className="space-y-2">
                            {filteredItems.length > 0 ? (
                                filteredItems.map((item, index) => (
                                    <div
                                        key={item.id || index}
                                        className="animate-fade-in"
                                        style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                                    >
                                        {renderItem(item, index)}
                                    </div>
                                ))
                            ) : (
                                /* Empty State */
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="text-5xl mb-3">🔍</div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                                        {emptyMessage}
                                    </p>
                                    {searchTerm && (
                                        <button
                                            onClick={() => setSearchTerm('')}
                                            className="mt-3 text-sm text-primary-500 hover:text-primary-600 font-medium"
                                        >
                                            Clear search
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
