import { useMemo } from 'react';

/**
 * EntityStatsModal - Rich analytics popup for People, Locations, and Items
 */
export default function EntityStatsModal({ isOpen, onClose, entity, entityType = 'person', logs = [], items = [], residents = [] }) {
    if (!isOpen || !entity) return null;

    const isItem = entityType === 'item';

    // ─── Shared helpers ────────────────────────────────────────────────
    const parseDate = (raw) => {
        if (!raw) return null;
        if (raw?.toDate) return raw.toDate();
        return new Date(raw);
    };

    const daysBetween = (a, b) => {
        if (!a || !b) return null;
        return Math.round(Math.abs((b - a) / (1000 * 60 * 60 * 24)));
    };

    const fmt = (date) => {
        if (!date) return '—';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const fmtDuration = (days) => {
        if (days === null) return '—';
        if (days < 1) return 'Less than a day';
        if (days === 1) return '1 day';
        if (days < 30) return `${days} days`;
        const months = Math.floor(days / 30);
        const rem = days % 30;
        return rem > 0 ? `${months}mo ${rem}d` : `${months} month${months > 1 ? 's' : ''}`;
    };

    // ─── STATS for People / Locations ─────────────────────────────────
    const personStats = useMemo(() => {
        if (isItem) return null;

        const entityName = entity.displayName || entity.name ||
            `${entity.firstName || ''} ${entity.lastName || ''}`.trim() || 'Unknown';

        const entityLogs = logs.filter(l =>
            l.residentId === entity.id || l.residentName === entityName
        );

        const usedLogs = entityLogs.filter(l => l.action === 'used');
        const restockedLogs = entityLogs.filter(l => l.action === 'restocked');

        // Timeline
        const moveInDate = parseDate(entity.createdAt);
        const moveOutDate = entity.status === 'moved_out' ? parseDate(entity.updatedAt || entity.deletedAt) : null;
        const today = new Date();
        const lengthOfStay = daysBetween(moveInDate, moveOutDate || today);

        // Item consumption breakdown
        const itemUsageMap = {};
        usedLogs.forEach(l => {
            const key = l.itemName || l.itemId || 'Unknown';
            itemUsageMap[key] = (itemUsageMap[key] || 0) + (l.quantity || 0);
        });
        const topItems = Object.entries(itemUsageMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const totalConsumed = usedLogs.reduce((s, l) => s + (l.quantity || 0), 0);
        const totalRestocked = restockedLogs.reduce((s, l) => s + (l.quantity || 0), 0);

        // Streak - days since last activity
        const sortedDates = entityLogs
            .map(l => parseDate(l.date))
            .filter(Boolean)
            .sort((a, b) => b - a);
        const lastActive = sortedDates[0] || null;
        const firstActive = sortedDates[sortedDates.length - 1] || null;

        // Weekly avg consumption
        const activePeriodDays = daysBetween(firstActive, lastActive) || 1;
        const weeklyAvg = activePeriodDays > 0
            ? ((totalConsumed / activePeriodDays) * 7).toFixed(1)
            : '0';

        // Monthly activity buckets (last 6 months)
        const monthBuckets = {};
        usedLogs.forEach(l => {
            const d = parseDate(l.date);
            if (!d) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthBuckets[key] = (monthBuckets[key] || 0) + (l.quantity || 0);
        });
        const sortedMonths = Object.entries(monthBuckets).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
        const maxMonth = Math.max(...sortedMonths.map(([, v]) => v), 1);

        return {
            entityName,
            moveInDate,
            moveOutDate,
            lengthOfStay,
            totalConsumed,
            totalRestocked,
            topItems,
            lastActive,
            weeklyAvg,
            sortedMonths,
            maxMonth,
            totalLogs: entityLogs.length,
            isActive: entity.status !== 'moved_out'
        };
    }, [entity, logs, isItem]);

    // ─── STATS for Items ──────────────────────────────────────────────
    const itemStats = useMemo(() => {
        if (!isItem) return null;

        const itemLogs = logs.filter(l => l.itemId === entity.id || l.itemName === entity.name);
        const usedLogs = itemLogs.filter(l => l.action === 'used');
        const restockedLogs = itemLogs.filter(l => l.action === 'restocked');

        const totalConsumed = usedLogs.reduce((s, l) => s + (l.quantity || 0), 0);
        const totalRestocked = restockedLogs.reduce((s, l) => s + (l.quantity || 0), 0);

        // Top consumers
        const consumerMap = {};
        usedLogs.forEach(l => {
            const key = l.residentName || l.residentId || 'Unknown';
            consumerMap[key] = (consumerMap[key] || 0) + (l.quantity || 0);
        });
        const topConsumers = Object.entries(consumerMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        // Timeline
        const addedDate = parseDate(entity.createdAt);
        const sortedDates = itemLogs
            .map(l => parseDate(l.date))
            .filter(Boolean)
            .sort((a, b) => b - a);
        const lastUsed = sortedDates[0] || null;
        const lastRestockedLog = restockedLogs
            .map(l => ({ date: parseDate(l.date), qty: l.quantity }))
            .filter(l => l.date)
            .sort((a, b) => b.date - a.date)[0] || null;

        // Monthly activity buckets (last 6 months)
        const monthBuckets = {};
        usedLogs.forEach(l => {
            const d = parseDate(l.date);
            if (!d) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthBuckets[key] = (monthBuckets[key] || 0) + (l.quantity || 0);
        });
        const sortedMonths = Object.entries(monthBuckets).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
        const maxMonth = Math.max(...sortedMonths.map(([, v]) => v), 1);

        // Daily avg (over active period)
        const firstLog = sortedDates[sortedDates.length - 1] || null;
        const activeDays = daysBetween(firstLog, new Date()) || 1;
        const dailyAvg = (totalConsumed / activeDays).toFixed(1);

        return {
            addedDate,
            lastUsed,
            lastRestockedLog,
            totalConsumed,
            totalRestocked,
            topConsumers,
            currentStock: entity.stock ?? entity.quantity ?? 0,
            location: entity.location || '—',
            dailyAvg,
            sortedMonths,
            maxMonth,
            totalLogs: itemLogs.length
        };
    }, [entity, logs, isItem]);

    const stats = isItem ? itemStats : personStats;

    // ─── Mini Bar Chart ───────────────────────────────────────────────
    const MiniBarChart = ({ data, maxVal, colorClass }) => (
        <div className="flex items-end gap-1 h-12 mt-2">
            {data.length === 0 ? (
                <div className="text-xs text-gray-400 italic self-center">No data yet</div>
            ) : data.map(([key, val]) => {
                const monthLabel = key.substring(5); // MM
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const label = monthNames[parseInt(monthLabel, 10) - 1] || monthLabel;
                const pct = Math.max((val / maxVal) * 100, 4);
                return (
                    <div key={key} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                            className={`w-full rounded-t-sm ${colorClass}`}
                            style={{ height: `${pct}%` }}
                            title={`${label}: ${val}`}
                        />
                        <span className="text-[9px] text-gray-400">{label}</span>
                    </div>
                );
            })}
        </div>
    );

    const StatRow = ({ icon, label, value, highlight }) => (
        <div className={`flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0 ${highlight ? 'font-semibold' : ''}`}>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{icon}</span>
                <span>{label}</span>
            </div>
            <span className={`text-sm font-bold ${highlight ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                {value}
            </span>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-300">

                {/* ── Header ── */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-t-3xl px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-2xl shadow font-bold text-white shrink-0">
                                {isItem
                                    ? (entity.icon || '📦')
                                    : (entity.avatar || (entity.entityType === 'location' ? '📍' : '👤'))
                                }
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                                    {isItem ? entity.name : stats?.entityName}
                                </h2>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {isItem ? (entity.location || 'No location') : (entity.primaryRole || entity.entityType || 'Entity')}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 px-5 py-4 space-y-5">

                    {/* ─── PERSON STATS ─── */}
                    {!isItem && personStats && (<>

                        {/* Status badge */}
                        <div className="flex gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${personStats.isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                }`}>
                                {personStats.isActive ? '● Active' : '● Moved Out'}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                📊 {personStats.totalLogs} log entries
                            </span>
                        </div>

                        {/* Timeline card */}
                        <div className="card p-4 space-y-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">🗓️ Timeline</h3>
                            <StatRow icon="📅" label="Moved in" value={fmt(personStats.moveInDate)} />
                            {personStats.moveOutDate && (
                                <StatRow icon="🚪" label="Moved out" value={fmt(personStats.moveOutDate)} />
                            )}
                            <StatRow icon="⏳" label={personStats.isActive ? 'Stay so far' : 'Total stay'} value={fmtDuration(personStats.lengthOfStay)} highlight />
                            <StatRow icon="🕒" label="Last active" value={personStats.lastActive ? fmt(personStats.lastActive) : '—'} />
                        </div>

                        {/* Consumption card */}
                        <div className="card p-4 space-y-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">📦 Consumption</h3>
                            <StatRow icon="📉" label="Total items used" value={personStats.totalConsumed} highlight />
                            <StatRow icon="📈" label="Total restocked" value={personStats.totalRestocked} />
                            <StatRow icon="📊" label="Weekly avg" value={`${personStats.weeklyAvg} units`} />
                        </div>

                        {/* Top items */}
                        {personStats.topItems.length > 0 && (
                            <div className="card p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">🏆 Most Consumed</h3>
                                <div className="space-y-2">
                                    {personStats.topItems.map(([name, qty], i) => {
                                        const pct = Math.round((qty / personStats.topItems[0][1]) * 100);
                                        return (
                                            <div key={name}>
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{i + 1}. {name}</span>
                                                    <span className="text-xs font-bold text-gray-500 ml-2 shrink-0">{qty} units</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-primary-400 to-accent-400"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Monthly activity chart */}
                        {personStats.sortedMonths.length > 0 && (
                            <div className="card p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">📅 Monthly Activity</h3>
                                <MiniBarChart
                                    data={personStats.sortedMonths}
                                    maxVal={personStats.maxMonth}
                                    colorClass="bg-gradient-to-t from-primary-500 to-accent-400"
                                />
                            </div>
                        )}

                        {personStats.topItems.length === 0 && personStats.totalLogs === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <div className="text-4xl mb-2">📭</div>
                                <p className="text-sm">No activity logged yet</p>
                            </div>
                        )}
                    </>)}

                    {/* ─── ITEM STATS ─── */}
                    {isItem && itemStats && (<>

                        {/* Stock badge */}
                        <div className="flex gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${itemStats.currentStock === 0
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : itemStats.currentStock < 3
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                }`}>
                                {itemStats.currentStock === 0 ? '🔴 Out of Stock' : itemStats.currentStock < 3 ? '🟡 Low Stock' : '🟢 In Stock'}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                📊 {itemStats.totalLogs} log entries
                            </span>
                        </div>

                        {/* Stock overview */}
                        <div className="card p-4 space-y-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">📦 Stock Info</h3>
                            <StatRow icon="🏷️" label="Current stock" value={itemStats.currentStock} highlight />
                            <StatRow icon="📍" label="Location" value={itemStats.location} />
                            <StatRow icon="📅" label="Added on" value={fmt(itemStats.addedDate)} />
                            <StatRow icon="🕒" label="Last used" value={fmt(itemStats.lastUsed)} />
                            {itemStats.lastRestockedLog && (
                                <StatRow icon="📦" label="Last restocked" value={`${fmt(itemStats.lastRestockedLog.date)} (+${itemStats.lastRestockedLog.qty})`} />
                            )}
                        </div>

                        {/* Consumption */}
                        <div className="card p-4 space-y-0">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">📉 Usage</h3>
                            <StatRow icon="📉" label="Total consumed" value={itemStats.totalConsumed} highlight />
                            <StatRow icon="📈" label="Total restocked" value={itemStats.totalRestocked} />
                            <StatRow icon="📊" label="Daily avg" value={`${itemStats.dailyAvg} units/day`} />
                        </div>

                        {/* Top consumers */}
                        {itemStats.topConsumers.length > 0 && (
                            <div className="card p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">🏆 Top Consumers</h3>
                                <div className="space-y-2">
                                    {itemStats.topConsumers.map(([name, qty], i) => {
                                        const pct = Math.round((qty / itemStats.topConsumers[0][1]) * 100);
                                        return (
                                            <div key={name}>
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{i + 1}. {name}</span>
                                                    <span className="text-xs font-bold text-gray-500 ml-2 shrink-0">{qty} units</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Monthly chart */}
                        {itemStats.sortedMonths.length > 0 && (
                            <div className="card p-4">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">📅 Monthly Usage</h3>
                                <MiniBarChart
                                    data={itemStats.sortedMonths}
                                    maxVal={itemStats.maxMonth}
                                    colorClass="bg-gradient-to-t from-blue-500 to-purple-400"
                                />
                            </div>
                        )}

                        {itemStats.totalLogs === 0 && (
                            <div className="text-center py-8 text-gray-400">
                                <div className="text-4xl mb-2">📭</div>
                                <p className="text-sm">No activity logged yet</p>
                            </div>
                        )}
                    </>)}
                </div>
            </div>
        </div>
    );
}
