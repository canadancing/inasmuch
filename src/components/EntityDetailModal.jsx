import { useMemo, useState } from 'react';
import RoleBadge from './RoleBadge';

export default function EntityDetailModal({ isOpen, onClose, entity, logs = [], onUpdate, onDelete, tags = [], viewMode = 'analytics', onOpenLogModal, onOpenRestockModal }) {
    // Early return MUST come before any hooks to avoid "rendered more hooks" error
    if (!isOpen || !entity) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        room: '',
        displayName: '',
        tags: [],
        notes: '',
        primaryRole: ''
    });

    // Initialize form data when entering edit mode
    const startEditing = () => {
        const isLocation = entity.entityType === 'location';
        setFormData({
            firstName: entity.firstName || '',
            lastName: entity.lastName || '',
            phone: entity.phone || '',
            room: entity.room || '',
            displayName: entity.displayName || entity.name || '',
            tags: entity.tags || [],
            notes: entity.notes || '',
            primaryRole: entity.primaryRole || ''
        });
        setIsEditing(true);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTagToggle = (tag) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter(t => t !== tag)
                : [...prev.tags, tag]
        }));
    };

    const handleSave = async () => {
        const updates = {
            ...formData,
            tags: formData.tags
        };
        await onUpdate(entity.id, updates);
        setIsEditing(false);
        onClose(); // Close modal to show updated card
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormData({
            firstName: '',
            lastName: '',
            phone: '',
            room: '',
            displayName: '',
            tags: [],
            notes: '',
            primaryRole: ''
        });
    };

    const handleDelete = async () => {
        await onDelete(entity.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    const { name, type, totalUses, activityLevel, lastActive, avatar } = entity;

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
                                {entity.tags && entity.tags.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                        {entity.tags.map(tag => (
                                            <span key={typeof tag === 'string' ? tag : tag.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                {typeof tag === 'string' ? tag : tag.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing && (
                                <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl mr-2">
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onOpenLogModal?.(entity);
                                        }}
                                        title="Log Consumption"
                                        className="p-2 rounded-lg text-primary-600 dark:text-primary-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onOpenRestockModal?.(entity);
                                        }}
                                        title="Restock"
                                        className="p-2 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                    </button>
                                    <div className="w-[1px] h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                                    {onUpdate && (
                                        <button
                                            onClick={startEditing}
                                            title="Edit"
                                            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            title="Delete"
                                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
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
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isEditing ? (
                        /* Edit Mode */
                        <div className="space-y-4">
                            {entity.entityType === 'person' ? (
                                /* Person Form */
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => handleChange('firstName', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => handleChange('lastName', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                📞 Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => handleChange('phone', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                📍 Room *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.room}
                                                onChange={(e) => handleChange('room', e.target.value)}
                                                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Location Form */
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Location Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.displayName}
                                        onChange={(e) => handleChange('displayName', e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                    />
                                </div>
                            )}

                            {/* Tags */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    🏷️ Tags
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {tags.map(tag => (
                                        <button
                                            key={tag.name}
                                            onClick={() => handleTagToggle(tag.name)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${formData.tags.includes(tag.name)
                                                ? 'bg-primary-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                                }`}
                                            style={formData.tags.includes(tag.name) ? {
                                                backgroundColor: tag.color,
                                                color: 'white'
                                            } : {}}
                                        >
                                            {tag.emoji} {tag.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    📝 Notes
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => handleChange('notes', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500"
                                    rows={3}
                                />
                            </div>

                            {/* Save/Cancel Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCancelEdit}
                                    className="flex-1 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 px-6 py-3 rounded-xl bg-primary-500 text-white font-bold hover:bg-primary-600 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* View Mode - Dashboard Redesign */
                        <div className="space-y-6">
                            {/* Dashboard Metrics Row */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100/50 dark:border-blue-800/30">
                                    <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <span>📅</span> Arrived
                                    </div>
                                    <div className="text-lg font-black text-gray-900 dark:text-white truncate" title={formatDate(entity.createdAt)}>
                                        {entity.createdAt ? new Date(entity.createdAt?.toDate ? entity.createdAt.toDate() : entity.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100/50 dark:border-emerald-800/30">
                                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <span>⏳</span> Duration
                                    </div>
                                    <div className="text-lg font-black text-gray-900 dark:text-white flex items-baseline gap-1">
                                        {(() => {
                                            const created = entity.createdAt?.toDate ? entity.createdAt.toDate() : (entity.createdAt ? new Date(entity.createdAt) : null);
                                            if (!created) return 'N/A';
                                            const days = Math.floor((new Date() - created) / (1000 * 60 * 60 * 24));
                                            return <>{Math.max(0, days)}<span className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70">days</span></>;
                                        })()}
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-100/50 dark:border-purple-800/30">
                                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <span>📦</span> Consumed
                                    </div>
                                    <div className="text-lg font-black text-gray-900 dark:text-white flex items-baseline gap-1">
                                        {totalUses || 0}<span className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70">items</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top Items Breakdown */}
                            {stats.topItems.length > 0 && (
                                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700/50 shadow-sm">
                                    <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                                        🏆 Most Consumed Items
                                    </h3>
                                    <div className="space-y-4">
                                        {stats.topItems.map((item, index) => {
                                            // Calculate relative width based on the #1 item to make the chart look fuller
                                            const maxCount = stats.topItems[0].count;
                                            const relativePercent = (item.count / maxCount) * 100;

                                            return (
                                                <div key={item.name} className="relative group">
                                                    <div className="flex items-center justify-between mb-1.5 z-10 relative">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold text-gray-400 w-4">{index + 1}.</span>
                                                            <span className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors">{item.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="font-black text-gray-700 dark:text-gray-300">{item.count}</span>
                                                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">{item.percentage}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${index === 0 ? 'from-primary-400 to-primary-600' : 'from-gray-300 to-gray-400 dark:from-gray-500 dark:to-gray-600'}`}
                                                            style={{ width: `${relativePercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Recent Activity Timeline */}
                            {stats.recentActivity.length > 0 && (
                                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700/50 shadow-sm">
                                    <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6 flex items-center gap-2">
                                        ⏱️ Activity Timeline
                                    </h3>
                                    <div className="relative pl-3 space-y-6">
                                        {/* Timeline Line */}
                                        <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100 dark:bg-gray-700" />

                                        {stats.recentActivity.map((log, i) => (
                                            <div key={log.id} className="relative pl-8 animate-in slide-in-from-left-4 fade-in duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                                                {/* Timeline Dot */}
                                                <div className={`absolute left-[-5px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-gray-800 ${log.action === 'used' ? 'bg-red-400 dark:bg-red-500' : 'bg-emerald-400 dark:bg-emerald-500'}`} />

                                                <div className="flex flex-col gap-1">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                        {log.action === 'used' ? 'Consumed' : 'Restocked'} <span className="font-extrabold">{log.quantity}×</span> {log.itemName || 'Unknown'}
                                                    </p>
                                                    <span className="text-xs font-medium text-gray-400">
                                                        {formatDate(log.date)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {stats.recentActivity.length === 0 && (
                                <div className="text-center py-12 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <div className="text-5xl mb-4 opacity-40">📭</div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Activity Yet</h4>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">When items are consumed or restocked, the history will appear here.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md mx-4 shadow-2xl">
                            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                                Confirm Delete
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to delete <strong>{entity.name}</strong>? This action will mark them as deleted but preserve their history.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

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
