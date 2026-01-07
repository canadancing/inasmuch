// Component showing user's sent requests and their status
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import CollapsibleActivitySection from './CollapsibleActivitySection';

export default function YourRequestsSection({ user }) {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        if (!user) {
            setRequests([]);
            return;
        }

        const requestsRef = collection(db, 'accessRequests');
        const q = query(requestsRef, where('requesterId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            requestsList.sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });
            setRequests(requestsList);
        });

        return () => unsubscribe();
    }, [user]);

    const deleteRequest = async (id, e) => {
        e.stopPropagation();
        try {
            await deleteDoc(doc(db, 'accessRequests', id));
        } catch (error) {
            console.error('Error deleting request:', error);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
            approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
            rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
            revoked: { label: 'Revoked', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
        };
        return badges[status] || badges.pending;
    };

    const renderRequest = (req) => {
        const statusInfo = getStatusBadge(req.status);
        return (
            <div
                key={req.id}
                className="group p-4 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        {req.targetUserPhoto ? (
                            <img src={req.targetUserPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">👤</div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                            <button
                                onClick={(e) => deleteRequest(req.id, e)}
                                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                title="Delete request"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {req.targetUserName || 'Unknown User'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {req.permission === 'edit' ? '✏️ Edit' : '👁️ View'}
                            </span>
                            {req.message && (
                                <>
                                    <span className="text-xs text-gray-300">•</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {req.message}
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                            {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleString() : 'Just now'}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!user) return null;

    return (
        <CollapsibleActivitySection
            title="Your Requests"
            icon="📤"
            items={requests}
            renderItem={renderRequest}
            searchPlaceholder="Search requests..."
            searchFields={['targetUserName', 'permission', 'status', 'message']}
            actions={[]}
            badge={requests.filter(r => r.status === 'pending').length || null}
            defaultExpanded={false}
            emptyMessage="No sent requests"
            emptyIcon="📭"
        />
    );
}
