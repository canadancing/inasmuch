import ItemCard from './ItemCard';

export default function ItemGrid({ items, selectedItem, onSelectItem, showStockOnly = false, displayMode = 'grid' }) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Items Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Add items in the Admin panel to get started
                </p>
            </div>
        );
    }

    if (displayMode === 'list') {
        return (
            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
                    >
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">{item.icon}</div>
                            <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{item.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Stock: {item.currentStock} {item.minStock > 0 && `(Min: ${item.minStock})`}
                                </div>
                            </div>
                        </div>
                        <div className={`text-lg font-bold ${item.currentStock === 0 ? 'text-red-500' : item.currentStock <= item.minStock ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {item.currentStock}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => (
                <ItemCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItem?.id === item.id}
                    onSelect={onSelectItem}
                    showStockOnly={showStockOnly}
                />
            ))}
        </div>
    );
}
