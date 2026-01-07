// Component to display and manage system notifications on the Account page
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function NotificationsSection({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [isClearing, setIsClearing] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, where('targetUid', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort in memory by date
            const sortedList = list.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
                return dateB - dateA;
            });
            setNotifications(sortedList);
        });

        return () => unsubscribe();
    }, [user]);

    const deleteNotification = async (id, e) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'notifications', id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user || notifications.length === 0) return;

        setIsClearing(true);
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                if (!n.read) {
                    const ref = doc(db, 'notifications', n.id);
                    batch.update(ref, { read: true });
                }
            });
            await batch.commit();
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setIsClearing(false);
        }
    };

    const clearAllNotifications = async () => {
        if (!confirm('Clear all activity? This cannot be undone.')) return;

        setIsClearing(true);
        try {
            const batch = writeBatch(db);
            notifications.forEach(n => {
                const ref = doc(db, 'notifications', n.id);
                batch.delete(ref);
            });
            await batch.commit();
        } catch (error) {
            console.error('Error clearing all:', error);
            alert('Failed to clear all activities');
        } finally {
            setIsClearing(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (notifications.length === 0) {
        return (
            <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                    <span>🔔</span> Recent Activity
                </h3>
                <div className="text-center py-8">
                    <div className="text-5xl mb-3 opacity-30">📭</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-6 animate-fade-in">
            {/* Header with toggle and actions */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 flex-1 group"
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>🔔</span> Recent Activity
                    </h3>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs font-black bg-red-500 text-white rounded-full">
                            {unreadCount}
                        </span>
                    )}
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            disabled={isClearing}
                            className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors disabled:opacity-50 px-3 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            title="Mark all as read"
                        >
                            ✓ All
                        </button>
                    )}
                    <button
                        onClick={clearAllNotifications}
                        disabled={isClearing}
                        className="text-xs font-bold text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50 px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Clear all activities"
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>

            {/* Collapsible content */}
            {isExpanded && (
                <div className="space-y-3 animate-fade-in">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className="group p-4 rounded-xl border transition-all hover:bg-white dark:hover:bg-gray-800/80 active:scale-[0.99] relative cursor-default"
                            onClick={() => !n.read && updateDoc(doc(db, 'notifications', n.id), { read: true })}
                        >
                            {/* Background for unread state */}
                            {!n.read && (
                                <div className="absolute inset-0 bg-primary-500/5 dark:bg-primary-500/10 rounded-xl pointer-events-none" />
                            )}

                            <div className="flex items-start gap-3 relative z-10">
                                <div className="text-xl mt-0.5">
                                    {n.type === 'access_revoked' ? '🚫' : '📝'}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${n.type === 'access_revoked'
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                                            }`}>
                                            {n.type.replace('_', ' ')}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            {!n.read && (
                                                <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                                            )}
                                            <button
                                                onClick={(e) => deleteNotification(n.id, e)}
                                                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                                title="Dismiss activity"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                                        {n.message}
                                    </p>
                                    <div className="mt-2 text-[10px] text-gray-500 font-medium">
                                        {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleString() : 'Just now'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
