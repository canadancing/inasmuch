// Modal for logging consumption/usage quickly
import { useState, useEffect, useRef } from 'react';
import AddPersonModal from './AddPersonModal';

export default function ConsumptionModal({ isOpen, onClose, items, initialItems, onLog, user, setCurrentView, residents, onAddResident, tags = [], initialPerson = null }) {
    const [selectedPerson, setSelectedPerson] = useState(initialPerson);
    const [selectedItems, setSelectedItems] = useState([]); // Array of {item, quantity}
    const [itemSearch, setItemSearch] = useState('');
    const [personSearch, setPersonSearch] = useState('');
    const [showItemDropdown, setShowItemDropdown] = useState(false);
    const [showPersonDropdown, setShowPersonDropdown] = useState(false);
    const [consumptionDate, setConsumptionDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasAutoSelected, setHasAutoSelected] = useState(false);

    // Inline person creation states
    const [showAddPersonForm, setShowAddPersonForm] = useState(false);
    const [newPersonFirstName, setNewPersonFirstName] = useState('');
    const [newPersonLastName, setNewPersonLastName] = useState('');
    const [newPersonRoom, setNewPersonRoom] = useState('');
    const [isCreatingPerson, setIsCreatingPerson] = useState(false);

    // AddPersonModal state
    const [showAddPersonModal, setShowAddPersonModal] = useState(false);

    // Refs for click-outside detection
    const itemDropdownRef = useRef(null);
    const personDropdownRef = useRef(null);

    // Filtered items and persons
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );

    // Create current user person object
    const currentUserPerson = user ? {
        id: user.uid,
        firstName: (user.displayName || user.email || 'Current User').split(' ')[0] || user.email,
        lastName: (user.displayName || user.email || '').split(' ').slice(1).join(' ') || '',
        room: user.email || 'Current User',
        isCurrentUser: true
    } : null;

    // Filter residents and add current user at the top
    const allPersons = currentUserPerson
        ? [currentUserPerson, ...(residents || [])]
        : (residents || []);

    const filteredPersons = allPersons.filter(person =>
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
        if (isOpen && selectedItems.length === 0) {
            // Only explicitly map initialItems if they exist; we NEVER fallback to preselecting everything.
            if (initialItems && initialItems.length > 0) {
                const preselected = initialItems.map(item => ({ item, quantity: 1 }));
                setSelectedItems(preselected);
            }
        } else if (!isOpen) {
            setSelectedItems([]);
            setItemSearch('');
        }
    }, [isOpen, initialItems]);

    // Auto-select initialPerson or current user ONCE when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialPerson) {
                setSelectedPerson(initialPerson);
                setHasAutoSelected(true);
            } else if (!hasAutoSelected && user) {
                // Auto-select current user on first open
                const nameParts = (user.displayName || user.email || 'Current User').split(' ');
                const currentUserPerson = {
                    id: user.uid,
                    firstName: nameParts[0] || user.email,
                    lastName: nameParts.slice(1).join(' ') || '',
                    room: user.email || 'Current User',
                    isCurrentUser: true
                };
                setSelectedPerson(currentUserPerson);
                setHasAutoSelected(true);
            }
        } else {
            // Reset on close
            if (!initialPerson) setSelectedPerson(null);
            setHasAutoSelected(false);
        }
    }, [isOpen, user, hasAutoSelected, initialPerson]);

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

    // Parse search query into first/last name
    const parseNameFromSearch = (searchText) => {
        const trimmed = searchText.trim();
        if (!trimmed) return { firstName: '', lastName: '' };

        const parts = trimmed.split(/\s+/);
        if (parts.length === 1) {
            return { firstName: parts[0], lastName: '' };
        }
        // First word = firstName, rest = lastName
        return {
            firstName: parts[0],
            lastName: parts.slice(1).join(' ')
        };
    };

    const handleShowAddPersonForm = () => {
        const { firstName, lastName } = parseNameFromSearch(personSearch);
        setNewPersonFirstName(firstName);
        setNewPersonLastName(lastName);
        setNewPersonRoom('');
        setShowAddPersonForm(true);
        setShowPersonDropdown(false);
    };

    const handleCreatePerson = async () => {
        if (!newPersonFirstName.trim() || !newPersonRoom.trim()) {
            alert('Please enter at least a first name and room number');
            return;
        }

        setIsCreatingPerson(true);
        try {
            const personData = {
                firstName: newPersonFirstName.trim(),
                lastName: newPersonLastName.trim(),
                room: newPersonRoom.trim()
            };

            await onAddResident(personData);

            // Wait a moment for Firestore to sync
            await new Promise(resolve => setTimeout(resolve, 500));

            // Find the newly created person (most recent with matching name)
            const newPerson = residents.find(r =>
                r.firstName === personData.firstName &&
                r.lastName === personData.lastName &&
                r.room === personData.room
            );

            if (newPerson) {
                setSelectedPerson(newPerson);
            }

            // Reset form
            setShowAddPersonForm(false);
            setNewPersonFirstName('');
            setNewPersonLastName('');
            setNewPersonRoom('');
            setPersonSearch('');
        } catch (error) {
            console.error('Error creating person:', error);
            alert('Failed to create person. Please try again.');
        } finally {
            setIsCreatingPerson(false);
        }
    };

    const handleCancelAddPerson = () => {
        setShowAddPersonForm(false);
        setNewPersonFirstName('');
        setNewPersonLastName('');
        setNewPersonRoom('');
    };

    const handleSubmit = async () => {
        if (!selectedPerson || selectedItems.length === 0) return;

        setIsSubmitting(true);
        try {
            const [year, month, day] = consumptionDate.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            const todayStr = new Date().toISOString().split('T')[0];
            if (consumptionDate === todayStr) {
                const now = new Date();
                dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                dateObj.setHours(12, 0, 0, 0);
            }

            const personName = `${selectedPerson.firstName || ''} ${selectedPerson.lastName || ''}`.trim() || selectedPerson.name || 'Unknown';

            // Log consumption for each item
            for (const { item, quantity } of selectedItems) {
                await onLog(selectedPerson.id, personName, item.id, item.name, 'used', quantity, dateObj);
            }

            // Reset and close
            setSelectedPerson(null);
            setSelectedItems([]);
            setItemSearch('');
            setPersonSearch('');
            setConsumptionDate(new Date().toISOString().split('T')[0]);
            onClose();
        } catch (error) {
            console.error('Error logging consumption:', error);
            alert('Failed to log consumption. Please try again.');
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
                                <span>➖</span> Log Consumption
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track what's been used</p>
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
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                WHO USED THE ITEM?
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
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-red-500 focus:ring-0 transition-colors"
                            />
                            {showPersonDropdown && (
                                <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                    {/* Add Person Option - Show at top when searching and function is available */}
                                    {personSearch.trim() && onAddResident && !selectedPerson && (
                                        <button
                                            onClick={handleShowAddPersonForm}
                                            className="w-full px-4 py-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                                                +
                                            </div>
                                            <div>
                                                <div className="font-semibold text-green-700 dark:text-green-400">
                                                    Add '{personSearch}'
                                                </div>
                                                <div className="text-xs text-green-600 dark:text-green-500">
                                                    Create new person
                                                </div>
                                            </div>
                                        </button>
                                    )}

                                    {/* Existing People */}
                                    {filteredPersons.length > 0 ? filteredPersons.map((person) => (
                                        <button
                                            key={person.id}
                                            onClick={() => {
                                                setSelectedPerson(person);
                                                setShowPersonDropdown(false);
                                                setPersonSearch('');
                                            }}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${person.isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20 border-b-2 border-blue-200 dark:border-blue-800' : ''}`}
                                        >
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    {person.firstName} {person.lastName}
                                                    {person.isCurrentUser && (
                                                        <span className="text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {person.room}
                                                </div>
                                            </div>
                                        </button>
                                    )) : !personSearch.trim() ? (
                                        <div className="p-6 text-center">
                                            <div className="text-3xl mb-2">👤</div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                No people found
                                            </p>
                                            <button
                                                onClick={() => setShowAddPersonModal(true)}
                                                className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                            >
                                                ➕ Add People
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>

                        {/* Selected Person Display */}
                        {selectedPerson && (
                            <div className="mt-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-between">
                                <div>
                                    <div className="font-semibold text-red-900 dark:text-red-100">
                                        {selectedPerson.firstName} {selectedPerson.lastName}
                                    </div>
                                    <div className="text-xs text-red-600 dark:text-red-400">
                                        {selectedPerson.room}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPerson(null)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* Inline Add Person Form */}
                        {showAddPersonForm && (
                            <div className="mt-2 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 space-y-3">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                                        +
                                    </div>
                                    <h3 className="font-bold text-green-900 dark:text-green-100">Add New Person</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={newPersonFirstName}
                                            onChange={(e) => setNewPersonFirstName(e.target.value)}
                                            placeholder="John"
                                            className="w-full px-3 py-2 rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-green-500 focus:ring-0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                            Last Name
                                        </label>
                                        <input
                                            type="text"
                                            value={newPersonLastName}
                                            onChange={(e) => setNewPersonLastName(e.target.value)}
                                            placeholder="Doe"
                                            className="w-full px-3 py-2 rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-green-500 focus:ring-0"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                                        Room *
                                    </label>
                                    <input
                                        type="text"
                                        value={newPersonRoom}
                                        onChange={(e) => setNewPersonRoom(e.target.value)}
                                        placeholder="101"
                                        className="w-full px-3 py-2 rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:border-green-500 focus:ring-0"
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={handleCancelAddPerson}
                                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                        disabled={isCreatingPerson}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreatePerson}
                                        disabled={isCreatingPerson || !newPersonFirstName.trim() || !newPersonRoom.trim()}
                                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isCreatingPerson || !newPersonFirstName.trim() || !newPersonRoom.trim()
                                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-green-500 text-white hover:bg-green-600'
                                            }`}
                                    >
                                        {isCreatingPerson ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                        ) : (
                                            'Create & Select'
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Item Selection with Search */}
                    <div className="relative" ref={itemDropdownRef}>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Select Items Used
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
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-red-500 focus:ring-0 transition-colors"
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
                                                className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
                                Items Being Consumed
                            </label>
                            <div className="space-y-2">
                                {selectedItems.map(({ item, quantity }) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{item.icon}</span>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Current: {item.currentStock} → New: {item.currentStock - quantity}
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
                                                className="w-20 text-center font-bold text-xl text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all cursor-text"
                                                placeholder="1"
                                            />
                                            <button
                                                onClick={() => handleQuantityChange(item.id, quantity + 1)}
                                                className="w-10 h-10 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center justify-center font-bold text-lg transition-colors shadow-sm"
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
                            Consumption Date
                        </label>
                        <input
                            type="date"
                            value={consumptionDate}
                            onChange={(e) => setConsumptionDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-red-500 focus:ring-0 transition-colors"
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
                            : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20'
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
                        setSelectedPerson(newPerson);
                    }

                    // Close the modal
                    setShowAddPersonModal(false);
                }}
                tags={tags}
            />
        </div>
    );
}
