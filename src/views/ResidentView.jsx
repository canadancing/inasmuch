import ItemGrid from '../components/ItemGrid';

export default function ResidentView({
    items,
    loading,
    isDemo,
    isAdmin,
}) {
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
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Current Inventory
                    </h2>
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
                            {items.length} items
                        </div>
                    </div>
                </div>
                <ItemGrid
                    items={items}
                    selectedItem={null}
                    onSelectItem={() => { }}
                    showStockOnly={true}
                />
            </div>
        </div>
    );
}
