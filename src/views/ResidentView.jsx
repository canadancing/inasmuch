import { useState } from 'react';
import ItemGrid from '../components/ItemGrid';

export default function ResidentView({
    items,
    loading,
    isDemo,
    isAdmin,
}) {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter items based on search query
    const filteredItems = items.filter(item => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            item.name?.toLowerCase().includes(query) ||
            item.location?.toLowerCase().includes(query) ||
            item.tags?.some(tag => tag.toLowerCase().includes(query))
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Inventory Grid */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Current Inventory
                    </h2>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Search box */}
                        <div className="relative flex-1 sm:flex-initial sm:w-64">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search items..."
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

                        {/* Status badges */}
                        <div className="flex items-center gap-3">
                            {!isAdmin && (
                                <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Read Only</span>
                                </div>
                            )}
                            {isDemo && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Demo</span>
                                </div>
                            )}
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                {filteredItems.length} {filteredItems.length === items.length ? 'items' : `of ${items.length}`}
                            </div>
                        </div>
                    </div>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-3 opacity-30">🔍</div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {searchQuery ? `No items found for "${searchQuery}"` : 'No items available'}
                        </p>
                    </div>
                ) : (
                    <ItemGrid
                        items={filteredItems}
                        selectedItem={null}
                        onSelectItem={() => { }}
                        showStockOnly={true}
                    />
                )}
            </div>
        </div>
    );
}
