// Modal for restocking items quickly
import { useState, useEffect, useRef } from 'react';

export default function RestockModal({ isOpen, onClose, items, onRestock, user, setCurrentView, residents }) {
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]); // Array of {item, quantity}
    const [itemSearch, setItemSearch] = useState('');
    const [personSearch, setPersonSearch] = useState('');
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [showPersonDropdown, setShowPersonDropdown] = useState(false);
    const [restockDate, setRestockDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasAutoSelected, setHasAutoSelected] = useState(false);

    // Refs for click-outside detection
    const itemDropdownRef = useRef(null);
    const personDropdownRef = useRef(null);


    // Filtered items and persons
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );

    const filteredPersons = (residents || []).filter(person =>
        `${person.firstName} ${person.lastName} ${person.room}`.toLowerCase().includes(personSearch.toLowerCase())
    );

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (itemDropdownRef.current && !itemDropdownRef.current.contains(event.target)) {
                setShowItemDropdown(false);
            }
            if (personDropdownRef.current && !personDropdownRef.current.contains(event.target)) {
                setShowPersonDropdown(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [isOpen]);

    // Auto-select items when modal opens
    useEffect(() => {
        if (isOpen && items && items.length > 0 && selectedItems.length === 0) {
            // Pre-select the items passed to the modal
            const preselected = items.map(item => ({ item, quantity: 1 }));
            setSelectedItems(preselected);
        }
    }, [isOpen, items]);

    // Auto-select current user as person when modal opens
    useEffect(() => {
        if (isOpen && !hasAutoSelected && user) {
            // Create a virtual person object from the current user
            const nameParts = (user.displayName || user.email || 'Current User').split(' ');
            const currentUserPerson = {
                id: user.uid,
                firstName: nameParts[0] || user.email,
                lastName: nameParts.slice(1).join(' ') || '',
                room: user.email || 'Current User'
            };
            setSelectedPerson(currentUserPerson);
            setHasAutoSelected(true);
        } else if (!isOpen) {
            // Reset auto-selection flag when modal closes
            setHasAutoSelected(false);
        }
    }, [isOpen, user, hasAutoSelected]);

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
        if (!selectedPerson || selectedItems.length === 0) return;

        setIsSubmitting(true);
        try {
            const [year, month, day] = restockDate.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            const todayStr = new Date().toISOString().split('T')[0];
            if (restockDate === todayStr) {
                const now = new Date();
                dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                dateObj.setHours(12, 0, 0, 0);
            }

            const personName = `${selectedPerson.firstName || ''} ${selectedPerson.lastName || ''}`.trim() || selectedPerson.name || 'Unknown';

            // Restock each item
            for (const { item, quantity } of selectedItems) {
                await onRestock(item.id, item.name, quantity, selectedPerson.id, personName, dateObj);
            }

            // Reset and close
            setSelectedPerson(null);
            setSelectedItems([]);
            setItemSearch('');
            setPersonSearch('');
            setRestockDate(new Date().toISOString().split('T')[0]);
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
                    {/* Person Selection with Search */}
                    <div className="relative" ref={personDropdownRef}>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            WHO IS RESTOCKING?
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={selectedPerson ? `${selectedPerson.firstName} ${selectedPerson.lastName}` : personSearch}
                                onChange={(e) => {
                                    setPersonSearch(e.target.value);
                                    setShowPersonDropdown(true);
                                    setShowItemDropdown(false);
                                    setSelectedPerson(null);
                                }}
                                onFocus={() => {
                                    setShowPersonDropdown(true);
                                    setShowItemDropdown(false);
                                }}
                                placeholder="Search people..."
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-0 transition-colors"
                            />
                            {showPersonDropdown && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {filteredPersons.length > 0 ? filteredPersons.map((person) => (
                                        <button
                                            key={person.id}
                                            onClick={() => {
                                                setSelectedPerson(person);
                                                setShowPersonDropdown(false);
                                                setPersonSearch('');
                                            }}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {person.firstName} {person.lastName}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {person.room}
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
                                                onClick={() => {
                                                    onClose();
                                                    setCurrentView?.('admin');
                                                }}
                                                className="px-4 py-2 text-sm font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                                            >
                                                ➕ Add People
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        {selectedPerson && (
                            <div className="mt-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-emerald-900 dark:text-emerald-100">
                                        {selectedPerson.firstName} {selectedPerson.lastName}
                                    </div>
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400">
                                        {selectedPerson.room}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPerson(null)}
                                    className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Item Selection with Search */}
                    <div className="relative" ref={itemDropdownRef}>
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
                                            <button
                                                onClick={() => {
                                                    onClose();
                                                    setCurrentView?.('admin');
                                                }}
                                                className="px-4 py-2 text-sm font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
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
                                                className="w-20 text-center font-bold text-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-text"
                                                placeholder="1"
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(item.id, quantity + 1)}
                                                className="w-10 h-10 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center font-bold text-lg transition-colors shadow-sm"
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
                            Restock Date
                        </label>
                        <input
                            type="date"
                            value={restockDate}
                            onChange={(e) => setRestockDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-0 transition-colors"
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
                        disabled={!selectedPerson || selectedItems.length === 0 || isSubmitting}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${!selectedPerson || selectedItems.length === 0 || isSubmitting
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
