import { useState } from 'react';
import HistoryLog from '../components/HistoryLog';
import AdminPanel from '../components/AdminPanel';
import Statistics from '../components/Statistics';
import PermissionsManager from '../components/PermissionsManager';

export default function AdminView({
    residents,
    items,
    logs,
    users,
    loading,
    isDemo,
    isDark,
    onAddResident,
    onUpdateResident,
    onRemoveResident,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
    onRestock,
    onDeleteLog,
    onUpdateLog,
    customIcons,
    onAddCustomIcon,
    onUpdateCustomIcon,
    onRemoveCustomIcon,
    customIconsMap,
    tags,
    tagsMap,
    tagColors,
    onAddTag,
    onUpdateTag,
    onRemoveTag,
    getTagStyles,
    user,
    isSuperAdmin,
    onUpdateUserRole
}) {
    const [activeTab, setActiveTab] = useState('history');

    const tabs = [
        { id: 'stats', label: 'Stats', icon: '📊' },
        { id: 'history', label: 'History', icon: '📋' },
        { id: 'manage', label: 'Manage', icon: '⚙️' },
    ];

    if (isSuperAdmin) {
        tabs.push({ id: 'permissions', label: 'Access', icon: '🛡️' });
    }

    // Role-based access control for tabs - Check inventory permissions!
    const canAccessManage = permissions?.isOwner || permissions?.canEdit || isSuperAdmin || (user && user.role === 'admin');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'stats' && (
                <Statistics logs={logs} items={items} residents={residents} />
            )}

            {activeTab === 'history' && (
                <HistoryLog
                    logs={logs}
                    loading={loading}
                    onDeleteLog={onDeleteLog}
                    onUpdateLog={onUpdateLog}
                    residents={residents}
                    items={items}
                />
            )}

            {activeTab === 'manage' && (
                canAccessManage ? (
                    <AdminPanel
                        residents={residents}
                        items={items}
                        isDemo={isDemo}
                        isDark={isDark}
                        onAddResident={onAddResident}
                        onUpdateResident={onUpdateResident}
                        onRemoveResident={onRemoveResident}
                        onAddItem={onAddItem}
                        onUpdateItem={onUpdateItem}
                        onRemoveItem={onRemoveItem}
                        onRestock={onRestock}
                        customIcons={customIcons}
                        onAddCustomIcon={onAddCustomIcon}
                        onUpdateCustomIcon={onUpdateCustomIcon}
                        onRemoveCustomIcon={onRemoveCustomIcon}
                        customIconsMap={customIconsMap}
                        tags={tags}
                        tagsMap={tagsMap}
                        tagColors={tagColors}
                        onAddTag={onAddTag}
                        onUpdateTag={onUpdateTag}
                        onRemoveTag={onRemoveTag}
                        getTagStyles={getTagStyles}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="text-6xl mb-4">🔒</div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Restricted Access</h3>
                        <p className="text-gray-500 max-w-xs">Only approved administrators can manage residents and items.</p>
                    </div>
                )
            )}

            {activeTab === 'permissions' && isSuperAdmin && (
                <PermissionsManager
                    users={users}
                    onUpdateUserRole={onUpdateUserRole}
                    isDemo={isDemo}
                />
            )}
        </div>
    );
}
