// Super Admin Dashboard View
import { useState } from 'react';
import { useSuperAdmin } from '../hooks/useSuperAdmin';

export default function SuperAdminView({ user }) {
    const {
        hasAccess,
        users,
        inventories,
        metrics,
        loading,
        error,
        toggleUserSuspension,
        deleteUser
    } = useSuperAdmin(user);

    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Access denied
    if (!hasAccess) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Access Denied
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        You don't have super admin privileges.
                    </p>
                </div>
            </div>
        );
    }

    // Filter users by search
    const filteredUsers = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.userId?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter inventories by search
    const filteredInventories = inventories.filter(inv =>
        inv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSuspend = async (userId, currentStatus) => {
        setActionLoading(true);
        await toggleUserSuspension(userId, currentStatus);
        setActionLoading(false);
    };

    const handleDelete = async (userId) => {
        if (!confirm('⚠️ Are you sure you want to delete this user? This action cannot be undone.')) return;
        setActionLoading(true);
        await deleteUser(userId);
        setActionLoading(false);
        setSelectedUser(null);
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: '📊' },
        { id: 'users', label: 'Users', icon: '👥' },
        { id: 'inventories', label: 'Inventories', icon: '📦' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="text-3xl">⚡</span> Super Admin
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        System-wide management dashboard
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold">
                        {user?.email}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
                    Error: {error}
                </div>
            ) : (
                <>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <MetricCard
                                    label="Total Users"
                                    value={metrics.totalUsers}
                                    icon="👥"
                                    color="blue"
                                />
                                <MetricCard
                                    label="Inventories"
                                    value={metrics.totalInventories}
                                    icon="📦"
                                    color="emerald"
                                />
                                <MetricCard
                                    label="Total Items"
                                    value={metrics.totalItems}
                                    icon="📋"
                                    color="amber"
                                />
                                <MetricCard
                                    label="Active Today"
                                    value={metrics.activeToday}
                                    icon="🟢"
                                    color="green"
                                />
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Recent Users */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span>👤</span> Recent Users
                                    </h3>
                                    <div className="space-y-2">
                                        {users.slice(0, 5).map(u => (
                                            <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <img src={u.photoURL || '/default-avatar.png'} className="w-8 h-8 rounded-full" alt="" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                        {u.displayName}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Top Inventories */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <span>📦</span> Top Inventories
                                    </h3>
                                    <div className="space-y-2">
                                        {inventories.sort((a, b) => b.itemsCount - a.itemsCount).slice(0, 5).map(inv => (
                                            <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <div className="min-w-0">
                                                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                        {inv.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{inv.ownerName}</div>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                                    {inv.itemsCount} items
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search users by name, email, or ID..."
                                    className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            </div>

                            {/* Users Table */}
                            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">User</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">User ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {filteredUsers.map(u => (
                                            <tr key={u.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <img src={u.photoURL || '/default-avatar.png'} className="w-10 h-10 rounded-full" alt="" />
                                                        <div>
                                                            <div className="font-semibold text-gray-900 dark:text-white">
                                                                {u.displayName}
                                                            </div>
                                                            <div className="text-xs text-gray-500">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-sm text-gray-600 dark:text-gray-400">
                                                    {u.userId || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {u.suspended ? (
                                                        <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                                                            Suspended
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-semibold">
                                                            Active
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleSuspend(u.id, u.suspended)}
                                                            disabled={actionLoading}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${u.suspended
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200'
                                                                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200'
                                                                }`}
                                                        >
                                                            {u.suspended ? 'Unsuspend' : 'Suspend'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(u.id)}
                                                            disabled={actionLoading}
                                                            className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 text-xs font-semibold transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                Showing {filteredUsers.length} of {users.length} users
                            </div>
                        </div>
                    )}

                    {/* Inventories Tab */}
                    {activeTab === 'inventories' && (
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search inventories by name or owner..."
                                    className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                            </div>

                            {/* Inventories Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredInventories.map(inv => (
                                    <div
                                        key={inv.id}
                                        className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">{inv.name}</h3>
                                                <p className="text-xs text-gray-500">{inv.ownerEmail}</p>
                                            </div>
                                            <span className="px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold">
                                                {inv.itemsCount} items
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <span>👤 {inv.ownerName}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                Showing {filteredInventories.length} of {inventories.length} inventories
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Metric Card Component
function MetricCard({ label, value, icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
        amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    };

    return (
        <div className={`p-4 rounded-2xl border ${colorClasses[color]}`}>
            <div className="flex items-center gap-3">
                <span className="text-3xl">{icon}</span>
                <div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</div>
                </div>
            </div>
        </div>
    );
}
