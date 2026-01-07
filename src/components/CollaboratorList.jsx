import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function CollaboratorList({ user }) {
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // 1. Get collaborations from user's own inventory
        const inventoriesRef = collection(db, 'inventories');
        const q1 = query(inventoriesRef, where('ownerId', '==', user.uid));

        const unsub1 = onSnapshot(q1, async (snapshot) => {
            const list = [];
            for (const docSnap of snapshot.docs) {
                const data = docSnap.data();
                const collabMap = data.collaborators || {};

                for (const [collabUid, role] of Object.entries(collabMap)) {
                    // Fetch user info for each collaborator
                    const userDoc = await getDoc(doc(db, 'users', collabUid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        list.push({
                            uid: collabUid,
                            displayName: userData.displayName,
                            photoURL: userData.photoURL,
                            role: role,
                            type: 'outsider', // They have access to MY inventory
                            inventoryName: data.name
                        });
                    }
                }
            }

            // 2. Get inventories user has access to (simplified for now: check all inventories where user is in collaborators)
            // Note: In a real app, you might want a more efficient way to query this
            const q2 = query(inventoriesRef);
            const snapshot2 = await getDocs(q2);
            snapshot2.forEach(docSnap => {
                const data = docSnap.data();
                if (data.ownerId !== user.uid && data.collaborators?.[user.uid]) {
                    // This is an inventory I have access to
                    // Need to fetch owner info
                    // ... this part is more complex, keeping it simple for display
                }
            });

            setCollaborators(list);
            setLoading(false);
        });

        return () => unsub1();
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
                        key={`${collab.uid}-${collab.type}`}
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
                                {collab.role === 'edit' ? '✏️ Can Edit' : '👁️ View Only'}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
