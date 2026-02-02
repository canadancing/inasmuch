import { useMemo } from 'react';

export default function EntityDetailModal({ isOpen, onClose, entity, logs = [] }) {
    if (!isOpen || !entity) return null;

    const { name, type, totalUses, activityLevel, lastActive, avatar, tags = [] } = entity;

    // Calculate statistics from logs
    const stats = useMemo(() => {
        const entityLogs = logs.filter(log => log.residentName === name || log.residentId === entity.id);

        // Top items
        const itemUsage = {};
        entityLogs.forEach(log => {
            if (log.action === 'used') {
                const itemName = log.itemName || 'Unknown';
                itemUsage[itemName] = (itemUsage[itemName] || 0) + (log.quantity || 0);
            }
        });

        const topItems = Object.entries(itemUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                count,
                percentage: Math.round((count / totalUses) * 100) || 0
            }));

        // Recent activity (last 10)
        const recentActivity = entityLogs
            .sort((a, b) => (b.date?.toDate?.() || new Date(b.date)) - (a.date?.toDate?.() || new Date(a.date)))
            .slice(0, 10);

        // Trend analysis
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

        const last30Days = entityLogs.filter(log => {
            const logDate = log.date?.toDate?.() || new Date(log.date);
            return logDate >= thirtyDaysAgo && log.action === 'used';
        });

        const previous30Days = entityLogs.filter(log => {
            const logDate = log.date?.toDate?.() || new Date(log.date);
            return logDate >= sixtyDaysAgo && logDate < thirtyDaysAgo && log.action === 'used';
        });

        const last30Count = last30Days.reduce((sum, log) => sum + (log.quantity || 0), 0);
        const prev30Count = previous30Days.reduce((sum, log) => sum + (log.quantity || 0), 0);

        let trend = 'stable';
        if (last30Count > prev30Count * 1.2) trend = 'increasing';
        else if (last30Count < prev30Count * 0.8) trend = 'decreasing';

        return {
            topItems,
            recentActivity,
            trend,
            last30Count
        };
    }, [logs, name, entity.id, totalUses]);

    const typeConfig = {
        resident: { label: '🏠 Resident', color: 'blue' },
        common_area: { label: '📍 Common Area', color: 'emerald' },
        staff: { label: '👔 Staff', color: 'purple' },
        donor: { label: '💝 Donor', color: 'pink' }
    };

    const config = typeConfig[type] || typeConfig.resident;

    const formatDate = (date) => {
        if (!date) return 'N/A';
        const d = date?.toDate ? date.toDate() : new Date(date);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(d);
    };

    const formatLastActive = (date) => {
        if (!date) return 'Never';
        const now = new Date();
        const diff = now - new Date(date);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-600 dark:text-${config.color}-400 flex items-center justify-center text-3xl font-black border-2 border-${config.color}-200 dark:border-${config.color}-800`}>
                                {avatar || name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                    {name}
                                </h2>
                                <p className={`text-sm font-semibold text-${config.color}-600 dark:text-${config.color}-400`}>
                                    {config.label}
                                </p>
                                {tags.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                        {tags.map(tag => (
                                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Usage Statistics */}
                    <div className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            📊 Usage Statistics
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total consumed:</span>
                                <span className="font-bold text-gray-900 dark:text-white">{totalUses || 0} items</span>
                            </div>
                            {stats.topItems.length > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Most used:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {stats.topItems[0].name} ({stats.topItems[0].percentage}%)
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Usage trend:</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {stats.trend === 'increasing' && '↑ Increasing'}
                                    {stats.trend === 'decreasing' && '↓ Decreasing'}
                                    {stats.trend === 'stable' && '→ Stable'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Last active:</span>
                                <span className="font-bold text-gray-900 dark:text-white">{formatLastActive(lastActive)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Items */}
                    {stats.topItems.length > 0 && (
                        <div className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                🏆 Top 5 Items
                            </h3>
                            <div className="space-y-3">
                                {stats.topItems.map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                        </span>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
                                                <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                                    {item.count} ({item.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary-500 rounded-full transition-all"
                                                    style={{ width: `${item.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    {stats.recentActivity.length > 0 && (
                        <div className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                📅 Recent Activity
                            </h3>
                            <div className="space-y-2">
                                {stats.recentActivity.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${log.action === 'used'
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                }`}>
                                                {log.action}
                                            </span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {log.quantity}× {log.itemName || 'Unknown'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(log.date)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {stats.recentActivity.length === 0 && (
                        <div className="text-center py-8">
                            <div className="text-5xl mb-3 opacity-30">📭</div>
                            <p className="text-gray-500 dark:text-gray-400">No activity yet</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
