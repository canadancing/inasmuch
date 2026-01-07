import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
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
                // 1. Get user nicknames
                const userRef = doc(db, 'users', user.uid);
                const userSnapshot = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
                const userData = userSnapshot.empty ? {} : userSnapshot.docs[0].data();
                const nicknames = userData.inventoryNicknames || {};

                // 2. Get owned inventories
                const ownedRef = collection(db, 'inventories');
                const ownedQuery = query(ownedRef, where('ownerId', '==', user.uid));
                const ownedSnapshot = await getDocs(ownedQuery);
                const ownedInventories = ownedSnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                    isOwner: true,
                    nickname: nicknames[doc.id] || null
                }));

                // 3. Get all inventories to find ones where user is a collaborator
                const allRef = collection(db, 'inventories');
                const allSnapshot = await getDocs(allRef);
                const collaboratedInventories = allSnapshot.docs
                    .map(doc => ({ ...doc.data(), id: doc.id }))
                    .filter(inv => inv.collaborators && inv.collaborators[user.uid])
                    .map(inv => ({
                        ...inv,
                        isOwner: false,
                        nickname: nicknames[inv.id] || null
                    }));

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
        const unsubOwned = onSnapshot(qOwned, () => loadInventories());

        // Real-time listener for user profile (to detect nickname changes)
        const qUser = query(collection(db, 'users'), where('uid', '==', user.uid));
        const unsubUser = onSnapshot(qUser, () => loadInventories());

        return () => {
            unsubOwned();
            unsubUser();
        };
    }, [user, currentInventoryId]);

    // Update current inventory and permissions when selection changes
    useEffect(() => {
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

    return (
        <InventoryContext.Provider value={{
            inventories,
            currentInventory,
            currentInventoryId,
            permissions,
            switchInventory,
            loading
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
