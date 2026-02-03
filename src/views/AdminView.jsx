import { useState } from 'react';
import HistoryLog from '../components/HistoryLog';
import AuditLog from '../components/AuditLog';
import AdminPanel from '../components/AdminPanel';
import Statistics from '../components/Statistics';
import PermissionsManager from '../components/PermissionsManager';
import { useInventory } from '../context/InventoryContext';


export default function AdminView({
    residents,
    items,
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
    onRestock,
    // Resident actions
    onAddResident,
    onUpdateResident,
    onDeleteResident,
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
    const [activeTab, setActiveTab] = useState('usage');

    const tabs = [
        { id: 'stats', label: 'Stats', icon: '📊' },
        { id: 'usage', label: 'Usage', icon: '📋' },
        { id: 'audit', label: 'Audit', icon: '🛡️' },
        { id: 'manage', label: 'Manage', icon: '⚙️' },
    ];

    if (isSuperAdmin) {
        tabs.push({ id: 'permissions', label: 'Access', icon: '🔑' });
    }

    // Role-based access control for tabs - Check inventory permissions!
    // permissions.isOwner or permissions.canEdit allows access to Manage
    const canAccessManage = permissions?.isOwner || permissions?.canEdit || isSuperAdmin || (user && user.role === 'admin');

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm scale-[1.02]'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
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

            {activeTab === 'manage' && (
                canAccessManage ? (
                    <AdminPanel
                        residents={residents}
                        items={items}
                        logs={logs}
                        isDemo={isDemo}
                        isDark={isDark}
                        // Harmonize props to match AdminPanel expectations
                        onAddResident={onAddResident}
                        onUpdateResident={onUpdateResident}
                        onRemoveResident={onDeleteResident}
                        onAddItem={onAddItem}
                        onUpdateItem={onUpdateItem}
                        onRemoveItem={onDeleteItem}
                        onRestock={onRestock}
                        // Custom icon props
                        customIcons={customIcons}
                        onAddCustomIcon={onAddIcon}
                        onUpdateCustomIcon={onUpdateIcon}
                        onRemoveCustomIcon={onDeleteIcon}
                        customIconsMap={customIconsMap}
                        // Tag props
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
                        <p className="text-gray-500 max-w-xs px-6 mb-8">
                            Only the inventory owner or authorized editors can manage residents and items.
                        </p>

                        {role === 'view' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <p className="text-sm font-medium text-primary-500">
                                    Current Role: Observer (View Only)
                                </p>
                                <button
                                    onClick={() => setShowRequestModal(true)}
                                    className="btn btn-primary px-8 py-3 shadow-xl shadow-primary-500/20"
                                >
                                    Request Editor Access
                                </button>

                                <AccessRequestModal
                                    isOpen={showRequestModal}
                                    onClose={() => setShowRequestModal(false)}
                                    currentUser={user}
                                    currentInventoryId={permissions?.id}
                                    currentInventoryName={permissions?.name}
                                    onSuccess={() => {
                                        alert('✅ Request for Editor access sent to the owner!');
                                    }}
                                />
                            </div>
                        )}
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
