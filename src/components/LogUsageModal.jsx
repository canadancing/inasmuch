import { useState } from 'react';

export default function LogUsageModal({ isOpen, onClose, residents, items, onLog, user }) {
    const [selectedResident, setSelectedResident] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]); // Array of {item, quantity}
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search states
    const [residentSearch, setResidentSearch] = useState('');
    const [itemSearch, setItemSearch] = useState('');
    const [showResidentDropdown, setShowResidentDropdown] = useState(false);
    const [showItemDropdown, setShowItemDropdown] = useState(false);

    // Filtered lists
    const filteredResidents = residents.filter(r =>
        `${r.firstName} ${r.lastName} ${r.room}`.toLowerCase().includes(residentSearch.toLowerCase())
    );

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
        if (!selectedResident || selectedItems.length === 0) return;

        setIsSubmitting(true);
        try {
            const [year, month, day] = logDate.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            const todayStr = new Date().toISOString().split('T')[0];
            if (logDate === todayStr) {
                const now = new Date();
                dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                dateObj.setHours(12, 0, 0, 0);
            }

            // Log each item separately
            for (const { item, quantity } of selectedItems) {
                await onLog(
                    selectedResident.id,
                    `${selectedResident.firstName || ''} ${selectedResident.lastName || ''}`.trim() || selectedResident.name || 'Unknown',
                    item.id,
                    item.name,
                    'used',
                    quantity,
                    dateObj
                );
            }

            // Reset and close
            setSelectedResident(null);
            setSelectedItems([]);
            setNotes('');
            setResidentSearch('');
            setItemSearch('');
            setLogDate(new Date().toISOString().split('T')[0]);
            onClose();
        } catch (error) {
            console.error('Error logging items:', error);
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
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Log Usage</h2>
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
                    {/* Resident Selection with Search */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Resident
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={selectedResident ? `${selectedResident.firstName} ${selectedResident.lastName}` : residentSearch}
                                onChange={(e) => {
                                    setResidentSearch(e.target.value);
                                    setShowResidentDropdown(true);
                                    setSelectedResident(null);
                                }}
                                onFocus={() => setShowResidentDropdown(true)}
                                placeholder="Search residents..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-0 transition-colors"
                            />
                            {showResidentDropdown && filteredResidents.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {filteredResidents.map((resident) => (
                                        <button
                                            key={resident.id}
                                            onClick={() => {
                                                setSelectedResident(resident);
                                                setShowResidentDropdown(false);
                                                setResidentSearch('');
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {resident.firstName} {resident.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {resident.room}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {selectedResident && (
                            <div className="mt-2 p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-primary-900 dark:text-primary-100">
                                        {selectedResident.firstName} {selectedResident.lastName}
                                    </div>
                                    <div className="text-xs text-primary-600 dark:text-primary-400">
                                        {selectedResident.room}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedResident(null)}
                                    className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Item Selection with Search */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Items
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
                            {showItemDropdown && filteredItems.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {filteredItems.map((item) => (
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
                                                    Stock: {item.currentStock}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Selected Items with Quantity Control */}
                    {selectedItems.length > 0 && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                Selected Items
                            </label>
                            <div className="space-y-2">
                                {selectedItems.map(({ item, quantity }) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{item.icon}</span>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Stock: {item.currentStock}
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
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={() => handleQuantityChange(item.id, quantity + 1)}
                                                className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center font-bold transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Date
                        </label>
                        <input
                            type="date"
                            value={logDate}
                            onChange={(e) => setLogDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-0 transition-colors"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any additional notes..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-0 transition-colors resize-none"
                        />
                    </div>
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
                        disabled={!selectedResident || selectedItems.length === 0 || isSubmitting}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${!selectedResident || selectedItems.length === 0 || isSubmitting
                            ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg shadow-primary-500/20'
                            }`}
                    >
                        {isSubmitting ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : (
                            `Log ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
