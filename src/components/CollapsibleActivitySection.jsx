// Reusable collapsible section with search for activity/list displays
import { useState } from 'react';

export default function CollapsibleActivitySection({
    title,
    icon = '📋',
    items = [],
    renderItem,
    searchPlaceholder = 'Search...',
    searchFields = ['message', 'type'], // Fields to search within each item
    actions = [], // [{label, onClick, visible, icon, variant}]
    defaultExpanded = false,
    emptyMessage = 'No items found',
    emptyIcon = '📭',
    badge = null, // Optional badge (e.g., unread count)
    className = ''
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter items based on search query
    const filteredItems = items.filter(item => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        return searchFields.some(field => {
            const value = field.split('.').reduce((obj, key) => obj?.[key], item);
            return value?.toString().toLowerCase().includes(query);
        });
    });

    const visibleActions = actions.filter(action =>
        action.visible === undefined || action.visible === true
    );

    // Empty state (no items at all)
    if (items.length === 0) {
        return (
            <div className={`card p-6 ${className}`}>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <span>{icon}</span> {title}
                </h3>
                <div className="text-center py-8">
                    <div className="text-5xl mb-3 opacity-30">{emptyIcon}</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`card p-6 animate-fade-in ${className}`}>
            {/* Header with toggle, badge, search, and actions */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 flex-1 group"
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>{icon}</span> {title}
                        </h3>
                        {badge !== null && badge > 0 && (
                            <span className="px-2 py-0.5 text-xs font-black bg-red-500 text-white rounded-full">
                                {badge > 99 ? '99+' : badge}
                            </span>
                        )}
                        <svg
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {/* Action buttons */}
                    {visibleActions.length > 0 && (
                        <div className="flex items-center gap-2">
                            {visibleActions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    className={`text-xs font-bold transition-colors disabled:opacity-50 px-3 py-1 rounded-lg ${action.variant === 'danger'
                                            ? 'text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                                            : 'text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                                        }`}
                                    title={action.title}
                                >
                                    {action.icon && <span>{action.icon} </span>}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Search box (only show when expanded) */}
                {isExpanded && (
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-0 transition-colors"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Collapsible content */}
            {isExpanded && (
                <div className="mt-4">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-2 opacity-30">🔍</div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No results for "{searchQuery}"
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-fade-in">
                            {filteredItems.map((item, index) => renderItem(item, index))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
