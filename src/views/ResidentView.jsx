import { useState, useEffect, useRef } from 'react';
import ItemGrid from '../components/ItemGrid';
import RestockModal from '../components/RestockModal';
import ConsumptionModal from '../components/ConsumptionModal';
import ItemRecordsModal from '../components/ItemRecordsModal';
import AddItemModal from '../components/AddItemModal';
import { useFirestore } from '../hooks/useFirestore';
import { useInventory } from '../context/InventoryContext';

export default function ResidentView({
    items,
    loading,
    isDemo,
    isAdmin,
    residents,
    onRestock,
    onLog,
    setCurrentView,
    user,
    onAddResident,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onUpdateLog,
    onDeleteLog,
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [displayMode, setDisplayMode] = useState(() => {
        return localStorage.getItem('stockDisplayMode') || 'grid';
    });
    const [stockFilter, setStockFilter] = useState('all');
    const [showHidden, setShowHidden] = useState(false);
    const [sortBy, setSortBy] = useState('alphabetical'); // 'alphabetical', 'stock-asc', 'stock-desc'
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState(() => {
        const saved = localStorage.getItem('selectedItemIds');
        return saved ? JSON.parse(saved) : [];
    });
    const [showItemSelector, setShowItemSelector] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [selectedRestockItem, setSelectedRestockItem] = useState(null);
    const [showConsumptionModal, setShowConsumptionModal] = useState(false);
    const [selectedConsumptionItem, setSelectedConsumptionItem] = useState(null);
    const [showRecordsModal, setShowRecordsModal] = useState(false);
    const [selectedRecordsItem, setSelectedRecordsItem] = useState(null);
    const [showAddItemModal, setShowAddItemModal] = useState(false);

    const sortDropdownRef = useRef(null);
    const { updateItem } = useFirestore();
    const { currentInventoryId } = useInventory();

    const handleHideItem = async (itemId) => {
        await updateItem(itemId, { hidden: true });
    };

    const handleItemClick = (item) => {
        setSelectedRecordsItem(item);
        setShowRecordsModal(true);
    };

    const handleConsumptionClick = (item) => {
        setSelectedConsumptionItem(item);
        setShowConsumptionModal(true);
    };

    const handleShowRecords = (item) => {
        setSelectedRecordsItem(item);
        setShowRecordsModal(true);
    };


    // Persist display mode to localStorage
    useEffect(() => {
        localStorage.setItem('stockDisplayMode', displayMode);
    }, [displayMode]);

    // Persist selected items to localStorage
    useEffect(() => {
        localStorage.setItem('selectedItemIds', JSON.stringify(selectedItemIds));
    }, [selectedItemIds]);

    // Close item selector when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showItemSelector && !e.target.closest(".item-selector-container")) {
                setShowItemSelector(false);
            }
            if (showSortDropdown && !e.target.closest(".sort-dropdown-container")) {
                setShowSortDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showItemSelector, showSortDropdown]);

    // Toggle item selection
    const toggleItemSelection = (itemId) => {
        setSelectedItemIds(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                return [...prev, itemId];
            }
        });
    };

    // Filter items based on search query, stock filter, and selected items
    const filteredItems = items.filter(item => {
        // Filter out soft-deleted items
        if (item.deleted) {
            return false;
        }

        // Item selection filter - show all if nothing selected
        if (selectedItemIds.length > 0 && !selectedItemIds.includes(item.id)) {
            return false;
        }

        // Hidden filter - exclude hidden items unless showHidden is true
        if (!showHidden && item.hidden) {
            return false;
        }

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesSearch = item.name?.toLowerCase().includes(query) ||
                item.location?.toLowerCase().includes(query) ||
                item.tags?.some(tag => tag.toLowerCase().includes(query));
            if (!matchesSearch) return false;
        }

        // Stock level filter
        if (stockFilter === 'low') {
            return item.currentStock > 0 && item.currentStock <= item.minStock;
        } else if (stockFilter === 'out') {
            return item.currentStock === 0;
        }

        return true;
    });

    // Sort items
    const sortedItems = [...filteredItems].sort((a, b) => {
        switch (sortBy) {
            case 'alphabetical':
                return a.name.localeCompare(b.name);
            case 'stock-asc':
                return a.currentStock - b.currentStock;
            case 'stock-desc':
                return b.currentStock - a.currentStock;
            default:
                return 0;
        }
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
                {/* Filter and Display Controls */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    {/* Stock Filter Buttons */}
                    <button
                        onClick={() => setStockFilter('all')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${stockFilter === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        All Items
                    </button>
                    <button
                        onClick={() => setStockFilter('low')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${stockFilter === 'low'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        Low Stock
                    </button>
                    <button
                        onClick={() => setStockFilter('out')}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${stockFilter === 'out'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        Out of Stock
                    </button>

                    {/* Display Mode Toggle */}
                    <button
                        onClick={() => setDisplayMode('grid')}
                        className={`p-2 rounded-lg transition-colors ${displayMode === 'grid'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        title="Grid View"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setDisplayMode('list')}
                        className={`p-2 rounded-lg transition-colors ${displayMode === 'list'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        title="List View"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Show Hidden Toggle */}
                    <button
                        onClick={() => setShowHidden(!showHidden)}
                        className={`p-2 rounded-lg transition-colors ${showHidden
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        title={showHidden ? "Hide Hidden Items" : "Show Hidden Items"}
                    >
                        {showHidden ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        )}
                    </button>

                    {/* Sort Dropdown */}
                    <div className="relative sort-dropdown-container">
                        <button
                            onClick={() => setShowSortDropdown(!showSortDropdown)}
                            className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            Sort
                        </button>
                        {showSortDropdown && (
                            <div className="absolute z-20 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                                <button
                                    onClick={() => {
                                        setSortBy('alphabetical');
                                        setShowSortDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${sortBy === 'alphabetical' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}
                                >
                                    <span>Alphabetical</span>
                                    {sortBy === 'alphabetical' && <span>✓</span>}
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy('stock-asc');
                                        setShowSortDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${sortBy === 'stock-asc' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}
                                >
                                    <span>Stock: Low to High</span>
                                    {sortBy === 'stock-asc' && <span>✓</span>}
                                </button>
                                <button
                                    onClick={() => {
                                        setSortBy('stock-desc');
                                        setShowSortDropdown(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${sortBy === 'stock-desc' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}
                                >
                                    <span>Stock: High to Low</span>
                                    {sortBy === 'stock-desc' && <span>✓</span>}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Item Selector */}
                    <div className="relative item-selector-container">
                        <button
                            onClick={() => setShowItemSelector(!showItemSelector)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${selectedItemIds.length > 0
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            {selectedItemIds.length > 0 ? `${selectedItemIds.length} Selected` : 'Select Items'}
                        </button>

                        {/* Item Selector Dropdown */}
                        {showItemSelector && (
                            <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
                                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
                                    <span className="font-semibold text-gray-900 dark:text-white text-sm">Select Items to Display</span>
                                    {selectedItemIds.length > 0 && (
                                        <button
                                            onClick={() => setSelectedItemIds([])}
                                            className="text-xs text-primary-500 hover:text-primary-600 font-semibold"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="p-2">
                                    {items.map(item => (
                                        <label
                                            key={item.id}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedItemIds.includes(item.id)}
                                                onChange={() => toggleItemSelection(item.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                                            />
                                            <span className="text-2xl">{item.icon}</span>
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Stock: {item.currentStock}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

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
                            {isDemo && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Demo</span>
                                </div>
                            )}
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                                {filteredItems.length} {filteredItems.length === items.length ? 'items' : `of ${items.length} `}
                            </div>
                        </div>
                    </div>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-3 opacity-30">
                            {searchQuery ? '🔍' : '📦'}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            {searchQuery ? `No items found for "${searchQuery}"` : 'No items in your inventory yet'}
                        </p>
                        {!searchQuery && onAddItem && (
                            <button
                                onClick={() => setShowAddItemModal(true)}
                                className="px-6 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 shadow-lg shadow-primary-500/20 active:scale-95 transition-all inline-flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Your First Item
                            </button>
                        )}
                    </div>
                ) : (
                    <ItemGrid
                        items={sortedItems}
                        displayMode={displayMode}
                        onSelectItem={handleItemClick}
                        showStockOnly={true}
                        onHideItem={handleHideItem}
                        onConsume={handleConsumptionClick}
                        onShowRecords={handleShowRecords}
                        onRestock={(item) => {
                            setSelectedRestockItem(item);
                            setShowRestockModal(true);
                        }}
                        onAddItem={onAddItem ? () => setShowAddItemModal(true) : null}
                    />
                )}
            </div>

            {/* Restock Modal */}
            {selectedRestockItem && (
                <RestockModal
                    isOpen={showRestockModal}
                    onClose={() => {
                        setShowRestockModal(false);
                        setSelectedRestockItem(null);
                    }}
                    items={[selectedRestockItem]}
                    residents={residents}
                    onRestock={onRestock}
                    setCurrentView={setCurrentView}
                    user={user}
                />
            )}

            {/* Consumption Modal */}
            {selectedConsumptionItem && (
                <ConsumptionModal
                    isOpen={showConsumptionModal}
                    onClose={() => {
                        setShowConsumptionModal(false);
                        setSelectedConsumptionItem(null);
                    }}
                    items={items}
                    initialItems={[selectedConsumptionItem]}
                    residents={residents}
                    onLog={onLog}
                    onAddResident={onAddResident}
                    setCurrentView={setCurrentView}
                    user={user}
                />
            )}

            {/* Item Records Modal */}
            <ItemRecordsModal
                isOpen={showRecordsModal}
                onClose={() => {
                    setShowRecordsModal(false);
                    setSelectedRecordsItem(null);
                }}
                item={selectedRecordsItem}
                currentInventoryId={currentInventoryId}
                onUpdateItem={onUpdateItem}
                onDeleteItem={onDeleteItem}
                onUpdateLog={onUpdateLog}
                onDeleteLog={onDeleteLog}
                tags={[]}
            />

            {/* Add Item Modal */}
            {onAddItem && (
                <AddItemModal
                    isOpen={showAddItemModal}
                    onClose={() => setShowAddItemModal(false)}
                    onAddItem={onAddItem}
                />
            )}
        </div>
    );
}
