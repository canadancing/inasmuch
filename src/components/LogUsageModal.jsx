import { useState, useEffect, useRef } from 'react';
import AddPersonModal from './AddPersonModal';

export default function LogUsageModal({ isOpen, onClose, residents, items, onLog, user, setCurrentView, onAddResident, tags = [], initialResident = null }) {
    const [selectedResident, setSelectedResident] = useState(initialResident);
    const [selectedItems, setSelectedItems] = useState([]); // Array of {item, quantity}
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search states
    const [residentSearch, setResidentSearch] = useState('');
    const [itemSearch, setItemSearch] = useState('');
    const [showResidentDropdown, setShowResidentDropdown] = useState(false);
    const [showItemDropdown, setShowItemDropdown] = useState(false);

    // AddPersonModal state
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);

    // Refs for click-outside detection
    const residentDropdownRef = useRef(null);
    const itemDropdownRef = useRef(null);

    // Filtered lists
    const filteredResidents = residents.filter(r =>
        `${r.firstName} ${r.lastName} ${r.room}`.toLowerCase().includes(residentSearch.toLowerCase())
    );

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );

    // Close dropdowns when clicking outside - improved version
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside resident dropdown
            if (residentDropdownRef.current && !residentDropdownRef.current.contains(event.target)) {
                setShowResidentDropdown(false);
            }
            // Check if click is outside item dropdown
            if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
                setShowItemDropdown(false);
            }
        };

        if (isOpen) {
            // Use capture phase to detect clicks before they reach the input
            document.addEventListener('mousedown', handleClickOutside, true);
            if (initialResident) {
                setSelectedResident(initialResident);
            }
        } else {
            // Reset when closing
            if (!initialResident) setSelectedResident(null);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isOpen, initialResident]);

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

    // Handle closing dropdowns when focusing another input
    const handleResidentFocus = () => {
        setShowResidentDropdown(true);
        setShowItemDropdown(false);
    };

    const handleItemFocus = () => {
        setShowItemDropdown(true);
        setShowResidentDropdown(false);
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
                    <div className="relative" ref={residentDropdownRef}>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Person
                            </label>
                            <button
                                onClick={() => setShowAddPersonModal(true)}
                                className="px-3 py-1.5 text-xs font-bold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Person
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={selectedResident ? `${selectedResident.firstName} ${selectedResident.lastName}` : residentSearch}
                                onChange={(e) => {
                                    setResidentSearch(e.target.value);
                                    setShowResidentDropdown(true);
                                    setShowItemDropdown(false);
                                    setSelectedResident(null);
                                }}
                                onFocus={handleResidentFocus}
                                placeholder="Search people..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-primary-500 focus:ring-0 transition-colors"
                            />
                            {showResidentDropdown && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {filteredResidents.length > 0 ? filteredResidents.map((resident) => (
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
                                    )) : (
                                        <div className="p-6 text-center">
                                            <div className="text-3xl mb-2">👤</div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                No people found
                                            </p>
                                            <button
                                                onClick={() => setShowAddPersonModal(true)}
                                                className="px-4 py-2 text-sm font-semibold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                                            >
                                                ➕ Add People
                                            </button>
                                        </div>
                                    )}
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
                    <div className="relative" ref={itemDropdownRef}>
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
                                    setShowResidentDropdown(false);
                                }}
                                onFocus={handleItemFocus}
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
                                                    Stock: {item.currentStock}
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="p-6 text-center">
                                            <div className="text-3xl mb-2">📦</div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                No items found
                                            </p>
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    setCurrentView?.('admin');
                                                }}
                                                className="px-4 py-2 text-sm font-semibold bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                                            >
                                                ➕ Add Items
                                            </button>
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
                                                onClick={() => handleQuantityChange(item.id, Math.max(1, quantity - 1))}
                                                className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center font-bold text-lg transition-colors"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                value={quantity}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                                    if (val === '') {
                                                        handleQuantityChange(item.id, 1);
                                                    } else {
                                                        const numVal = parseInt(val);
                                                        if (numVal > 0 && numVal <= 9999) {
                                                            handleQuantityChange(item.id, numVal);
                                                        }
                                                    }
                                                }}
                                                onBlur={() => {
                                                    if (quantity < 1) handleQuantityChange(item.id, 1);
                                                }}
                                                className="w-20 text-center font-bold text-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all cursor-text"
                                                placeholder="1"
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(item.id, quantity + 1)}
                                                className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center font-bold text-lg transition-colors"
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

            {/* Add Person or Location Modal */}
            <AddPersonModal
                isOpen={showAddPersonModal}
                onClose={() => setShowAddPersonModal(false)}
                onAdd={async (personData) => {
                    // Call the parent's onAddResident to create the person
                    const newPerson = await onAddResident(personData);

                    // Auto-select the newly created person
                    if (newPerson) {
                        setSelectedResident(newPerson);
                    }

                    // Close the modal
                    setShowAddPersonModal(false);
                }}
                tags={tags}
            />
        </div>
    );
}
