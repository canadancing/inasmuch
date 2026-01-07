import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, deleteField, serverTimestamp, writeBatch } from 'firebase/firestore';
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
            const batch = writeBatch(db);

            // 1. Update inventory
            batch.update(inventoryRef, {
                [`collaborators.${collab.uid}.permission`]: newRole
            });

            // 2. Add notification for the guest
            const notificationsRef = collection(db, 'notifications');
            const guestNotifRef = doc(notificationsRef);
            batch.set(guestNotifRef, {
                targetUid: collab.uid,
                type: 'role_changed',
                message: `${user.displayName} updated your access to ${newRole === 'edit' ? '✏️ Edit' : '👁️ View'}.`,
                read: false,
                createdAt: serverTimestamp()
            });

            // 3. Add notification for the owner (activity log)
            const ownerNotifRef = doc(notificationsRef);
            batch.set(ownerNotifRef, {
                targetUid: user.uid,
                type: 'permission_update',
                message: `You updated ${collab.displayName}'s access to ${newRole === 'edit' ? '✏️ Edit' : '👁️ View'}.`,
                read: true, // Activity log starts as read
                createdAt: serverTimestamp()
            });

            await batch.commit();
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

            // 1. Remove from inventory document
            const { arrayRemove } = await import('firebase/firestore');
            await updateDoc(inventoryRef, {
                [`collaborators.${collab.uid}`]: deleteField(),
                collaboratorUids: arrayRemove(collab.uid) // Remove from queryable array
            });

            // 2. Find and revoke the access request document
            const requestsRef = collection(db, 'accessRequests');
            const q = query(
                requestsRef,
                where('requesterId', '==', collab.uid),
                where('targetUserId', '==', user.uid),
                where('status', '==', 'approved')
            );
            const requestSnap = await getDocs(q);

            const batch = writeBatch(db);
            requestSnap.forEach(requestDoc => {
                batch.update(requestDoc.ref, {
                    status: 'revoked',
                    revokedAt: serverTimestamp()
                });
            });

            // 3. Add notification for the guest
            const notificationsRef = collection(db, 'notifications');
            const guestNotifRef = doc(notificationsRef);
            batch.set(guestNotifRef, {
                targetUid: collab.uid,
                type: 'access_revoked',
                message: `${user.displayName} has removed your access to their inventory.`,
                read: false,
                createdAt: serverTimestamp()
            });

            // 4. Add notification for the owner (activity log)
            const ownerNotifRef = doc(notificationsRef);
            batch.set(ownerNotifRef, {
                targetUid: user.uid,
                type: 'collaborator_removed',
                message: `You removed ${collab.displayName}'s access to your inventory.`,
                read: true,
                createdAt: serverTimestamp()
            });

            await batch.commit();
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
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[9px] font-bold uppercase tracking-tight ${collab.type === 'guest' ? 'text-primary-500' : 'text-gray-500'}`}>
                                    {collab.type === 'guest' ? '👤 Guest' : '🏠 Host'}
                                </span>
                                <span className="text-[9px] text-gray-300">•</span>
                                {collab.type === 'guest' ? (
                                    <select
                                        value={collab.role}
                                        onChange={(e) => handleUpdateRole(collab, e.target.value)}
                                        className="bg-transparent text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 outline-none cursor-pointer hover:text-primary-500 transition-colors"
                                    >
                                        <option value="view">👁️ View</option>
                                        <option value="edit">✏️ Edit</option>
                                    </select>
                                ) : (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                        {collab.role === 'edit' ? '✏️ Edit' : '👁️ View'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {collab.type === 'guest' && (
                            <div className="flex items-center gap-1">

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
