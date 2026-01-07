import { useState, useEffect } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useInventory } from '../context/InventoryContext';

// Demo data for visitors (unchanged from original)
const demoItems = [
    { id: '1', name: 'Toilet Paper', icon: '🧻', currentStock: 12, minStock: 5 },
    { id: '2', name: 'Paper Towels', icon: '🧻', currentStock: 6, minStock: 3 },
    { id: '3', name: 'Dish Soap', icon: '🧴', currentStock: 2, minStock: 2 },
];

const demoResidents = [
    { id: '1', firstName: 'Alex', lastName: 'Johnson', room: 'Room 101' },
    { id: '2', firstName: 'Jordan', lastName: 'Smith', room: 'Room 102' },
];

export function useFirestore(user) {
    // Get inventory context - but handle case where it might not be ready
    let currentInventoryId = null;
    let permissions = null;

    try {
        const inventory = useInventory();
        currentInventoryId = inventory.currentInventoryId;
        permissions = inventory.permissions;
    } catch (error) {
        // Context not available yet, will use demo mode
        console.log('InventoryContext not available, using demo mode');
    }

    const [items, setItems] = useState([]);
    const [residents, setResidents] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isDemo = !currentInventoryId;

    // Fetch items from current inventory
    useEffect(() => {
        if (!currentInventoryId) {
            setItems(demoItems);
            setResidents(demoResidents);
            setLogs([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        const itemsRef = collection(db, 'inventories', currentInventoryId, 'items');
        const itemsQuery = query(itemsRef, orderBy('name'));

        const unsubscribe = onSnapshot(itemsQuery, (snapshot) => {
            const itemsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItems(itemsList);
            setLoading(false);
        }, (err) => {
            console.error('Error fetching items:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentInventoryId]);

    // Fetch residents from current inventory
    useEffect(() => {
        if (!currentInventoryId) return;

        const residentsRef = collection(db, 'inventories', currentInventoryId, 'residents');
        const residentsQuery = query(residentsRef, orderBy('firstName'));

        const unsubscribe = onSnapshot(residentsQuery, (snapshot) => {
            const residentsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setResidents(residentsList);
        });

        return () => unsubscribe();
    }, [currentInventoryId]);

    // Fetch logs from current inventory
    useEffect(() => {
        if (!currentInventoryId) return;

        const logsRef = collection(db, 'inventories', currentInventoryId, 'logs');
        const logsQuery = query(logsRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const logsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLogs(logsList);
        });

        return () => unsubscribe();
    }, [currentInventoryId]);

    // Add log (with permission check)
    const addLog = async (resId, resName, itemId, itemName, action, qty, date) => {
        if (!permissions?.canEdit) {
            console.warn('Permission denied: You do not have edit access');
            return;
        }

        const logsRef = collection(db, 'inventories', currentInventoryId, 'logs');
        await addDoc(logsRef, {
            residentId: resId,
            residentName: resName,
            itemId,
            itemName,
            action,
            quantity: parseInt(qty),
            date: date instanceof Date ? date : (date?.toDate ? date.toDate() : new Date(date)),
            performedBy: user?.uid,
            performedByName: user?.displayName || 'Unknown'
        });

        // Update item stock
        const itemDocRef = doc(db, 'inventories', currentInventoryId, 'items', itemId);
        const item = items.find(i => i.id === itemId);
        if (item) {
            let newStock = item.currentStock;
            if (action === 'used') {
                newStock = Math.max(0, item.currentStock - parseInt(qty));
            } else if (action === 'restocked') {
                newStock = item.currentStock + parseInt(qty);
            }

            await updateDoc(itemDocRef, {
                currentStock: newStock,
                updatedAt: serverTimestamp(),
                updatedBy: user?.uid
            });
        }
    };

    // Add item (with permission check)
    const addItem = async (name, icon) => {
        if (!permissions?.canEdit) {
            console.warn('Permission denied');
            return;
        }

        const itemsRef = collection(db, 'inventories', currentInventoryId, 'items');
        const docRef = await addDoc(itemsRef, {
            name,
            icon,
            currentStock: 0,
            minStock: 0,
            createdAt: serverTimestamp(),
            createdBy: user?.uid,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid
        });

        // Log this action
        await addLog(null, 'Admin', docRef.id, name, 'created-item', 1, new Date());
    };

    // Update item (with permission check)
    const updateItem = async (itemId, updates) => {
        if (!permissions?.canEdit) {
            console.warn('Permission denied');
            return;
        }

        const itemDocRef = doc(db, 'inventories', currentInventoryId, 'items', itemId);
        await updateDoc(itemDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid
        });

        // Log this action
        const itemName = updates.name || items.find(i => i.id === itemId)?.name || 'Item';
        await addLog(null, 'Admin', itemId, itemName, 'updated-item', 0, new Date());
    };

    // Delete item (owner only)
    const removeItem = async (itemId) => {
        if (!permissions?.canDelete) {
            console.warn('Permission denied: Only the owner can delete items');
            return;
        }

        const itemName = items.find(i => i.id === itemId)?.name || 'Item';
        const itemDocRef = doc(db, 'inventories', currentInventoryId, 'items', itemId);
        await deleteDoc(itemDocRef);

        // Log this action
        await addLog(null, 'Admin', itemId, itemName, 'deleted-item', 0, new Date());
    };

    // Add resident (with permission check)
    const addResident = async (residentData) => {
        if (!permissions?.canEdit) {
            console.warn('Permission denied');
            return;
        }

        const residentsRef = collection(db, 'inventories', currentInventoryId, 'residents');
        const docRef = await addDoc(residentsRef, {
            ...residentData,
            createdAt: serverTimestamp(),
            createdBy: user?.uid,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid
        });

        // Log this action
        const resName = `${residentData.firstName} ${residentData.lastName}`.trim();
        await addLog(docRef.id, resName, null, 'Resident', 'move-in', 1, new Date());
    };

    // Update resident (with permission check)
    const updateResident = async (residentId, updates) => {
        if (!permissions?.canEdit) {
            console.warn('Permission denied');
            return;
        }

        const residentDocRef = doc(db, 'inventories', currentInventoryId, 'residents', residentId);
        await updateDoc(residentDocRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid
        });

        // Log this action
        const resName = updates.firstName ? `${updates.firstName} ${updates.lastName || ''}`.trim() : (residents.find(r => r.id === residentId)?.firstName || 'Resident');
        await addLog(residentId, resName, null, 'Resident', 'updated-resident', 0, new Date());
    };

    // Delete resident (owner only)
    const removeResident = async (residentId) => {
        if (!permissions?.canDelete) {
            console.warn('Permission denied: Only the owner can delete residents');
            return;
        }

        const res = residents.find(r => r.id === residentId);
        const resName = res ? `${res.firstName} ${res.lastName}`.trim() : 'Resident';
        const residentDocRef = doc(db, 'inventories', currentInventoryId, 'residents', residentId);
        await deleteDoc(residentDocRef);

        // Log this action
        await addLog(residentId, resName, null, 'Resident', 'move-out', 1, new Date());
    };

    // Delete log (owner only)
    const deleteLog = async (logId) => {
        if (!permissions?.canDelete) {
            console.warn('Permission denied');
            return;
        }

        const logDocRef = doc(db, 'inventories', currentInventoryId, 'logs', logId);
        await deleteDoc(logDocRef);
    };

    // Restock item (with permission check)
    // Signature matches AdminPanel handleRestock: onRestock(itemId, itemName, qty, resId, resName, date)
    const restockItem = async (itemId, itemName, quantity, resId, resName, date) => {
        if (!permissions?.canEdit) {
            console.warn('Permission denied');
            return;
        }

        // Call addLog which handles both logging and stock update
        await addLog(resId, resName, itemId, itemName, 'restocked', quantity, date);
    };

    return {
        items,
        residents,
        logs,
        loading,
        error,
        isDemo,
        addLog,
        addItem,
        updateItem,
        removeItem,
        addResident,
        updateResident,
        removeResident,
        deleteLog,
        restockItem
    };
}
