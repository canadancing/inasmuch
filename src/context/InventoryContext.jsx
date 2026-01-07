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
                // Get owned inventories
                const ownedRef = collection(db, 'inventories');
                const ownedQuery = query(ownedRef, where('ownerId', '==', user.uid));
                const ownedSnapshot = await getDocs(ownedQuery);
                const ownedInventories = ownedSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    isOwner: true
                }));

                // Get all inventories to find ones where user is a collaborator
                const allRef = collection(db, 'inventories');
                const allSnapshot = await getDocs(allRef);
                const collaboratedInventories = allSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(inv => inv.collaborators && inv.collaborators[user.uid])
                    .map(inv => ({ ...inv, isOwner: false }));

                // Combine both lists
                const allInventories = [...ownedInventories, ...collaboratedInventories];
                setInventories(allInventories);

                // Auto-select first inventory if none selected
                if (!currentInventoryId && allInventories.length > 0) {
                    const savedInventoryId = localStorage.getItem('currentInventoryId');
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

        // Set up real-time listener for owned inventories
        const inventoriesRef = collection(db, 'inventories');
        const q = query(inventoriesRef, where('ownerId', '==', user.uid));

        const unsubscribe = onSnapshot(q, () => {
            // Reload when changes detected
            loadInventories();
        }, (error) => {
            console.error('Error in inventory listener:', error);
        });

        return () => unsubscribe();
    }, [user, currentInventoryId]);

    // Update current inventory when selection changes
    useEffect(() => {
        if (currentInventoryId) {
            const inventory = inventories.find(inv => inv.id === currentInventoryId);
            setCurrentInventory(inventory);

            if (user && inventory) {
                setPermissions(calculatePermissions(user.uid, inventory));
            }

            // Save to localStorage
            localStorage.setItem('currentInventoryId', currentInventoryId);
        }
    }, [currentInventoryId, inventories, user]);

    const switchInventory = (inventoryId) => {
        setCurrentInventoryId(inventoryId);
    };

    const value = {
        inventories,
        currentInventoryId,
        currentInventory,
        permissions,
        loading,
        switchInventory
    };

    return (
        <InventoryContext.Provider value={value}>
            {children}
        </InventoryContext.Provider>
    );
}

export function useInventory() {
    const context = useContext(InventoryContext);
    if (context === undefined) {
        throw new Error('useInventory must be used within an InventoryProvider');
    }
    return context;
}
