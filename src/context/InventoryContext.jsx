import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { calculatePermissions } from '../types/inventory';

const InventoryContext = createContext();

export function InventoryProvider({ children, user }) {
    const [inventories, setInventories] = useState([]);
    const [currentInventoryId, setCurrentInventoryId] = useState(null);
    const [currentInventory, setCurrentInventory] = useState(null);
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user's inventories (owned only for now - collaboration will be added later)
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

        try {
            // For now, just fetch inventories owned by user
            // Collaborated inventories will be added when we implement access requests
            const inventoriesRef = collection(db, 'inventories');
            const q = query(inventoriesRef, where('ownerId', '==', user.uid));

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
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
                },
                (error) => {
                    console.error('Error loading inventories:', error);
                    setLoading(false);
                }
            );

            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up inventory listener:', error);
            setLoading(false);
        }
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
