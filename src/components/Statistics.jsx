import { useMemo } from 'react';

export default function Statistics({ logs, items, residents }) {
    // Calculate statistics
    const stats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Filter logs for current month
        const monthlyLogs = logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
        });

        // Usage by item (this month)
        const itemUsage = {};
        monthlyLogs.forEach(log => {
            if (log.action === 'used') {
                const key = log.itemName || 'Unknown';
                itemUsage[key] = (itemUsage[key] || 0) + (log.quantity || 1);
            }
        });

        // Usage by resident (this month)
        const residentUsage = {};
        monthlyLogs.forEach(log => {
            if (log.action === 'used') {
                const key = log.residentName || 'Unknown';
                residentUsage[key] = (residentUsage[key] || 0) + (log.quantity || 1);
            }
        });

        // Restocks this month
        const restocks = monthlyLogs.filter(log => log.action === 'restocked').length;

        // Total usage this month
        const totalUsage = monthlyLogs.filter(log => log.action === 'used')
            .reduce((sum, log) => sum + (log.quantity || 1), 0);

        // Daily usage for the last 7 days
        const dailyUsage = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayLogs = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate.toDateString() === date.toDateString() && log.action === 'used';
            });
            dailyUsage.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                count: dayLogs.reduce((sum, log) => sum + (log.quantity || 1), 0)
            });
        }

        // Low stock items
        const lowStockItems = items.filter(item => item.currentStock <= 3);

        // Top 5 most used items this month
        const topItems = Object.entries(itemUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return {
            monthlyLogs,
            itemUsage,
            residentUsage,
            restocks,
            totalUsage,
            dailyUsage,
            lowStockItems,
            topItems,
            currentMonthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
    }, [logs, items]);

    const maxDaily = Math.max(...stats.dailyUsage.map(d => d.count), 1);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="card p-4 text-center">
                    <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{stats.totalUsage}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Items Used</p>
                    <p className="text-xs text-gray-400">{stats.currentMonthName}</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.restocks}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Restocks</p>
                    <p className="text-xs text-gray-400">This Month</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.lowStockItems.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Low Stock</p>
                    <p className="text-xs text-gray-400">≤ 3 items</p>
                </div>
                <div className="card p-4 text-center">
                    <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.monthlyLogs.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
                    <p className="text-xs text-gray-400">This Month</p>
                </div>
            </div>

            {/* 7-Day Usage Chart */}
            <div className="card p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Last 7 Days Usage</h3>
                <div className="flex items-end justify-between gap-2 h-32">
                    {stats.dailyUsage.map((day, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex flex-col justify-end h-24">
                                <div
                                    className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all duration-300"
                                    style={{ height: `${(day.count / maxDaily) * 100}%`, minHeight: day.count > 0 ? '8px' : '2px' }}
                                />
                            </div>
                            <span className="text-xs text-gray-500">{day.date}</span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{day.count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Items */}
            {stats.topItems.length > 0 && (
                <div className="card p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Items ({stats.currentMonthName})</h3>
                    <div className="space-y-3">
                        {stats.topItems.map(([name, count], i) => {
                            const maxCount = stats.topItems[0][1];
                            const item = items.find(it => it.name === name);
                            return (
                                <div key={name} className="flex items-center gap-3">
                                    <span className="text-lg w-6 text-center">{item?.icon || '📦'}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                                            <span className="text-gray-500">{count} used</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                                                style={{ width: `${(count / maxCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Usage by Resident */}
            {Object.keys(stats.residentUsage).length > 0 && (
                <div className="card p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Usage by Resident ({stats.currentMonthName})</h3>
                    <div className="space-y-3">
                        {Object.entries(stats.residentUsage)
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, count]) => {
                                const maxCount = Math.max(...Object.values(stats.residentUsage));
                                return (
                                    <div key={name} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                                            {name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                                                <span className="text-gray-500">{count} items</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                                    style={{ width: `${(count / maxCount) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Low Stock Alert */}
            {stats.lowStockItems.length > 0 && (
                <div className="card p-4 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                    <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                        ⚠️ Low Stock Alert
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.lowStockItems.map(item => (
                            <span
                                key={item.id}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-900 rounded-full text-sm"
                            >
                                <span>{item.icon}</span>
                                <span className="font-medium">{item.name}</span>
                                <span className="text-red-500">({item.currentStock})</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
