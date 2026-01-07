import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function CollaboratorList({ user }) {
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const inventoriesRef = collection(db, 'inventories');
        const usersRef = collection(db, 'users');
        const requestsRef = collection(db, 'accessRequests');

        // 1. Fetch Guest Collaborators (People I have invited)
        const q1 = query(inventoriesRef, where('ownerId', '==', user.uid));

        // 2. Fetch Host Collaborators (People who have invited me / I have access to)
        const q2 = query(requestsRef, where('requesterId', '==', user.uid), where('status', '==', 'approved'));

        const unsub1 = onSnapshot(q1, async (snapshot) => {
            try {
                const guestList = [];
                const processedUids = new Set();

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    const collabMap = data.collaborators || {};

                    for (const [collabUid, roleInfo] of Object.entries(collabMap)) {
                        if (processedUids.has(collabUid)) continue;

                        const userDoc = await getDoc(doc(db, 'users', collabUid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            guestList.push({
                                uid: collabUid,
                                displayName: userData.displayName,
                                photoURL: userData.photoURL,
                                role: typeof roleInfo === 'string' ? roleInfo : roleInfo.permission,
                                type: 'guest',
                                inventoryId: docSnap.id,
                                inventoryName: data.name
                            });
                            processedUids.add(collabUid);
                        }
                    }
                }

                setCollaborators(prev => {
                    const hosts = prev.filter(c => c.type === 'host');
                    return [...hosts, ...guestList];
                });
            } catch (error) {
                console.error("Error in Guest listener:", error);
            } finally {
                setLoading(false);
            }
        });

        const unsub2 = onSnapshot(q2, async (snapshot) => {
            try {
                const hostList = [];
                for (const docSnap of snapshot.docs) {
                    const requestData = docSnap.data();
                    // Fetch the owner of the inventory (the target user of the request)
                    const ownerQuery = query(usersRef, where('uid', '==', requestData.targetUserId));
                    const ownerSnapshot = await getDocs(ownerQuery);

                    if (!ownerSnapshot.empty) {
                        const ownerData = ownerSnapshot.docs[0].data();
                        hostList.push({
                            uid: ownerData.uid,
                            displayName: ownerData.displayName,
                            photoURL: ownerData.photoURL,
                            role: requestData.permission,
                            type: 'host',
                            inventoryName: requestData.targetUserName + "'s Inventory"
                        });
                    }
                }

                setCollaborators(prev => {
                    const guests = prev.filter(c => c.type === 'guest');
                    return [...guests, ...hostList];
                });
            } catch (error) {
                console.error("Error in Host listener:", error);
            }
        });

        return () => {
            unsub1();
            unsub2();
        };
    }, [user]);

    const handleUpdateRole = async (collab, newRole) => {
        try {
            const inventoryRef = doc(db, 'inventories', collab.inventoryId);
            await updateDoc(inventoryRef, {
                [`collaborators.${collab.uid}.permission`]: newRole
            });
            alert(`Updated ${collab.displayName}'s access to ${newRole}`);
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update access");
        }
    };

    const handleRemoveCollab = async (collab) => {
        if (!confirm(`Remove ${collab.displayName}'s access to your inventory?`)) return;
        try {
            const inventoryRef = doc(db, 'inventories', collab.inventoryId);
            await updateDoc(inventoryRef, {
                [`collaborators.${collab.uid}`]: deleteField()
            });
            alert(`Removed ${collab.displayName}'s access`);
        } catch (error) {
            console.error("Error removing collaborator:", error);
            alert("Failed to remove collaborator");
        }
    };

    if (loading) return <div className="animate-pulse h-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl"></div>;

    if (collaborators.length === 0) {
        return (
            <div className="text-center py-4 opacity-40 text-xs font-medium">
                No active collaborators found
            </div>
        );
    }

    return (
        <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-1 ml-1">
                Active Collaborators
            </h4>
            <div className="space-y-1">
                {collaborators.map((collab) => (
                    <div
                        key={`${collab.uid}-${collab.type}`}
                        className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                    >
                        <img
                            src={collab.photoURL}
                            alt=""
                            className="w-7 h-7 rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {collab.displayName}
                            </p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">
                                {collab.type === 'guest' ? '👤 Guest' : '🏠 Host'} • {collab.role === 'edit' ? '✏️ Edit' : '👁️ View'}
                            </p>
                        </div>

                        {collab.type === 'guest' && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleUpdateRole(collab, collab.role === 'edit' ? 'view' : 'edit')}
                                    title={collab.role === 'edit' ? 'Downgrade to View' : 'Upgrade to Edit'}
                                    className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-500 transition-colors"
                                >
                                    {collab.role === 'edit' ? (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    ) : (
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                        </svg>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleRemoveCollab(collab)}
                                    title="Remove Access"
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
