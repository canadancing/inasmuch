import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc, deleteField, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useInventory } from '../context/InventoryContext';
import AccessRequestModal from './AccessRequestModal';
import InventoryNicknameModal from './InventoryNicknameModal';

export default function CollaboratorList({ user }) {
    const { updateCollaboratorPrivateName } = useInventory();
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [upgradeRequest, setUpgradeRequest] = useState(null);
    const [remarkTarget, setRemarkTarget] = useState(null);
    const [myNicknames, setMyNicknames] = useState({});

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
                                userId: userData.userId,
                                realName: userData.displayName,
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
                    const ownerQuery = query(usersRef, where('uid', '==', requestData.targetUserId));
                    const ownerSnapshot = await getDocs(ownerQuery);

                    if (!ownerSnapshot.empty) {
                        const ownerData = ownerSnapshot.docs[0].data();
                        hostList.push({
                            uid: ownerData.uid,
                            userId: ownerData.userId,
                            realName: ownerData.displayName,
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
            unsubMyProfile();
            unsub1();
            unsub2();
        };
    }, [user]);

    const handleUpdateRole = async (collab, newRole) => {
        try {
            const inventoryRef = doc(db, 'inventories', collab.inventoryId);
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

    const handleRemoveCollab = async (collab) => {
        if (!confirm(`Remove ${myNicknames[collab.uid] || collab.realName}'s access to your inventory?`)) return;
        try {
            const inventoryRef = doc(db, 'inventories', collab.inventoryId);
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
                message: `You removed ${myNicknames[collab.uid] || collab.realName}'s access to your inventory.`,
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

    if (collaborators.length === 0) {
        return (
            <div className="text-center py-4 opacity-40 text-xs font-medium">
                No active collaborators found
            </div>
        );
    }

    return (
        <>
            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-gray-500 mb-1 ml-1">
                    Active Collaborators
                </h4>
                <div className="space-y-1">
                    {collaborators.map((collab) => {
                        const remarkName = myNicknames[collab.uid];
                        const displayName = remarkName || collab.realName;

                        return (
                            <div
                                key={`${collab.uid}-${collab.type}`}
                                className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 transition-colors group"
                            >
                                <img
                                    src={collab.photoURL}
                                    alt=""
                                    className="w-7 h-7 rounded-lg"
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-gray-900 dark:text-white truncate flex items-center group/name">
                                        <span className={remarkName ? "text-primary-600 dark:text-primary-400" : ""}>{displayName}</span>
                                        <button
                                            onClick={() => setRemarkTarget({ id: collab.uid, displayName: collab.realName, privateNickname: remarkName })}
                                            className="ml-2 p-1 rounded-md text-gray-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 opacity-0 group-hover/name:opacity-100 transition-all duration-200"
                                            title="Set Private Remark"
                                        >
                                            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </p>
                                    {collab.userId && (
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                            ID: {collab.userId}
                                        </p>
                                    )}
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
                                            <select
                                                value={collab.role}
                                                onChange={(e) => {
                                                    if (e.target.value === 'request_edit') {
                                                        setUpgradeRequest(collab);
                                                    }
                                                }}
                                                className="bg-transparent text-[9px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 outline-none cursor-pointer hover:text-primary-500 transition-colors"
                                                disabled={collab.role === 'edit'}
                                            >
                                                <option value="view">👁️ View</option>
                                                <option value="edit" disabled={collab.role === 'view'}>✏️ Edit</option>
                                                {collab.role === 'view' && (
                                                    <option value="request_edit">🔄 Request Edit</option>
                                                )}
                                            </select>
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
                        );
                    })}
                </div>
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
