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

        // Top consumed items - using filtered logs
        const itemUsage = {};
        filteredLogs.forEach(log => {
            if (log.action === 'used' && log.itemName) {
                itemUsage[log.itemName] = (itemUsage[log.itemName] || 0) + (log.quantity || 0);
            }
        });

        const topItems = Object.entries(itemUsage)
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
            recentCount,
            previousCount,
            trend,
            healthScore
        };
    }, [items, residents, filteredLogs]);

    return (
        <div className="space-y-4 animate-fade-in">
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

            {/* 1. Hero Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card p-3 border-l-4 border-primary-500">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Items</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalItems}</span>
                        <span className="text-xs text-gray-400">SKUs</span>
                    </div>
                </div>
                <div className="card p-3 border-l-4 border-blue-500">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Residents</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalResidents}</span>
                        <span className="text-xs text-gray-400">active</span>
                    </div>
                </div>
                <div className="card p-3 border-l-4 border-emerald-500">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Health Score</div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${stats.healthScore > 80 ? 'text-emerald-500' : stats.healthScore > 50 ? 'text-amber-500' : 'text-red-500'
                            }`}>{stats.healthScore}%</span>
                    </div>
                </div>
                <div className="card p-3 border-l-4 border-red-500">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Alerts</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-red-500">
                            {stats.lowStockItems.length + stats.outOfStockItems.length}
                        </span>
                        <span className="text-xs text-gray-400">items</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 2. Stock Health Visualization */}
                <div className="card p-4 flex flex-col">
                    <h3 className="text-base font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        📊 Stock Health Distribution
                    </h3>

                    <div className="flex-1 flex flex-col justify-center gap-6">
                        {/* Distribution Bar */}
                        <div className="h-6 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                            <div style={{ width: `${(stats.wellStockedItems.length / stats.totalItems) * 100}%` }} className="h-full bg-emerald-500" />
                            <div style={{ width: `${(stats.lowStockItems.length / stats.totalItems) * 100}%` }} className="h-full bg-amber-400" />
                            <div style={{ width: `${(stats.outOfStockItems.length / stats.totalItems) * 100}%` }} className="h-full bg-red-500" />
                        </div>

                        {/* Legend / Stats */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.wellStockedItems.length}</div>
                                <div className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">Healthy</div>
                            </div>
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
                                <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.lowStockItems.length}</div>
                                <div className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">Low</div>
                            </div>
                            <div className="p-2 bg-red-50 dark:bg-red-900/10 rounded-lg">
                                <div className="text-xl font-bold text-red-600 dark:text-red-400">{stats.outOfStockItems.length}</div>
                                <div className="text-xs font-bold uppercase text-red-800 dark:text-red-300">Empty</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Consumption Leaderboard */}
                <div className="card p-4">
                    <h3 className="text-base font-black text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        🔥 Top Consumed Items
                    </h3>
                    <div className="space-y-3">
                        {stats.topItems.length > 0 ? stats.topItems.map((item, idx) => {
                            const maxCount = stats.topItems[0].count; // Benchmark against top item
                            const percent = (item.count / maxCount) * 100;
                            return (
                                <div key={item.name} className="relative">
                                    <div className="flex justify-between items-center mb-1 text-sm font-medium z-10 relative">
                                        <span className="flex items-center gap-2">
                                            <span className="text-xs font-bold w-5 text-gray-400">#{idx + 1}</span>
                                            <span>{item.name}</span>
                                        </span>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{item.count}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            style={{ width: `${percent}%` }}
                                            className={`h-full rounded-full ${idx === 0 ? 'bg-primary-500' : 'bg-primary-300 dark:bg-primary-700'}`}
                                        />
                                    </div>
                                </div>
                            );
                        }) : (
                            <p className="text-gray-500 text-center py-4">No data available</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Actionable Alerts (Low/Out Stock) */}
            {(stats.lowStockItems.length > 0 || stats.outOfStockItems.length > 0) && (
                <div className="card overflow-hidden">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                            ⚠️ Needs Attention ({stats.lowStockItems.length + stats.outOfStockItems.length})
                        </h3>
                        <span className="text-xs font-semibold px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-red-600 shadow-sm">
                            Restock Recommended
                        </span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {[...stats.outOfStockItems, ...stats.lowStockItems].slice(0, 5).map(item => (
                            <div key={item.id} className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{item.icon}</span>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</p>
                                        <p className="text-xs text-gray-500">
                                            Stock: <span className={`font-bold ${item.currentStock === 0 ? 'text-red-600' : 'text-amber-500'}`}>{item.currentStock}</span>
                                            {' '}/ Min: {item.minStock}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onRestock && onRestock(item)}
                                    className="px-2.5 py-1.5 text-xs font-bold bg-white border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Restock
                                </button>
                            </div>
                        ))}
                        {stats.lowStockItems.length + stats.outOfStockItems.length > 5 && (
                            <div className="p-2 text-center text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                                + {stats.lowStockItems.length + stats.outOfStockItems.length - 5} more items
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
