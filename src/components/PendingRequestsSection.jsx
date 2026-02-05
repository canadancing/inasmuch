// Component for managing access requests (for inventory owners)
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import UserAvatar from './UserAvatar';

export default function PendingRequestsSection({ user }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInventorySelector, setShowInventorySelector] = useState(null); // request ID to show selector for
    const [myInventories, setMyInventories] = useState([]);

    useEffect(() => {
        if (!user) {
            setRequests([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Fetch my inventories once
        const fetchInventories = async () => {
            const inventoriesRef = collection(db, 'inventories');
            const q = query(inventoriesRef, where('ownerId', '==', user.uid));
            const snapshot = await getDocs(q);
            setMyInventories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchInventories();

        // Listen to pending requests where user is the target (inventory owner)
        const requestsRef = collection(db, 'accessRequests');
        const q = query(
            requestsRef,
            where('targetUserId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRequests(requestsList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleApproveClick = (request) => {
        if (myInventories.length === 0) {
            alert('No inventory found. Please create an inventory first.');
            return;
        }

        if (myInventories.length === 1) {
            // Only one inventory, auto-select it
            processApproval(request, myInventories[0].id);
        } else {
            // Multiple inventories, show selector
            setShowInventorySelector(request.id);
        }
    };

    const processApproval = async (request, inventoryId) => {
        try {
            const { arrayUnion, writeBatch, doc: firestoreDoc } = await import('firebase/firestore');
            const batch = writeBatch(db);

            // 1. Update request status
            const requestRef = firestoreDoc(db, 'accessRequests', request.id);
            batch.update(requestRef, {
                status: 'approved',
                respondedAt: serverTimestamp(),
                inventoryId: inventoryId
            });

            // 2. Add collaborator to inventory
            const inventoryRef = firestoreDoc(db, 'inventories', inventoryId);
            batch.update(inventoryRef, {
                [`collaborators.${request.requesterId}`]: {
                    permission: request.permission,
                    grantedAt: serverTimestamp(),
                    grantedBy: user.uid
                },
                collaboratorUids: arrayUnion(request.requesterId)
            });

            // 3. Create notification for requester
            const notificationsRef = collection(db, 'notifications');
            const requesterNotifRef = firestoreDoc(notificationsRef);
            batch.set(requesterNotifRef, {
                targetUid: request.requesterId,
                type: 'access_granted',
                message: `${user.displayName} approved your request to access their inventory.`,
                read: false,
                createdAt: serverTimestamp()
            });

            // 4. Create notification for owner (activity log)
            const ownerNotifRef = firestoreDoc(notificationsRef);
            batch.set(ownerNotifRef, {
                targetUid: user.uid,
                type: 'request_approved',
                message: `You approved ${request.requesterName}'s request for ${request.permission} access.`,
                read: true,
                createdAt: serverTimestamp()
            });

            await batch.commit();

            setShowInventorySelector(null);
            alert(`✅ Granted ${request.permission} access to ${request.requesterName}!`);
        } catch (error) {
            console.error('Error approving request:', error);
            alert('Failed to approve request: ' + error.message);
        }
    };

    const handleReject = async (request) => {
        try {
            await updateDoc(doc(db, 'accessRequests', request.id), {
                status: 'rejected',
                respondedAt: serverTimestamp()
            });
            alert(`❌ Rejected request from ${request.requesterName}`);
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Failed to reject request');
        }
    };

    if (!user || requests.length === 0) {
        return null;
    }

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
                    Pending Requests ({requests.length})
                </h3>
            </div>

            <div className="space-y-3">
                {requests.map((request) => (
                    <div
                        key={request.id}
                        className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <UserAvatar user={{
                                photoURL: request.requesterPhoto,
                                displayName: request.requesterName,
                                uid: request.requesterId
                            }} size="md" />

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                        {request.requesterName}
                                    </div>
                                    <div className="text-[10px] font-mono text-gray-400">
                                        {new Date(request.createdAt?.seconds * 1000).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {request.requesterEmail}
                                </div>
                                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                    <span className="text-xs">
                                        {request.permission === 'view' ? '👁️' : '✏️'}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                                        {request.permission === 'view' ? 'View Only' : 'Edit Access'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {request.message && (
                            <div className="mb-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                                <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                    "{request.message}"
                                </p>
                            </div>
                        )}

                        {showInventorySelector === request.id ? (
                            <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-primary-200 dark:border-primary-800 animate-fade-in">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2">
                                    Select Inventory to Share:
                                </p>
                                <div className="space-y-1">
                                    {myInventories.map(inv => (
                                        <button
                                            key={inv.id}
                                            onClick={() => processApproval(request, inv.id)}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                                        >
                                            <span>📦</span>
                                            {inv.name}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowInventorySelector(null)}
                                        className="w-full text-center mt-2 text-[10px] font-bold text-red-400 hover:text-red-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleReject(request)}
                                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApproveClick(request)}
                                    className="flex-1 px-4 py-2 rounded-xl bg-primary-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20"
                                >
                                    Approve
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
