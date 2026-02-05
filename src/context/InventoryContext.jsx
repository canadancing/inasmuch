import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { calculatePermissions } from '../types/inventory';

const InventoryContext = createContext();

export function InventoryProvider({ children, user }) {
    const [inventories, setInventories] = useState([]);
    const [currentInventoryId, setCurrentInventoryId] = useState(null);
    const [currentInventory, setCurrentInventory] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user's inventories (owned + collaborated)
    useEffect(() => {
        if (!user) {
            setInventories([]);
            setCurrentInventoryId(null);
            setCurrentInventory(null);
            setPermissions(null);
            setLoading(false);
            return;
        }

        setLoading(true);

        const loadInventories = async () => {
            try {
                // 1. Get user nicknames (both public and private)
                const userSnapshot = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
                const userData = userSnapshot.empty ? {} : userSnapshot.docs[0].data();
                const inventoryNicknames = userData.inventoryNicknames || {};
                const collaboratorNicknames = userData.collaboratorNicknames || {};

                // 2. Get owned inventories
                const ownedRef = collection(db, 'inventories');
                const ownedQuery = query(ownedRef, where('ownerId', '==', user.uid));
                const ownedSnapshot = await getDocs(ownedQuery);
                const ownedInventories = ownedSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        ...data,
                        id: doc.id,
                        isOwner: true,
                        publicNickname: data.nickname,
                        privateNickname: collaboratorNicknames[doc.id],
                        displayName: collaboratorNicknames[doc.id] || data.nickname || data.name,
                        nickname: inventoryNicknames[doc.id] || null
                    };
                });

                // 3. Get collaborated inventories using collaboratorUids array
                const collabRef = collection(db, 'inventories');
                const collabQuery = query(collabRef, where('collaboratorUids', 'array-contains', user.uid));
                const collabSnapshot = await getDocs(collabQuery);
                const collaboratedInventories = collabSnapshot.docs
                    .map(doc => ({ ...doc.data(), id: doc.id }))
                    .map(inv => {
                        // Apply private remark to owner name if available
                        const ownerRemark = collaboratorNicknames[inv.ownerId];
                        const ownerDisplayName = ownerRemark || inv.ownerName || 'Unknown Owner';

                        return {
                            ...inv,
                            isOwner: false,
                            ownerDisplayName,
                            publicNickname: inv.nickname,
                            privateNickname: collaboratorNicknames[inv.id],
                            displayName: collaboratorNicknames[inv.id] || inv.nickname || inv.name,
                            nickname: inventoryNicknames[inv.id] || null
                        };
                    });

                // Combine both lists
                const allInventories = [...ownedInventories, ...collaboratedInventories];
                setInventories(allInventories);

                // Auto-select first inventory if none selected
                if (!currentInventoryId && allInventories.length > 0) {
                    const savedInventoryId = sessionStorage.getItem('currentInventoryId');
                    const inventoryToSelect = allInventories.find(inv => inv.id === savedInventoryId) || allInventories[0];
                    setCurrentInventoryId(inventoryToSelect.id);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error loading inventories:', error);
                setLoading(false);
            }
        };

        loadInventories();

        // Real-time listener for owned inventories
        const inventoriesRef = collection(db, 'inventories');
        const qOwned = query(inventoriesRef, where('ownerId', '==', user.uid));
        const unsubOwned = onSnapshot(
            qOwned,
            () => loadInventories(),
            (error) => {
                // Suppress expected permission errors for new users with no inventories
                if (error.code !== 'permission-denied') {
                    console.error('Error in owned inventories listener:', error);
                }
            }
        );

        // Real-time listener for collaborated inventories (using collaboratorUids array)
        const qCollaborated = query(inventoriesRef, where('collaboratorUids', 'array-contains', user.uid));
        const unsubCollaborated = onSnapshot(
            qCollaborated,
            () => loadInventories(),
            (error) => {
                // Suppress expected permission errors for users not yet collaborating
                if (error.code !== 'permission-denied') {
                    console.error('Error in collaborated inventories listener:', error);
                }
            }
        );

        // Real-time listener for user profile (to detect nickname/remark changes)
        const qUser = query(collection(db, 'users'), where('uid', '==', user.uid));
        const unsubUser = onSnapshot(qUser, () => loadInventories());

        return () => {
            unsubOwned();
            unsubCollaborated();
            unsubUser();
        };
    }, [user, currentInventoryId]);

    // Update current inventory and permissions when selection changes
    useEffect(() => {
        if (!user) {
            setCurrentInventory(null);
            setPermissions(null);
            return;
        }

        if (currentInventoryId && inventories.length > 0) {
            const inventory = inventories.find(inv => inv.id === currentInventoryId);
            if (inventory) {
                setCurrentInventory(inventory);
                setPermissions(calculatePermissions(inventory, user.uid));
                sessionStorage.setItem('currentInventoryId', currentInventoryId);
            }
        }
    }, [currentInventoryId, inventories, user]);

    const switchInventory = (id) => {
        setCurrentInventoryId(id);
    };

    const updateInventoryPublicName = async (inventoryId, nickname) => {
        if (!user) return;

        try {
            const inventoryRef = doc(db, 'inventories', inventoryId);
            await updateDoc(inventoryRef, {
                nickname: nickname || null,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating inventory public name:', error);
            throw error;
        }
    };

    const updateCollaboratorPrivateName = async (targetId, nickname) => {
        if (!user) return;

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                [`collaboratorNicknames.${targetId}`]: nickname || null,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating collaborator private name:', error);
            throw error;
        }
    };

    return (
        <InventoryContext.Provider value={{
            inventories,
            currentInventory,
            currentInventoryId,
            permissions,
            switchInventory,
            updateInventoryPublicName,
            updateCollaboratorPrivateName,
            loading,
            user
        }}>
            {children}
        </InventoryContext.Provider>
    );
}

export const useInventory = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
}
