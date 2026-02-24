import { useMemo, useState } from 'react';
import FilterBar from './FilterBar';

export default function Statistics({ logs, items, residents, onRestock }) {
    // Filter state
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedPeople, setSelectedPeople] = useState([]);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [dateRange, setDateRange] = useState({ start: null, end: null });

    // Apply filters to logs
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // Item filter
            if (selectedItems.length > 0 && !selectedItems.includes(log.itemId)) {
                return false;
            }

            // People filter
            if (selectedPeople.length > 0 && !selectedPeople.includes(log.residentId)) {
                return false;
            }

            // Location filter (from item's location)
            if (selectedLocations.length > 0) {
                const item = items.find(i => i.id === log.itemId);
                if (!item || !selectedLocations.includes(item.location)) {
                    return false;
                }
            }

            // Date range filter
            if (dateRange.start) {
                const logDate = log.date?.toDate?.() || new Date(log.date);
                if (logDate < dateRange.start || logDate > dateRange.end) {
                    return false;
                }
            }

            return true;
        });
    }, [logs, selectedItems, selectedPeople, selectedLocations, dateRange, items]);

    // Calculate dashboard statistics using filtered logs
    const stats = useMemo(() => {
        const totalItems = items.length;
        const totalResidents = residents.length;

        // Stock analysis
        const lowStockItems = items.filter(i => i.currentStock <= (i.minStock || 0) && i.currentStock > 0);
        const outOfStockItems = items.filter(i => i.currentStock === 0);
        const wellStockedItems = items.filter(i => i.currentStock > (i.minStock || 0));

        const itemUsage = {};
        const peopleUsage = {};
        const locationUsage = {};

        filteredLogs.forEach(log => {
            if (log.action === 'used') {
                const qty = log.quantity || 0;

                // Look up the item first to ensure it hasn't been deleted
                const item = items.find(i => i.id === log.itemId);

                if (item) {
                    // Item aggregation
                    itemUsage[item.name] = (itemUsage[item.name] || 0) + qty;

                    // Location aggregation
                    if (item.location) {
                        locationUsage[item.location] = (locationUsage[item.location] || 0) + qty;
                    }
                }

                // People aggregation
                if (log.residentName) {
                    peopleUsage[log.residentName] = (peopleUsage[log.residentName] || 0) + qty;
                }
            }
        });

        const topItems = Object.entries(itemUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const topPeople = Object.entries(peopleUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        const topLocations = Object.entries(locationUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Recent trend (last 7 days vs previous 7 days) - using filtered logs
        const now = new Date();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);

        const recentLogs = filteredLogs.filter(log => {
            const logDate = log.date?.toDate?.() || new Date(log.date);
            return logDate >= sevenDaysAgo;
        });

        const previousLogs = filteredLogs.filter(log => {
            const logDate = log.date?.toDate?.() || new Date(log.date);
            return logDate >= fourteenDaysAgo && logDate < sevenDaysAgo;
        });

        const recentCount = recentLogs.length;
        const previousCount = previousLogs.length;
        let trend = 'stable';
        if (recentCount > previousCount * 1.1) trend = 'up';
        else if (recentCount < previousCount * 0.9) trend = 'down';

        // Calculate Stock Health Score (0-100)
        // Weighted: Well Stocked (1.0), Low Stock (0.5), Out (0)
        const totalStocked = totalItems;
        const healthScore = totalStocked === 0 ? 0 : Math.round(
            ((wellStockedItems.length * 1.0 + lowStockItems.length * 0.5) / totalStocked) * 100
        );

        return {
            totalItems,
            totalResidents,
            lowStockItems,
            outOfStockItems,
            wellStockedItems,
            topItems,
            topPeople,
            topLocations,
            recentCount,
            previousCount,
            trend,
            healthScore
        };
    }, [items, residents, filteredLogs]);

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Filter Bar */}
            <FilterBar
                items={items}
                residents={residents}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                selectedPeople={selectedPeople}
                setSelectedPeople={setSelectedPeople}
                selectedLocations={selectedLocations}
                setSelectedLocations={setSelectedLocations}
                dateRange={dateRange}
                setDateRange={setDateRange}
            />

            {/* 1. Premium Hero Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100/50 dark:border-blue-800/30 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl">📦</div>
                    <div className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Total Items</div>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-sm">{stats.totalItems}</span>
                        <span className="text-sm font-bold text-blue-600/70 dark:text-blue-400/70">SKUs</span>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-100/50 dark:border-purple-800/30 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl">👥</div>
                    <div className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Residents</div>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-4xl font-black text-gray-900 dark:text-white drop-shadow-sm">{stats.totalResidents}</span>
                        <span className="text-sm font-bold text-purple-600/70 dark:text-purple-400/70">active</span>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100/50 dark:border-emerald-800/30 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl">❤️‍🩹</div>
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Health Score</div>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className={`text-4xl font-black drop-shadow-sm ${stats.healthScore > 80 ? 'text-emerald-600 dark:text-emerald-400' :
                            stats.healthScore > 50 ? 'text-amber-500' : 'text-red-500'
                            }`}>{stats.healthScore}%</span>
                    </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border border-red-100/50 dark:border-red-800/30 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-5xl">⚠️</div>
                    <div className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Needs Action</div>
                    <div className="flex items-baseline gap-2 relative z-10">
                        <span className="text-4xl font-black text-red-600 dark:text-red-400 drop-shadow-sm">
                            {stats.lowStockItems.length + stats.outOfStockItems.length}
                        </span>
                        <span className="text-sm font-bold text-red-600/70 dark:text-red-400/70">items</span>
                    </div>
                </div>
            </div>

            {/* 2. Enhanced Stock Health Visualization */}
            <div className="p-6 rounded-3xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 shadow-sm backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                        📊 Stock Health Distribution
                    </h3>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Luxurious Distribution Bar */}
                    <div className="h-4 sm:h-6 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden flex shadow-inner">
                        <div style={{ width: `${(stats.wellStockedItems.length / stats.totalItems) * 100}%` }}
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000 ease-out" />
                        <div style={{ width: `${(stats.lowStockItems.length / stats.totalItems) * 100}%` }}
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-1000 ease-out" />
                        <div style={{ width: `${(stats.outOfStockItems.length / stats.totalItems) * 100}%` }}
                            className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000 ease-out" />
                    </div>

                    {/* Rich Legend */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 group hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-colors">
                            <div className="w-4 h-12 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-sm group-hover:scale-105 transition-transform" />
                            <div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.wellStockedItems.length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Healthy</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 group hover:border-amber-200 dark:hover:border-amber-800/50 transition-colors">
                            <div className="w-4 h-12 rounded-full bg-gradient-to-b from-amber-400 to-amber-500 shadow-sm group-hover:scale-105 transition-transform" />
                            <div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.lowStockItems.length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Low Stock</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 group hover:border-red-200 dark:hover:border-red-800/50 transition-colors">
                            <div className="w-4 h-12 rounded-full bg-gradient-to-b from-red-400 to-red-500 shadow-sm group-hover:scale-105 transition-transform" />
                            <div>
                                <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.outOfStockItems.length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">Empty</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. The 3-Column Leaderboards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Top Consumed Items */}
                <div className="p-6 rounded-3xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col">
                    <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                        🔥 Top Items
                    </h3>
                    <div className="space-y-4 flex-1">
                        {stats.topItems.length > 0 ? stats.topItems.map((item, idx) => {
                            const maxCount = stats.topItems[0].count;
                            const percent = (item.count / maxCount) * 100;
                            return (
                                <div key={item.name} className="relative group">
                                    <div className="flex justify-between items-center mb-1.5 z-10 relative">
                                        <span className="flex items-center gap-2">
                                            <span className="text-sm font-bold w-4 text-gray-300 dark:text-gray-600">{idx + 1}.</span>
                                            <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">{item.name}</span>
                                        </span>
                                        <span className="font-black text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-sm">{item.count}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${percent}%` }}
                                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${idx === 0 ? 'from-primary-400 to-primary-600' : 'from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600'}`}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-60">
                                <span className="text-4xl mb-2">📉</span>
                                <p className="text-sm font-medium">No item data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Consumers (People) */}
                <div className="p-6 rounded-3xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col">
                    <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                        👑 Top Consumers
                    </h3>
                    <div className="space-y-4 flex-1">
                        {stats.topPeople.length > 0 ? stats.topPeople.map((person, idx) => {
                            const maxCount = stats.topPeople[0].count;
                            const percent = (person.count / maxCount) * 100;
                            return (
                                <div key={person.name} className="relative group">
                                    <div className="flex justify-between items-center mb-1.5 z-10 relative">
                                        <span className="flex items-center gap-2">
                                            <span className="text-sm font-bold w-4 text-gray-300 dark:text-gray-600">{idx + 1}.</span>
                                            <span className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-500 transition-colors">{person.name}</span>
                                        </span>
                                        <span className="font-black text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-sm">{person.count}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${percent}%` }}
                                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${idx === 0 ? 'from-purple-400 to-purple-600' : 'from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600'}`}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-60">
                                <span className="text-4xl mb-2">👤</span>
                                <p className="text-sm font-medium">No consumer data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Locations */}
                <div className="p-6 rounded-3xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col">
                    <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                        📍 Top Locations
                    </h3>
                    <div className="space-y-4 flex-1">
                        {stats.topLocations.length > 0 ? stats.topLocations.map((loc, idx) => {
                            const maxCount = stats.topLocations[0].count;
                            const percent = (loc.count / maxCount) * 100;
                            return (
                                <div key={loc.name} className="relative group">
                                    <div className="flex justify-between items-center mb-1.5 z-10 relative">
                                        <span className="flex items-center gap-2">
                                            <span className="text-sm font-bold w-4 text-gray-300 dark:text-gray-600">{idx + 1}.</span>
                                            <span className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">{loc.name}</span>
                                        </span>
                                        <span className="font-black text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-sm">{loc.count}</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${percent}%` }}
                                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${idx === 0 ? 'from-emerald-400 to-emerald-600' : 'from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600'}`}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-60">
                                <span className="text-4xl mb-2">🗺️</span>
                                <p className="text-sm font-medium">No location data</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* 4. Actionable Alerts (Low/Out Stock) */}
            {(stats.lowStockItems.length > 0 || stats.outOfStockItems.length > 0) && (
                <div className="mt-8 rounded-3xl overflow-hidden border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-800/80 shadow-sm">
                    <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-gray-800 border-b border-red-100 dark:border-red-900/30 flex items-center justify-between">
                        <h3 className="text-base font-black text-red-700 dark:text-red-400 flex items-center gap-2">
                            <span className="animate-pulse">🚨</span> Action Required ({stats.lowStockItems.length + stats.outOfStockItems.length})
                        </h3>
                        <span className="text-xs font-bold px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-full">
                            Restock Recommended
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {[...stats.outOfStockItems, ...stats.lowStockItems].slice(0, 5).map(item => (
                            <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700 text-2xl shadow-inner">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-base">{item.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                                            Current Stock:
                                            <span className={`font-black px-1.5 py-0.5 rounded-md ${item.currentStock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                {item.currentStock}
                                            </span>
                                            <span className="opacity-50">/</span>
                                            <span className="text-xs font-semibold">Min: {item.minStock}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRestock && onRestock(item)}
                                    className="px-5 py-2.5 text-sm font-bold bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-sm text-gray-900 dark:text-white hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-500 dark:hover:text-primary-400 transition-all active:scale-95"
                                >
                                    Restock Now
                                </button>
                            </div>
                        ))}
                        {stats.lowStockItems.length + stats.outOfStockItems.length > 5 && (
                            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                <button className="w-full text-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                    View All {stats.lowStockItems.length + stats.outOfStockItems.length} Alerts
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
