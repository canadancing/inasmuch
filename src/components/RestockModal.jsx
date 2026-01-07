// Modal for restocking items quickly
import { useState } from 'react';

export default function RestockModal({ isOpen, onClose, items, onRestock, user }) {
    const [selectedItems, setSelectedItems] = useState([]); // Array of {item, quantity}
    const [itemSearch, setItemSearch] = useState('');
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtered items
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );

    const handleAddItem = (item) => {
        const existing = selectedItems.find(si => si.item.id === item.id);
        if (existing) {
            setSelectedItems(selectedItems.map(si =>
                si.item.id === item.id
                    ? { ...si, quantity: si.quantity + 1 }
                    : si
            ));
        } else {
            setSelectedItems([...selectedItems, { item, quantity: 1 }]);
        }
        setItemSearch('');
        setShowItemDropdown(false);
    };

    const handleRemoveItem = (itemId) => {
        setSelectedItems(selectedItems.filter(si => si.item.id !== itemId));
    };

    const handleQuantityChange = (itemId, newQuantity) => {
        if (newQuantity < 1) {
            handleRemoveItem(itemId);
            return;
        }
        setSelectedItems(selectedItems.map(si =>
            si.item.id === itemId ? { ...si, quantity: newQuantity } : si
        ));
    };

    const handleSubmit = async () => {
        if (selectedItems.length === 0) return;

        setIsSubmitting(true);
        try {
            // Restock each item
            for (const { item, quantity } of selectedItems) {
                await onRestock(item.id, quantity);
            }

            // Reset and close
            setSelectedItems([]);
            setItemSearch('');
            onClose();
        } catch (error) {
            console.error('Error restocking items:', error);
            alert('Failed to restock items. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span>➕</span> Restock Items
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add quantities to your inventory</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors"
                        >
                            <span className="text-2xl text-gray-500">×</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Item Selection with Search */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Select Items to Restock
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={itemSearch}
                                onChange={(e) => {
                                    setItemSearch(e.target.value);
                                    setShowItemDropdown(true);
                                }}
                                onFocus={() => setShowItemDropdown(true)}
                                placeholder="Search items..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-0 transition-colors"
                            />
                            {showItemDropdown && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {filteredItems.length > 0 ? filteredItems.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleAddItem(item)}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
                                        >
                                            <span className="text-2xl">{item.icon}</span>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Current Stock: {item.currentStock}
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="p-6 text-center">
                                            <div className="text-3xl mb-2">📦</div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                No items found
                                            </p>
                                            <p className="text-xs text-primary-500 dark:text-primary-400">
                                                💡 Add items in the <strong>ADMIN → Manage</strong> tab
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Items with Quantity Control */}
                    {selectedItems.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                Items to Restock
                            </label>
                            <div className="space-y-2">
                                {selectedItems.map(({ item, quantity }) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{item.icon}</span>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Current: {item.currentStock} → New: {item.currentStock + quantity}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleQuantityChange(item.id, quantity - 1)}
                                                className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center font-bold transition-colors"
                                            >
                                                -
                                            </button>
                                            <span className="w-8 text-center font-bold text-gray-900 dark:text-white">
                                                +{quantity}
                                            </span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, quantity + 1)}
                                                className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center font-bold transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 rounded-b-3xl flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedItems.length === 0 || isSubmitting}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${selectedItems.length === 0 || isSubmitting
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                            }`}
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                            `Restock ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
