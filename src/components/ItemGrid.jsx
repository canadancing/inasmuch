import ItemCard from './ItemCard';

export default function ItemGrid({ items, selectedItem, onSelectItem, showStockOnly = false }) {
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
