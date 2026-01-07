import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
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

                    for (const [collabUid, role] of Object.entries(collabMap)) {
                        if (processedUids.has(collabUid)) continue;

                        const userDoc = await getDoc(doc(db, 'users', collabUid));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            guestList.push({
                                uid: collabUid,
                                displayName: userData.displayName,
                                photoURL: userData.photoURL,
                                role: role,
                                type: 'guest',
                                inventoryName: data.name
                            });
                            processedUids.add(collabUid);
                        }
                    }
                }

                // Initial set of collaborators
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

    if (loading) return <div className="animate-pulse h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl"></div>;

    if (collaborators.length === 0) {
        return (
            <div className="text-center py-6 opacity-50 italic text-sm">
                No active collaborators found
            </div>
        );
    }

    return (
        <div className="space-y-3 mt-6 pt-6 border-t border-primary-100 dark:border-primary-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400 mb-2">
                Active Collaborators
            </h4>
            <div className="grid grid-cols-1 gap-2">
                {collaborators.map((collab) => (
                    <div
                        key={`${collab.uid} -${collab.type} `}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/40 dark:border-gray-700/50"
                    >
                        <img
                            src={collab.photoURL}
                            alt=""
                            className="w-8 h-8 rounded-lg shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {collab.displayName}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-tight">
                                {collab.type === 'guest' ? '👤 Guest' : '🏠 Host'} • {collab.role === 'edit' ? '✏️ Edit' : '👁️ View'} access
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
