// Component for managing access requests (for inventory owners)
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function PendingRequestsSection({ user }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setRequests([]);
            setLoading(false);
            return;
        }

        setLoading(true);

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

    const handleApprove = async (request) => {
        try {
            // Find the user's owned inventories
            const inventoriesRef = collection(db, 'inventories');
            const q = query(inventoriesRef, where('ownerId', '==', user.uid));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                alert('No inventory found. Please create an inventory first.');
                return;
            }

            // Use the first inventory (or could show a picker if multiple)
            const inventoryToShare = snapshot.docs[0];
            const inventoryId = inventoryToShare.id;

            // Update request status
            await updateDoc(doc(db, 'accessRequests', request.id), {
                status: 'approved',
                respondedAt: serverTimestamp(),
                inventoryId: inventoryId  // Store which inventory was shared
            });

            // Add collaborator to inventory
            const inventoryRef = doc(db, 'inventories', inventoryId);
            await updateDoc(inventoryRef, {
                [`collaborators.${request.requesterId}`]: {
                    permission: request.permission,
                    grantedAt: serverTimestamp(),
                    grantedBy: user.uid
                }
            });

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
        <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Pending Requests
                </h3>
                <span className="px-3 py-1 rounded-full bg-primary-500 text-white text-xs font-bold">
                    {requests.length}
                </span>
            </div>

            <div className="space-y-3">
                {requests.map((request) => (
                    <div
                        key={request.id}
                        className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <img
                                src={request.requesterPhoto}
                                alt={request.requesterName}
                                className="w-12 h-12 rounded-xl"
                            />
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    {request.requesterName}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {request.requesterEmail}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-2">
                                    <span>
                                        {request.permission === 'view' ? '👁️ View' : '✏️ Edit'} access
                                    </span>
                                    {request.createdAt && (
                                        <span>
                                            · {new Date(request.createdAt.seconds * 1000).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {request.message && (
                            <div className="mb-3 p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                    "{request.message}"
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleApprove(request)}
                                className="flex-1 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors"
                            >
                                ✓ Approve
                            </button>
                            <button
                                onClick={() => handleReject(request)}
                                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                            >
                                ✕ Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
