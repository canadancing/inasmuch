import { useState, useEffect } from 'react';
import {
    residentsRef,
    itemsRef,
    logsRef,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    db,
    serverTimestamp,
    isFirebaseConfigured
} from '../firebase/config';

// Demo data for when Firebase is not configured
const demoResidents = [
    {
        id: '1',
        firstName: 'Alex',
        lastName: 'Johnson',
        phone: '555-0101',
        room: 'Room 101',
        country: 'United States',
        moveInDate: '2024-01-15',
        moveOutDate: null,
        notes: 'Allergic to peanuts. Prefers top shelf items.',
        active: true,
        tags: ['resident']
    },
    {
        id: '2',
        firstName: 'Jordan',
        lastName: 'Smith',
        phone: '555-0102',
        room: 'Room 102',
        country: 'Canada',
        moveInDate: '2024-03-01',
        moveOutDate: null,
        notes: 'Also donates supplies monthly.',
        active: true,
        tags: ['resident', 'donor']
    },
    {
        id: '3',
        firstName: 'Sam',
        lastName: 'Williams',
        phone: '555-0103',
        room: 'Room 103',
        country: 'Mexico',
        moveInDate: '2024-06-20',
        moveOutDate: null,
        notes: '',
        active: true,
        tags: ['resident']
    },
    {
        id: '4',
        firstName: 'Community',
        lastName: 'Church',
        phone: '555-0200',
        room: null,
        country: 'United States',
        moveInDate: null,
        moveOutDate: null,
        notes: 'Main donor organization. Contact Pastor Mike.',
        active: true,
        tags: ['donor']
    },
];

const demoItems = [
    { id: '1', name: 'Toilet Paper', icon: '🧻', currentStock: 12 },
    { id: '2', name: 'Paper Towels', icon: '🧻', currentStock: 6 },
    { id: '3', name: 'Dish Soap', icon: '🧴', currentStock: 2 },
    { id: '4', name: 'Laundry Detergent', icon: '🧺', currentStock: 1 },
    { id: '5', name: 'Hand Soap', icon: '🧼', currentStock: 4 },
    { id: '6', name: 'Trash Bags', icon: '🗑️', currentStock: 20 },
    { id: '7', name: 'Sponges', icon: '🧽', currentStock: 5 },
    { id: '8', name: 'All-Purpose Cleaner', icon: '🧹', currentStock: 2 },
];

const demoLogs = [
    { id: '1', residentName: 'Alex', itemName: 'Toilet Paper', action: 'used', quantity: 1, timestamp: new Date(Date.now() - 3600000) },
    { id: '2', residentName: 'Jordan', itemName: 'Dish Soap', action: 'restocked', quantity: 3, timestamp: new Date(Date.now() - 7200000) },
    { id: '3', residentName: 'Sam', itemName: 'Trash Bags', action: 'used', quantity: 2, timestamp: new Date(Date.now() - 86400000) },
];

export function useFirestore() {
    const [residents, setResidents] = useState([]);
    const [items, setItems] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        // Check if Firebase is configured
        if (!isFirebaseConfigured()) {
            console.log('Firebase not configured, using demo data');
            setIsDemo(true);
            setResidents(demoResidents);
            setItems(demoItems);
            setLogs(demoLogs);
            setLoading(false);
            return;
        }

        setLoading(true);

        // Subscribe to residents
        const unsubResidents = onSnapshot(
            query(residentsRef, orderBy('firstName')),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setResidents(data);
            },
            (err) => {
                console.error('Error fetching residents:', err);
                setError(err.message);
            }
        );

        // Subscribe to items
        const unsubItems = onSnapshot(
            query(itemsRef, orderBy('name')),
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setItems(data);
            },
            (err) => {
                console.error('Error fetching items:', err);
                setError(err.message);
            }
        );

        // Subscribe to logs (last 100)
        const unsubLogs = onSnapshot(
            query(logsRef, orderBy('timestamp', 'desc')),
            (snapshot) => {
                const data = snapshot.docs.map(doc => {
                    const docData = doc.data();
                    return {
                        id: doc.id,
                        ...docData,
                        timestamp: docData.timestamp?.toDate() || new Date()
                    };
                });
                setLogs(data);
                setLoading(false);
            },
            (err) => {
                console.error('Error fetching logs:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => {
            unsubResidents();
            unsubItems();
            unsubLogs();
        };
    }, []);

    // Add a log entry
    const addLog = async (residentId, residentName, itemId, itemName, action, quantity, customDate = null) => {
        if (isDemo) {
            const newLog = {
                id: Date.now().toString(),
                residentId,
                residentName,
                itemId,
                itemName,
                action,
                quantity,
                timestamp: customDate || new Date()
            };
            setLogs(prev => [newLog, ...prev]);

            // Update item stock in demo mode
            if (action === 'used') {
                setItems(prev => prev.map(item =>
                    item.id === itemId
                        ? { ...item, currentStock: Math.max(0, item.currentStock - quantity) }
                        : item
                ));
            } else if (action === 'restocked') {
                setItems(prev => prev.map(item =>
                    item.id === itemId
                        ? { ...item, currentStock: item.currentStock + quantity }
                        : item
                ));
            }
            return;
        }

        try {
            await addDoc(logsRef, {
                residentId,
                residentName,
                itemId,
                itemName,
                action,
                quantity,
                timestamp: customDate || serverTimestamp()
            });

            // Update item stock
            const itemRef = doc(db, 'items', itemId);
            const item = items.find(i => i.id === itemId);
            if (item) {
                const newStock = action === 'used'
                    ? Math.max(0, item.currentStock - quantity)
                    : item.currentStock + quantity;
                await updateDoc(itemRef, { currentStock: newStock });
            }
        } catch (err) {
            console.error('Error adding log:', err);
            throw err;
        }
    };

    // Add a resident
    const addResident = async (profile) => {
        const residentData = {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            phone: profile.phone || '',
            room: profile.room || '',
            country: profile.country || '',
            moveInDate: profile.moveInDate || null,
            moveOutDate: profile.moveOutDate || null,
            notes: profile.notes || '',
            active: true,
            tags: profile.tags || ['resident']
        };

        if (isDemo) {
            const newResident = { id: Date.now().toString(), ...residentData };
            setResidents(prev => [...prev, newResident].sort((a, b) =>
                `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
            ));
            return;
        }

        try {
            await addDoc(residentsRef, { ...residentData, createdAt: serverTimestamp() });
        } catch (err) {
            console.error('Error adding resident:', err);
            throw err;
        }
    };

    // Remove a resident
    const removeResident = async (id) => {
        if (isDemo) {
            setResidents(prev => prev.filter(r => r.id !== id));
            return;
        }

        try {
            await deleteDoc(doc(db, 'residents', id));
        } catch (err) {
            console.error('Error removing resident:', err);
            throw err;
        }
    };

    // Update a resident
    const updateResident = async (id, updates) => {
        if (isDemo) {
            setResidents(prev => prev.map(r =>
                r.id === id ? { ...r, ...updates } : r
            ).sort((a, b) =>
                `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
            ));
            return;
        }

        try {
            await updateDoc(doc(db, 'residents', id), updates);
        } catch (err) {
            console.error('Error updating resident:', err);
            throw err;
        }
    };

    // Add an item
    const addItem = async (name, icon) => {
        if (isDemo) {
            const newItem = { id: Date.now().toString(), name, icon, currentStock: 0 };
            setItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
            return;
        }

        try {
            await addDoc(itemsRef, { name, icon, currentStock: 0, createdAt: serverTimestamp() });
        } catch (err) {
            console.error('Error adding item:', err);
            throw err;
        }
    };

    // Remove an item
    const removeItem = async (id) => {
        if (isDemo) {
            setItems(prev => prev.filter(i => i.id !== id));
            return;
        }

        try {
            await deleteDoc(doc(db, 'items', id));
        } catch (err) {
            console.error('Error removing item:', err);
            throw err;
        }
    };

    // Update an item
    const updateItem = async (id, updates) => {
        if (isDemo) {
            setItems(prev => prev.map(i =>
                i.id === id ? { ...i, ...updates } : i
            ).sort((a, b) => a.name.localeCompare(b.name)));
            return;
        }

        try {
            await updateDoc(doc(db, 'items', id), updates);
        } catch (err) {
            console.error('Error updating item:', err);
            throw err;
        }
    };

    // Delete a log entry
    const deleteLog = async (id) => {
        const logToDelete = logs.find(log => log.id === id);
        if (!logToDelete) return;

        if (isDemo) {
            setLogs(prev => prev.filter(log => log.id !== id));
            // Reverse stock change
            if (logToDelete.itemId) {
                setItems(prev => prev.map(item =>
                    item.id === logToDelete.itemId
                        ? {
                            ...item,
                            currentStock: logToDelete.action === 'used'
                                ? item.currentStock + logToDelete.quantity
                                : Math.max(0, item.currentStock - logToDelete.quantity)
                        }
                        : item
                ));
            }
            return;
        }

        try {
            await deleteDoc(doc(db, 'logs', id));
            // Update live stock
            const itemRef = doc(db, 'items', logToDelete.itemId);
            const item = items.find(i => i.id === logToDelete.itemId);
            if (item) {
                const newStock = logToDelete.action === 'used'
                    ? item.currentStock + logToDelete.quantity
                    : Math.max(0, item.currentStock - logToDelete.quantity);
                await updateDoc(itemRef, { currentStock: newStock });
            }
        } catch (err) {
            console.error('Error deleting log:', err);
            throw err;
        }
    };

    // Update a log entry
    const updateLog = async (id, updates) => {
        const oldLog = logs.find(log => log.id === id);
        if (!oldLog) return;

        if (isDemo) {
            setLogs(prev => prev.map(log =>
                log.id === id ? { ...log, ...updates } : log
            ));

            // Sync stock if quantity or action changed
            if (updates.quantity !== undefined || updates.action !== undefined) {
                const newQuantity = updates.quantity !== undefined ? updates.quantity : oldLog.quantity;
                const newAction = updates.action !== undefined ? updates.action : oldLog.action;

                // First reverse the old log's impact
                let netChange = 0;
                if (oldLog.action === 'used') netChange += oldLog.quantity;
                else if (oldLog.action === 'restocked') netChange -= oldLog.quantity;

                // Then apply the new log's impact
                if (newAction === 'used') netChange -= newQuantity;
                else if (newAction === 'restocked') netChange += newQuantity;

                if (netChange !== 0) {
                    setItems(prev => prev.map(item =>
                        item.id === oldLog.itemId
                            ? { ...item, currentStock: Math.max(0, item.currentStock + netChange) }
                            : item
                    ));
                }
            }
            return;
        }

        try {
            await updateDoc(doc(db, 'logs', id), updates);

            // Sync live stock if quantity or action changed
            if (updates.quantity !== undefined || updates.action !== undefined) {
                const item = items.find(i => i.id === oldLog.itemId);
                if (item) {
                    const newQuantity = updates.quantity !== undefined ? updates.quantity : oldLog.quantity;
                    const newAction = updates.action !== undefined ? updates.action : oldLog.action;

                    let netChange = 0;
                    if (oldLog.action === 'used') netChange += oldLog.quantity;
                    else if (oldLog.action === 'restocked') netChange -= oldLog.quantity;

                    if (newAction === 'used') netChange -= newQuantity;
                    else if (newAction === 'restocked') netChange += newQuantity;

                    if (netChange !== 0) {
                        const itemRef = doc(db, 'items', oldLog.itemId);
                        await updateDoc(itemRef, { currentStock: Math.max(0, item.currentStock + netChange) });
                    }
                }
            }
        } catch (err) {
            console.error('Error updating log:', err);
            throw err;
        }
    };

    // Restock an item
    const restockItem = async (itemId, itemName, quantity, residentId, residentName, customDate = null) => {
        await addLog(residentId, residentName, itemId, itemName, 'restocked', quantity, customDate);
    };

    return {
        residents: residents.filter(r => r.active !== false),
        items,
        logs,
        loading,
        error,
        isDemo,
        addLog,
        addResident,
        updateResident,
        removeResident,
        addItem,
        updateItem,
        removeItem,
        deleteLog,
        updateLog,
        restockItem
    };
}
