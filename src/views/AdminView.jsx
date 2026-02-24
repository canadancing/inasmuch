import { useState } from 'react';
import HistoryLog from '../components/HistoryLog';
import AuditLog from '../components/AuditLog';
import Statistics from '../components/Statistics';
import PermissionsManager from '../components/PermissionsManager';
import EntityStatsModal from '../components/EntityStatsModal';
import { useInventory } from '../context/InventoryContext';


export default function AdminView({
    residents,
    archivedResidents,
    items,
    archivedItems,
    logs,
    auditLogs,
    users,
    loading,
    isDemo,
    isDark,
    permissions,
    isSuperAdmin,
    user,
    role,
    // Item actions
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onRestoreItem,
    onRestock,
    // Resident actions
    onAddResident,
    onUpdateResident,
    onDeleteResident,
    onRestoreResident,
    // Log actions
    onDeleteLog,
    onUpdateLog,
    // Icon actions
    customIcons,
    onAddIcon,
    onUpdateIcon,
    onDeleteIcon,
    customIconsMap,
    // Tag actions
    tags,
    tagsMap,
    tagColors,
    onAddTag,
    onUpdateTag,
    onRemoveTag,
    getTagStyles,
    // Admin actions
    onRequestAdminAccess,
    onUpdateUserRole
}) {
    const { currentInventory } = useInventory();
    const [activeTab, setActiveTab] = useState('stats');
    const [archiveEntityType, setArchiveEntityType] = useState('items');
    const [statsEntity, setStatsEntity] = useState(null);
    const [statsEntityType, setStatsEntityType] = useState('item');

    const totalArchived = (archivedItems?.length || 0) + (archivedResidents?.length || 0);

    const tabs = [
        { id: 'stats', label: 'Stats', icon: '📊' },
        { id: 'usage', label: 'Usage', icon: '📋' },
        { id: 'audit', label: 'Audit', icon: '🛡️' },
        { id: 'archive', label: 'Archive', icon: '🗑️', badge: totalArchived > 0 ? totalArchived : null },
    ];

    if (isSuperAdmin) {
        tabs.push({ id: 'permissions', label: 'Access', icon: '🔑' });
    }

    const getEntityIcon = (entity) => {
        if (entity.entityType === 'location') return '📍';
        if (entity.entityType === 'person' || entity.firstName) return '👤';
        return '📦';
    };

    const getEntityLabel = (entity) => {
        if (entity.firstName || entity.lastName) {
            return `${entity.firstName || ''} ${entity.lastName || ''}`.trim();
        }
        return entity.displayName || entity.name || 'Unknown';
    };

    const formatDeletedDate = (entity) => {
        const raw = entity.deletedAt;
        if (!raw) return 'Unknown date';
        const d = raw?.toDate ? raw.toDate() : new Date(raw);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const ArchivedEntityCard = ({ entity, onRestore, onShowStats }) => (
        <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/60 flex items-center justify-between gap-3 group hover:border-emerald-300 dark:hover:border-emerald-700/70 hover:shadow-md transition-all duration-200 shadow-sm">
            <button
                onClick={() => onShowStats?.(entity)}
                className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition-opacity"
                title="View stats"
            >
                <div className="w-11 h-11 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl shadow-inner">
                    {entity.icon || getEntityIcon(entity)}
                </div>
                <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                        {getEntityLabel(entity)}
                        <span className="opacity-0 group-hover:opacity-60 transition-opacity text-xs">📊</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <span>🗓️</span> Deleted {formatDeletedDate(entity)}
                    </div>
                </div>
            </button>
            <button
                onClick={() => onRestore(entity.id)}
                className="shrink-0 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 font-semibold text-sm transition-all transform hover:scale-105 active:scale-95 border border-emerald-200 dark:border-emerald-800/50"
            >
                ↩ Restore
            </button>
        </div>
    );

    const EmptyArchive = ({ label }) => (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <span className="text-5xl mb-3 opacity-40">👻</span>
            <p className="font-semibold text-gray-500">No archived {label}</p>
            <p className="text-sm text-gray-400 mt-1">Deleted {label} will appear here</p>
        </div>
    );

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                {/* Tab Navigation */}
                <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm scale-[1.02]'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                            {tab.badge && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'stats' && (
                    <Statistics
                        logs={logs}
                        items={items}
                        residents={residents}
                        onRestock={onRestock}
                    />
                )}

                {activeTab === 'usage' && (
                    <HistoryLog
                        logs={logs}
                        loading={loading}
                        onDeleteLog={onDeleteLog}
                        onUpdateLog={onUpdateLog}
                        residents={residents}
                        items={items}
                    />
                )}

                {activeTab === 'audit' && (
                    <AuditLog
                        logs={auditLogs}
                        loading={loading}
                        currentInventory={currentInventory}
                    />
                )}

                {activeTab === 'permissions' && isSuperAdmin && (
                    <PermissionsManager
                        users={users}
                        onUpdateUserRole={onUpdateUserRole}
                        isDemo={isDemo}
                    />
                )}

                {activeTab === 'archive' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Archive Header Card */}
                        <div className="card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        🗑️ Archive
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Safely restore anything you&apos;ve deleted</p>
                                </div>
                                <div className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    {totalArchived} archived
                                </div>
                            </div>

                            {/* Sub-tab toggle */}
                            <div className="flex gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl">
                                <button
                                    onClick={() => setArchiveEntityType('items')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${archiveEntityType === 'items'
                                        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <span>📦</span>
                                    <span>Items</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${archiveEntityType === 'items' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                        {archivedItems?.length || 0}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setArchiveEntityType('people')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${archiveEntityType === 'people'
                                        ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <span>👤</span>
                                    <span>People & Locations</span>
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${archiveEntityType === 'people' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                        {archivedResidents?.length || 0}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Archive Entity List */}
                        <div className="space-y-2">
                            {archiveEntityType === 'items' && (
                                archivedItems?.length > 0
                                    ? archivedItems.map(item => (
                                        <ArchivedEntityCard
                                            key={item.id}
                                            entity={item}
                                            onRestore={onRestoreItem}
                                            onShowStats={(e) => { setStatsEntity(e); setStatsEntityType('item'); }}
                                        />
                                    ))
                                    : <EmptyArchive label="items" />
                            )}
                            {archiveEntityType === 'people' && (
                                archivedResidents?.length > 0
                                    ? archivedResidents.map(entity => (
                                        <ArchivedEntityCard
                                            key={entity.id}
                                            entity={entity}
                                            onRestore={onRestoreResident}
                                            onShowStats={(e) => { setStatsEntity(e); setStatsEntityType('person'); }}
                                        />
                                    ))
                                    : <EmptyArchive label="people or locations" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Entity Stats Modal for Archive */}
            <EntityStatsModal
                isOpen={!!statsEntity}
                onClose={() => setStatsEntity(null)}
                entity={statsEntity}
                entityType={statsEntityType}
                logs={logs}
                residents={residents}
                items={items}
            />
        </>
    );
}

