import { useState } from 'react';

export default function PermissionsManager({ users, onUpdateUserRole, isDemo }) {
    const [isUpdating, setIsUpdating] = useState(null);

    const handleRoleChange = async (uid, newRole) => {
        setIsUpdating(uid);
        try {
            await onUpdateUserRole(uid, newRole);
        } finally {
            setIsUpdating(null);
        }
    };

    const pendingRequests = users.filter(u => u.requestPending && u.role === 'user');
    const existingAdmins = users.filter(u => u.role === 'admin');
    const regularUsers = users.filter(u => u.role === 'user' && !u.requestPending);

    const UserRow = ({ user, showActions = true }) => (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-primary-100" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">👤</div>
                )}
                <div>
                    <h4 className="font-bold text-gray-900 dark:text-white leading-tight">
                        {user.displayName || 'Anonymous'}
                    </h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-lg ${user.role === 'super-admin'
                        ? 'bg-amber-100 text-amber-600'
                        : user.role === 'admin'
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-gray-100 text-gray-400'
                    }`}>
                    {user.role}
                </span>

                {showActions && user.role !== 'super-admin' && (
                    <div className="flex gap-1 ml-2">
                        {user.role === 'user' ? (
                            <button
                                onClick={() => handleRoleChange(user.id, 'admin')}
                                disabled={isUpdating === user.id}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-primary-500 text-white rounded-lg active:scale-95 transition-all disabled:opacity-50"
                            >
                                {user.requestPending ? 'Approve' : 'Make Admin'}
                            </button>
                        ) : (
                            <button
                                onClick={() => handleRoleChange(user.id, 'user')}
                                disabled={isUpdating === user.id}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg active:scale-95 transition-all disabled:opacity-50"
                            >
                                Revoke
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">🔔</span>
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary-500">Pending Admin Requests</h3>
                    </div>
                    <div className="space-y-3">
                        {pendingRequests.map(user => (
                            <UserRow key={user.id} user={user} />
                        ))}
                    </div>
                </section>
            )}

            {/* Existing Admins */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🛡️</span>
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Approved Admins</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {users.filter(u => u.role === 'super-admin').map(user => (
                        <UserRow key={user.id} user={user} showActions={false} />
                    ))}
                    {existingAdmins.map(user => (
                        <UserRow key={user.id} user={user} />
                    ))}
                </div>
            </section>

            {/* Regular Users */}
            {regularUsers.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">👥</span>
                        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Recent Users</h3>
                    </div>
                    <div className="space-y-3">
                        {regularUsers.map(user => (
                            <UserRow key={user.id} user={user} />
                        ))}
                    </div>
                </section>
            )}

            {users.length === 0 && !isDemo && (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No other users found yet.</p>
                </div>
            )}
        </div>
    );
}
