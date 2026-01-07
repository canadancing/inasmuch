import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, onSnapshot, or } from 'firebase/firestore';
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

        // Listen to inventories where user is owner OR collaborator
        const inventoriesRef = collection(db, 'inventories');
        const q = query(
            inventoriesRef,
            or(
                where('ownerId', '==', user.uid),
                where(`collaborators.${user.uid}.permission`, 'in', ['view', 'edit'])
            )
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const inventoryList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setInventories(inventoryList);

            // Auto-select first inventory if none selected
            if (!currentInventoryId && inventoryList.length > 0) {
                const savedInventoryId = localStorage.getItem('currentInventoryId');
                const inventoryToSelect = inventoryList.find(inv => inv.id === savedInventoryId) || inventoryList[0];
                setCurrentInventoryId(inventoryToSelect.id);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

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
