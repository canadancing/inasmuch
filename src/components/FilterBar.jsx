import { useState, useEffect, useRef } from 'react';

export default function FilterBar({
    items,
    residents,
    selectedItems,
    setSelectedItems,
    selectedPeople,
    setSelectedPeople,
    selectedLocations,
    setSelectedLocations,
    dateRange,
    setDateRange
}) {
    const [showItemsDropdown, setShowItemsDropdown] = useState(false);
    const [showPeopleDropdown, setShowPeopleDropdown] = useState(false);
    const [showLocationsDropdown, setShowLocationsDropdown] = useState(false);
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const [itemSearch, setItemSearch] = useState('');
    const [peopleSearch, setPeopleSearch] = useState('');
    const [locationSearch, setLocationSearch] = useState('');

    // Refs for click-outside detection
    const itemsRef = useRef(null);
    const peopleRef = useRef(null);
    const locationsRef = useRef(null);
    const dateRef = useRef(null);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (itemsRef.current && !itemsRef.current.contains(event.target)) {
                setShowItemsDropdown(false);
            }
            if (peopleRef.current && !peopleRef.current.contains(event.target)) {
                setShowPeopleDropdown(false);
            }
            if (locationsRef.current && !locationsRef.current.contains(event.target)) {
                setShowLocationsDropdown(false);
            }
            if (dateRef.current && !dateRef.current.contains(event.target)) {
                setShowDateDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Extract unique locations from items
    const locations = [...new Set(items.map(item => item.location).filter(Boolean))];

    // Date range presets
    const datePresets = [
        { label: 'Last 7 Days', days: 7 },
        { label: 'Last 30 Days', days: 30 },
        { label: 'Last 90 Days', days: 90 },
        { label: 'All Time', days: null }
    ];

    const applyDatePreset = (days) => {
        if (days === null) {
            setDateRange({ start: null, end: null });
        } else {
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - days);
            setDateRange({ start, end });
        }
        setShowDateDropdown(false);
    };

    const toggleItem = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const togglePerson = (personId) => {
        setSelectedPeople(prev =>
            prev.includes(personId)
                ? prev.filter(id => id !== personId)
                : [...prev, personId]
        );
    };

    const toggleLocation = (location) => {
        setSelectedLocations(prev =>
            prev.includes(location)
                ? prev.filter(loc => loc !== location)
                : [...prev, location]
        );
    };

    const clearAllFilters = () => {
        setSelectedItems([]);
        setSelectedPeople([]);
        setSelectedLocations([]);
        setDateRange({ start: null, end: null });
    };

    const hasActiveFilters = selectedItems.length > 0 || selectedPeople.length > 0 ||
        selectedLocations.length > 0 || dateRange.start !== null;

    // Filter items/people based on search
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(itemSearch.toLowerCase())
    );
    const filteredPeople = residents.filter(person =>
        `${person.firstName} ${person.lastName}`.toLowerCase().includes(peopleSearch.toLowerCase())
    );
    const filteredLocations = locations.filter(loc =>
        loc.toLowerCase().includes(locationSearch.toLowerCase())
    );

    const formatDateRange = () => {
        if (!dateRange.start) return 'All Time';
        const start = dateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = dateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${start} - ${end}`;
    };

    return (
        <div className="card p-4 space-y-3 relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    🔍 Filters
                </h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Filter Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Items Filter */}
                <div className="relative" ref={itemsRef}>
                    <button
                        onClick={() => setShowItemsDropdown(!showItemsDropdown)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-sm"
                    >
                        <span className="flex items-center gap-1.5">
                            <span>📦</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {selectedItems.length > 0 ? `${selectedItems.length} Items` : 'All Items'}
                            </span>
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showItemsDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-hidden flex flex-col">
                            {/* Search */}
                            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                <input
                                    type="text"
                                    value={itemSearch}
                                    onChange={(e) => setItemSearch(e.target.value)}
                                    placeholder="Search items..."
                                    className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            {/* Options */}
                            <div className="overflow-y-auto">
                                {filteredItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => { }}
                                            className="w-3.5 h-3.5 rounded border-gray-300"
                                        />
                                        <span>{item.icon}</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* People Filter */}
                <div className="relative" ref={peopleRef}>
                    <button
                        onClick={() => setShowPeopleDropdown(!showPeopleDropdown)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-sm"
                    >
                        <span className="flex items-center gap-1.5">
                            <span>👤</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {selectedPeople.length > 0 ? `${selectedPeople.length} People` : 'All People'}
                            </span>
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showPeopleDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-hidden flex flex-col">
                            {/* Search */}
                            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                <input
                                    type="text"
                                    value={peopleSearch}
                                    onChange={(e) => setPeopleSearch(e.target.value)}
                                    placeholder="Search people..."
                                    className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            {/* Options */}
                            <div className="overflow-y-auto">
                                {filteredPeople.map(person => (
                                    <button
                                        key={person.id}
                                        onClick={() => togglePerson(person.id)}
                                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedPeople.includes(person.id)}
                                            onChange={() => { }}
                                            className="w-3.5 h-3.5 rounded border-gray-300"
                                        />
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {person.firstName} {person.lastName}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Locations Filter */}
                <div className="relative" ref={locationsRef}>
                    <button
                        onClick={() => setShowLocationsDropdown(!showLocationsDropdown)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-sm"
                    >
                        <span className="flex items-center gap-1.5">
                            <span>📍</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {selectedLocations.length > 0 ? `${selectedLocations.length} Locations` : 'All Locations'}
                            </span>
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showLocationsDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-hidden flex flex-col">
                            {/* Search */}
                            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                <input
                                    type="text"
                                    value={locationSearch}
                                    onChange={(e) => setLocationSearch(e.target.value)}
                                    placeholder="Search locations..."
                                    className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:border-primary-500"
                                />
                            </div>
                            {/* Options */}
                            <div className="overflow-y-auto">
                                {filteredLocations.map(location => (
                                    <button
                                        key={location}
                                        onClick={() => toggleLocation(location)}
                                        className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedLocations.includes(location)}
                                            onChange={() => { }}
                                            className="w-3.5 h-3.5 rounded border-gray-300"
                                        />
                                        <span className="font-medium text-gray-900 dark:text-white">{location}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Date Range Filter */}
                <div className="relative" ref={dateRef}>
                    <button
                        onClick={() => setShowDateDropdown(!showDateDropdown)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:border-primary-500 dark:hover:border-primary-500 transition-colors text-sm"
                    >
                        <span className="flex items-center gap-1.5">
                            <span>📅</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {formatDateRange()}
                            </span>
                        </span>
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showDateDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            {datePresets.map(preset => (
                                <button
                                    key={preset.label}
                                    onClick={() => applyDatePreset(preset.days)}
                                    className="w-full px-3 py-2 text-left text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {selectedItems.map(itemId => {
                        const item = items.find(i => i.id === itemId);
                        return item ? (
                            <span key={itemId} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold">
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                                <button onClick={() => toggleItem(itemId)} className="hover:text-primary-900 dark:hover:text-primary-100">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        ) : null;
                    })}
                    {selectedPeople.map(personId => {
                        const person = residents.find(p => p.id === personId);
                        return person ? (
                            <span key={personId} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                <span>👤</span>
                                <span>{person.firstName} {person.lastName}</span>
                                <button onClick={() => togglePerson(personId)} className="hover:text-blue-900 dark:hover:text-blue-100">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        ) : null;
                    })}
                    {selectedLocations.map(location => (
                        <span key={location} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                            <span>📍</span>
                            <span>{location}</span>
                            <button onClick={() => toggleLocation(location)} className="hover:text-emerald-900 dark:hover:text-emerald-100">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
