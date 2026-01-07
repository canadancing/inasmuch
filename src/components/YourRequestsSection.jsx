// Component showing user's sent requests and their status
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function YourRequestsSection({ user }) {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        if (!user) {
            setRequests([]);
            return;
        }

        // Listen to requests where user is the requester
        const requestsRef = collection(db, 'accessRequests');
        const q = query(requestsRef, where('requesterId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Sort by most recent first
            requestsList.sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });
            setRequests(requestsList);
        });

        return () => unsubscribe();
    }, [user]);

    if (!user || requests.length === 0) {
        return null;
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return { color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400', label: '⏳ Pending', icon: '⏳' };
            case 'approved':
                return { color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400', label: '✅ Approved', icon: '✅' };
            case 'rejected':
                return { color: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400', label: '❌ Rejected', icon: '❌' };
            default:
                return { color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400', label: status, icon: '·' };
        }
    };

    return (
        <div className="card p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Your Requests
            </h3>

            <div className="space-y-3">
                {requests.map((request) => {
                    const badge = getStatusBadge(request.status);
                    return (
                        <div
                            key={request.id}
                            className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="font-semibold text-gray-900 dark:text-white">
                                        {request.targetUserName}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {request.permission === 'edit' ? '✏️ Edit' : '👁️ View'} access
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                                    {badge.label}
                                </span>
                            </div>

                            {request.message && (
                                <div className="mb-2 p-2 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-400 italic">
                                    "{request.message}"
                                </div>
                            )}

                            <div className="text-xs text-gray-500 dark:text-gray-500">
                                Sent {new Date(request.createdAt?.seconds * 1000).toLocaleDateString()}
                                {request.respondedAt && (
                                    <> · Responded {new Date(request.respondedAt.seconds * 1000).toLocaleDateString()}</>
                                )}
                            </div>

                            {request.status === 'approved' && (
                                <div className="mt-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/10 text-sm text-green-600 dark:text-green-400">
                                    🎉 You can now access this inventory!
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
