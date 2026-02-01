import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function ItemRecordsModal({ isOpen, onClose, item, currentInventoryId }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('usage'); // 'usage', 'statistics'

    const fetchRecords = useCallback(async () => {
        if (!item || !currentInventoryId) {
            setLoading(false);
            return;
        }

        // Only fetch for usage tab, statistics uses the same data
        if (activeTab !== 'usage') {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            // Fetch usage history from 'logs' collection (not 'history')
            const logsRef = collection(db, 'inventories', currentInventoryId, 'logs');
            const q = query(
                logsRef,
                where('itemId', '==', item.id),
                limit(50)
            );
            const snapshot = await getDocs(q);
            const history = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore timestamp to JS Date
                timestamp: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
            }));

            // Sort by timestamp descending (newest first) on client-side
            history.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));

            setRecords(history);
        } catch (error) {
            console.error('Error fetching records:', error);
            setRecords([]);
        } finally {
            setLoading(false);
        }
    }, [item, currentInventoryId, activeTab]);

    useEffect(() => {
        if (isOpen && item && currentInventoryId) {
            fetchRecords();
        } else if (isOpen) {
            setLoading(false);
        }
    }, [isOpen, item, currentInventoryId, fetchRecords]);

    const getActionBadge = (action) => {
        const badges = {
            'used': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'restocked': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'consume': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'restock': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'add': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'edit': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        };
        return badges[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    // Calculate statistics from records
    const calculateStatistics = useCallback(() => {
        if (!records || records.length === 0) return null;

        const now = new Date();
        const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

        const consumed = records.filter(r => r.action === 'used');
        const restocked = records.filter(r => r.action === 'restocked');

        const totalConsumed = consumed.reduce((sum, r) => sum + (r.quantity || 0), 0);
        const totalRestocked = restocked.reduce((sum, r) => sum + (r.quantity || 0), 0);
        const netChange = totalRestocked - totalConsumed;

        const last7Days = records.filter(r => r.timestamp >= sevenDaysAgo);
        const last30Days = records.filter(r => r.timestamp >= thirtyDaysAgo);

        const consumed7d = last7Days.filter(r => r.action === 'used').reduce((sum, r) => sum + (r.quantity || 0), 0);
        const restocked7d = last7Days.filter(r => r.action === 'restocked').reduce((sum, r) => sum + (r.quantity || 0), 0);
        const consumed30d = last30Days.filter(r => r.action === 'used').reduce((sum, r) => sum + (r.quantity || 0), 0);
        const restocked30d = last30Days.filter(r => r.action === 'restocked').reduce((sum, r) => sum + (r.quantity || 0), 0);

        const daysOfData = consumed.length > 0
            ? Math.max(1, (now - consumed[consumed.length - 1].timestamp) / (1000 * 60 * 60 * 24))
            : 1;
        const avgPerWeek = (totalConsumed / daysOfData) * 7;

        const currentStock = item?.currentStock || 0;
        const avgPerDay = avgPerWeek / 7;
        const daysRemaining = avgPerDay > 0 ? Math.floor(currentStock / avgPerDay) : Infinity;

        const lastRestock = restocked[0];

        const restockDates = restocked.map(r => r.timestamp);
        let avgRestockDays = null;
        if (restockDates.length > 1) {
            const intervals = [];
            for (let i = 0; i < restockDates.length - 1; i++) {
                intervals.push((restockDates[i] - restockDates[i + 1]) / (1000 * 60 * 60 * 24));
            }
            avgRestockDays = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
        }

        const userUsage = {};
        consumed.forEach(r => {
            const user = r.residentName || 'Unknown';
            userUsage[user] = (userUsage[user] || 0) + (r.quantity || 0);
        });

        const topUsers = Object.entries(userUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({
                name,
                count,
                percentage: Math.round((count / totalConsumed) * 100)
            }));

        const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
        const previous30Days = records.filter(r => r.timestamp >= sixtyDaysAgo && r.timestamp < thirtyDaysAgo);
        const consumedPrev30d = previous30Days.filter(r => r.action === 'used').reduce((sum, r) => sum + (r.quantity || 0), 0);

        let trend = 'stable';
        if (consumed30d > consumedPrev30d * 1.2) trend = 'increasing';
        else if (consumed30d < consumedPrev30d * 0.8) trend = 'decreasing';

        return {
            totalConsumed,
            totalRestocked,
            netChange,
            avgPerWeek: avgPerWeek.toFixed(1),
            daysRemaining: daysRemaining === Infinity ? '∞' : daysRemaining,
            lastRestock: lastRestock?.timestamp,
            avgRestockDays,
            topUsers,
            last7Days: { consumed: consumed7d, restocked: restocked7d },
            last30Days: { consumed: consumed30d, restocked: restocked30d },
            trend,
            currentStock
        };
    }, [records, item]);

    const stats = activeTab === 'statistics' ? calculateStatistics() : null;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="text-5xl">{item?.icon || '📦'}</div>
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                                    {item?.name || 'Item'} Records
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Current Stock: {item?.currentStock || 0}
                                </p>
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

                    {/* Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('usage')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'usage'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            Usage History
                        </button>
                        <button
                            onClick={() => setActiveTab('statistics')}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${activeTab === 'statistics'
                                ? 'bg-primary-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            📊 Statistics
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : activeTab === 'statistics' ? (
                        /* Statistics Tab */
                        !stats || records.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-3 opacity-30">📊</div>
                                <p className="text-gray-500 dark:text-gray-400">
                                    No data available for statistics
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Overview Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
                                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.totalConsumed}</div>
                                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Total Used</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800">
                                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.totalRestocked}</div>
                                        <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Total Restocked</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800">
                                        <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                                            {stats.netChange > 0 ? '+' : ''}{stats.netChange}
                                        </div>
                                        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">Net Change</div>
                                    </div>
                                    <div className={`p-4 rounded-xl border-2 ${stats.currentStock <= (item?.minStock || 0)
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                        }`}>
                                        <div className={`text-3xl font-black ${stats.currentStock <= (item?.minStock || 0)
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            {stats.currentStock}
                                        </div>
                                        <div className={`text-xs font-semibold uppercase tracking-wide ${stats.currentStock <= (item?.minStock || 0)
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-gray-600 dark:text-gray-400'
                                            }`}>
                                            Current Stock
                                        </div>
                                    </div>
                                </div>

                                {/* Usage Analysis */}
                                <div className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        📈 Usage Analysis
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Avg consumption rate:</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{stats.avgPerWeek} items/week</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Days of supply remaining:</span>
                                            <span className={`font-bold ${stats.daysRemaining !== '∞' && stats.daysRemaining < 7
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {stats.daysRemaining === '∞' ? '∞' : `~${stats.daysRemaining} days`}
                                                {stats.daysRemaining !== '∞' && stats.daysRemaining < 7 && ' ⚠️'}
                                            </span>
                                        </div>
                                        {stats.lastRestock && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Last restocked:</span>
                                                <span className="font-bold text-gray-900 dark:text-white">{formatDate(stats.lastRestock)}</span>
                                            </div>
                                        )}
                                        {stats.avgRestockDays && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Restock frequency:</span>
                                                <span className="font-bold text-gray-900 dark:text-white">Every ~{stats.avgRestockDays} days</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Usage trend:</span>
                                            <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1">
                                                {stats.trend === 'increasing' && '↑ Increasing'}
                                                {stats.trend === 'decreasing' && '↓ Decreasing'}
                                                {stats.trend === 'stable' && '→ Stable'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Users */}
                                {stats.topUsers.length > 0 && (
                                    <div className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            👥 Top Users
                                        </h3>
                                        <div className="space-y-3">
                                            {stats.topUsers.map((user, index) => (
                                                <div key={user.name} className="flex items-center gap-3">
                                                    <span className="text-2xl">
                                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•'}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span>
                                                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400">
                                                                {user.count} ({user.percentage}%)
                                                            </span>
                                                        </div>
                                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary-500 rounded-full transition-all"
                                                                style={{ width: `${user.percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Activity Summary */}
                                <div className="p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        📅 Activity Summary
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Last 7 Days:</span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {stats.last7Days.consumed} used, {stats.last7Days.restocked} restocked
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Last 30 Days:</span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {stats.last30Days.consumed} used, {stats.last30Days.restocked} restocked
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Insights */}
                                {(stats.daysRemaining !== '∞' && stats.daysRemaining < 7) && (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">💡</span>
                                            <div>
                                                <h4 className="font-bold text-amber-900 dark:text-amber-400 mb-1">Insight</h4>
                                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                                    Stock is running low! Consider restocking soon. At the current consumption rate,
                                                    you have approximately {stats.daysRemaining} days of supply remaining.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : records.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-3 opacity-30">📋</div>
                            <p className="text-gray-500 dark:text-gray-400">
                                No usage history found
                            </p>
                        </div>
                    ) : (
                        /* Usage History Tab */
                        <div className="space-y-3">
                            {records.map((record) => (
                                <div
                                    key={record.id}
                                    className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-gray-800"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-black uppercase tracking-wider ${getActionBadge(record.action)}`}>
                                                    {record.action}
                                                </span>
                                                {record.residentName && (
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {record.residentName}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <span>Quantity:</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {record.quantity || 0}
                                                    </span>
                                                </div>
                                                {record.newStock !== undefined && (
                                                    <div className="flex items-center gap-1">
                                                        <span>New Stock:</span>
                                                        <span className="font-bold text-gray-900 dark:text-white">
                                                            {record.newStock}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {record.note && (
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                                                    "{record.note}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {formatDate(record.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
