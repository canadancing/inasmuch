// Component to display and manage system notifications on the Account page
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function NotificationsSection({ user }) {
    const [notifications, setNotifications] = useState([]);
    const [isClearing, setIsClearing] = useState(false);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const notificationsRef = collection(db, 'notifications');
        // Remove orderBy to avoid composite index requirement
        const q = query(
            notificationsRef,
            where('targetUid', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort in memory instead
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
            const { deleteDoc } = await import('firebase/firestore');
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
            console.error('Error clearing notifications:', error);
        } finally {
            setIsClearing(false);
        }
    };

    if (notifications.length === 0) return null;

    return (
        <div className="card p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🔔</span> Recent Activity
                </h3>
                {notifications.some(n => !n.read) && (
                    <button
                        onClick={markAllAsRead}
                        disabled={isClearing}
                        className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors uppercase tracking-widest disabled:opacity-50"
                    >
                        {isClearing ? 'Marking...' : 'Mark all as Read'}
                    </button>
                )}
            </div>

            <div className="space-y-3">
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
        </div>
    );
}
