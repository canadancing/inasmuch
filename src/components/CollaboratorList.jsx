import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, deleteField, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useInventory } from '../context/InventoryContext';
import AccessRequestModal from './AccessRequestModal';
import InventoryNicknameModal from './InventoryNicknameModal';
import UserAvatar from './UserAvatar';

export default function CollaboratorList({ user }) {
    const { updateCollaboratorPrivateName } = useInventory();
    const [inventoriesWithCollabs, setInventoriesWithCollabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [upgradeRequest, setUpgradeRequest] = useState(null);
    const [remarkTarget, setRemarkTarget] = useState(null);
    const [myNicknames, setMyNicknames] = useState({});
    const [expandedInventories, setExpandedInventories] = useState(new Set());

    useEffect(() => {
        if (!user) return;

        // Listen to my own document for private remarks
        const userRef = doc(db, 'users', user.uid);
        const unsubMyProfile = onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setMyNicknames(snapshot.data().collaboratorNicknames || {});
            }
        });

        const inventoriesRef = collection(db, 'inventories');
        const usersRef = collection(db, 'users');
        const requestsRef = collection(db, 'accessRequests');

        // Fetch owned inventories with guests
        const q1 = query(inventoriesRef, where('ownerId', '==', user.uid));

        // Fetch host collaborations (where I'm invited)
        const q2 = query(requestsRef, where('requesterId', '==', user.uid), where('status', '==', 'approved'));

        const unsub1 = onSnapshot(q1, async (snapshot) => {
            try {
                const inventoriesList = [];

                for (const docSnap of snapshot.docs) {
                    const data = docSnap.data();
                    const collabMap = data.collaborators || {};
                    const guests = [];

                    for (const [collabUid, roleInfo] of Object.entries(collabMap)) {
                        const userDoc = await getDoc(doc(db, 'users', collabUid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            guests.push({
                                uid: collabUid,
                                userId: userData.userId,
                                realName: userData.displayName,
                                photoURL: userData.photoURL,
                                role: typeof roleInfo === 'string' ? roleInfo : roleInfo.permission,
                                type: 'guest',
                                inventoryId: docSnap.id
                            });
                        }
                    }

                    if (guests.length > 0) {
                        inventoriesList.push({
                            inventoryId: docSnap.id,
                            inventoryName: data.name || data.nickname || 'Unnamed Inventory',
                            isOwned: true,
                            collaborators: guests
                        });
                    }
                }

                setInventoriesWithCollabs(prev => {
                    const hosts = prev.filter(inv => !inv.isOwned);
                    return [...inventoriesList, ...hosts];
                });
            } catch (error) {
                console.error("Error in Guest listener:", error);
            } finally {
                setLoading(false);
            }
        });

        const unsub2 = onSnapshot(q2, async (snapshot) => {
            try {
                const hostInventoriesList = [];

                for (const docSnap of snapshot.docs) {
                    const requestData = docSnap.data();
                    const ownerQuery = query(usersRef, where('uid', '==', requestData.targetUserId));
                    const ownerSnapshot = await getDocs(ownerQuery);

                    if (!ownerSnapshot.empty) {
                        const ownerData = ownerSnapshot.docs[0].data();
                        hostInventoriesList.push({
                            inventoryId: requestData.inventoryId || 'unknown',
                            inventoryName: requestData.targetUserName + "'s Inventory",
                            isOwned: false,
                            collaborators: [{
                                uid: ownerData.uid,
                                userId: ownerData.userId,
                                realName: ownerData.displayName,
                                photoURL: ownerData.photoURL,
                                role: requestData.permission,
                                type: 'host',
                                inventoryId: requestData.inventoryId || 'unknown'
                            }]
                        });
                    }
                }

                setInventoriesWithCollabs(prev => {
                    const owned = prev.filter(inv => inv.isOwned);
                    return [...owned, ...hostInventoriesList];
                });
            } catch (error) {
                console.error("Error in Host listener:", error);
            }
        });

        return () => {
            unsubMyProfile();
            unsub1();
            unsub2();
        };
    }, [user]);

    const toggleInventory = (inventoryId) => {
        setExpandedInventories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(inventoryId)) {
                newSet.delete(inventoryId);
            } else {
                newSet.add(inventoryId);
            }
            return newSet;
        });
    };

    const handleUpdateRole = async (collab, newRole, inventoryId) => {
        try {
            const inventoryRef = doc(db, 'inventories', inventoryId);
            const batch = writeBatch(db);
            batch.update(inventoryRef, {
                [`collaborators.${collab.uid}.permission`]: newRole
            });

            const notificationsRef = collection(db, 'notifications');
            const guestNotifRef = doc(notificationsRef);
            batch.set(guestNotifRef, {
                targetUid: collab.uid,
                type: 'role_changed',
                message: `${user.displayName} updated your access to ${newRole === 'edit' ? '✏️ Edit' : '👁️ View'}.`,
                read: false,
                createdAt: serverTimestamp()
            });

            const ownerNotifRef = doc(notificationsRef);
            batch.set(ownerNotifRef, {
                targetUid: user.uid,
                type: 'permission_update',
                message: `You updated ${myNicknames[collab.uid] || collab.realName}'s access to ${newRole === 'edit' ? '✏️ Edit' : '👁️ View'}.`,
                read: true,
                createdAt: serverTimestamp()
            });

            await batch.commit();
        } catch (error) {
            console.error("Error updating role:", error);
            alert("Failed to update access");
        }
    };

    const handleRemoveCollab = async (collab, inventoryId) => {
        if (!confirm(`Remove ${myNicknames[collab.uid] || collab.realName}'s access?`)) return;
        try {
            const inventoryRef = doc(db, 'inventories', inventoryId);
            const { arrayRemove } = await import('firebase/firestore');
            await updateDoc(inventoryRef, {
                [`collaborators.${collab.uid}`]: deleteField(),
                collaboratorUids: arrayRemove(collab.uid)
            });

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

            const notificationsRef = collection(db, 'notifications');
            const guestNotifRef = doc(notificationsRef);
            batch.set(guestNotifRef, {
                targetUid: collab.uid,
                type: 'access_revoked',
                message: `${user.displayName} has removed your access to their inventory.`,
                read: false,
                createdAt: serverTimestamp()
            });

            const ownerNotifRef = doc(notificationsRef);
            batch.set(ownerNotifRef, {
                targetUid: user.uid,
                type: 'collaborator_removed',
                message: `You removed ${myNicknames[collab.uid] || collab.realName}'s access.`,
                read: true,
                createdAt: serverTimestamp()
            });

            await batch.commit();
        } catch (error) {
            console.error("Error removing collaborator:", error);
            alert("Failed to remove collaborator");
        }
    };

    if (loading) return <div className="animate-pulse h-20 bg-gray-50 dark:bg-gray-800/50 rounded-2xl"></div>;

    if (inventoriesWithCollabs.length === 0) {
        return (
            <div className="text-center py-6 opacity-40 text-xs font-medium">
                No collaborators yet
            </div>
        );
    }

    return (
        <>
            <div className="space-y-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-2 ml-1">
                    Collaborators
                </h4>

                {inventoriesWithCollabs.map((inventory) => {
                    const isExpanded = expandedInventories.has(inventory.inventoryId);
                    const collabCount = inventory.collaborators.length;

                    return (
                        <div key={inventory.inventoryId} className="space-y-1">
                            {/* Inventory Header */}
                            <button
                                onClick={() => toggleInventory(inventory.inventoryId)}
                                className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group"
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-base flex-shrink-0">📦</span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                        {inventory.inventoryName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                        {collabCount}
                                    </span>
                                    <svg
                                        className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {/* Collaborators List */}
                            {isExpanded && (
                                <div className="space-y-1 pl-2">
                                    {inventory.collaborators.map((collab) => {
                                        const remarkName = myNicknames[collab.uid];
                                        const displayName = remarkName || collab.realName;

                                        return (
                                            <div
                                                key={`${collab.uid}-${inventory.inventoryId}`}
                                                className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
                                            >
                                                <UserAvatar user={collab} size="sm" />

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-baseline gap-2 group/name">
                                                        <p className={`text-xs font-bold truncate ${remarkName ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {displayName}
                                                        </p>
                                                        {collab.userId && (
                                                            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono">
                                                                ID: {collab.userId}
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => setRemarkTarget({ id: collab.uid, displayName: collab.realName, privateNickname: remarkName })}
                                                            className="ml-auto p-0.5 rounded text-gray-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 opacity-0 group-hover/name:opacity-100 transition-all duration-200"
                                                            title="Set Private Remark"
                                                        >
                                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className={`text-[9px] font-bold uppercase tracking-tight ${collab.type === 'guest' ? 'text-primary-500' : 'text-gray-500'}`}>
                                                            {collab.type === 'guest' ? '👤 Guest' : '🏠 Host'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-300">•</span>
                                                        {collab.type === 'guest' && inventory.isOwned ? (
                                                            <select
                                                                value={collab.role}
                                                                onChange={(e) => handleUpdateRole(collab, e.target.value, inventory.inventoryId)}
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

                                                {collab.type === 'guest' && inventory.isOwned && (
                                                    <button
                                                        onClick={() => handleRemoveCollab(collab, inventory.inventoryId)}
                                                        title="Remove Access"
                                                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 transition-colors flex-shrink-0"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <AccessRequestModal
                isOpen={!!upgradeRequest}
                onClose={() => setUpgradeRequest(null)}
                targetUser={upgradeRequest ? {
                    uid: upgradeRequest.uid,
                    displayName: upgradeRequest.realName,
                    photoURL: upgradeRequest.photoURL
                } : null}
                currentUser={user}
                currentInventoryId={upgradeRequest?.inventoryId}
                currentInventoryName={upgradeRequest?.inventoryName}
                onSuccess={() => {
                    setUpgradeRequest(null);
                    alert('✅ Upgrade request sent!');
                }}
            />

            <InventoryNicknameModal
                isOpen={!!remarkTarget}
                onClose={() => setRemarkTarget(null)}
                target={remarkTarget}
                type="private"
                onSuccess={() => { }}
            />
        </>
    );
}
