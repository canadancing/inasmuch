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
    const inventory = useInventory();
    const currentInventoryId = inventory.currentInventoryId;
    const permissions = inventory.permissions;

    const [items, setItems] = useState([]);
    const [residents, setResidents] = useState([]);
    const [logs, setLogs] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isDemo = !currentInventoryId;

    // Fetch all users (Super Admin only - but we'll fetch always for permissions view)
    useEffect(() => {
        if (!user) return;

        const usersRef = collection(db, 'users');
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        });

        return () => unsubscribe();
    }, [user]);

    // Update user role
    const updateUserRole = async (userId, newRole) => {
        if (user?.email !== 'loading800@gmail.com') { // Hardcoded super-admin check for now
            console.warn('Unauthorized role change attempt');
            return;
        }

        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            role: newRole,
            updatedAt: serverTimestamp()
        });

        await addAuditEntry('role-updated', {
            targetUserId: userId,
            newRole
        });
    };

    // Fetch items from current inventory
    useEffect(() => {
        // ... rest of the effects ...
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

    // Fetch audit logs (Immutable Trail)
    useEffect(() => {
        if (!currentInventoryId) return;

        const auditRef = collection(db, 'inventories', currentInventoryId, 'audit');
        const auditQuery = query(auditRef, orderBy('date', 'desc'));

        const unsubscribe = onSnapshot(auditQuery, (snapshot) => {
            const auditList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAuditLogs(auditList);
        });

        return () => unsubscribe();
    }, [currentInventoryId]);
    // Helper: Add Audit Entry (Immutable)
    const addAuditEntry = async (action, details = {}) => {
        if (!currentInventoryId) return;

        try {
            const auditRef = collection(db, 'inventories', currentInventoryId, 'audit');
            await addDoc(auditRef, {
                action,
                performedBy: user?.uid,
                performedByName: user?.displayName || 'Unknown',
                date: serverTimestamp(),
                ...details
            });
        } catch (error) {
            console.error('Audit failed:', error);
        }
    };

    // Add log (with permission check)
    const addLog = async (resId, resName, itemId, itemName, action, qty, date) => {
        if (!permissions?.canEdit) {
            console.warn('Permission denied: You do not have edit access');
            return;
        }

        const logsRef = collection(db, 'inventories', currentInventoryId, 'logs');
        const logDoc = {
            residentId: resId,
            residentName: resName,
            itemId,
            itemName,
            action,
            quantity: parseInt(qty),
            date: date instanceof Date ? date : (date?.toDate ? date.toDate() : new Date(date)),
            performedBy: user?.uid,
            performedByName: user?.displayName || 'Unknown'
        };

        const docRef = await addDoc(logsRef, logDoc);

        // ALWAYS duplicate to immutable Audit Trail
        await addAuditEntry(`log-${action}`, {
            logId: docRef.id,
            residentName: resName,
            itemName,
            quantity: qty
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

            // Track stock change in audit
            await addAuditEntry('stock-updated', {
                itemId,
                itemName,
                action,
                quantity: qty,
                note: `Stock auto-adjusted via usage log`
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

        // Log this action in Audit Trail
        await addAuditEntry('created-item', {
            itemId: docRef.id,
            itemName: name,
            icon
        });
    };

    // Update item (with permission check)
    const updateItem = async (itemId, updates) => {
        if (!permissions?.canEdit) {
            console.warn('Permission denied');
            return;
        }

        const itemDocRef = doc(db, 'inventories', currentInventoryId, 'items', itemId);
        const updateData = {
            ...updates,
            updatedAt: serverTimestamp(),
        };
        if (user?.uid) {
            updateData.updatedBy = user.uid;
        }

        await updateDoc(itemDocRef, updateData);

        // Log this action in Audit Trail
        const itemName = updates.name || items.find(i => i.id === itemId)?.name || 'Item';
        await addAuditEntry('updated-item', {
            itemId,
            itemName,
            updates: Object.keys(updates)
        });
    };

    // Delete item (owner only)
    const deleteItem = async (itemId) => {
        if (!permissions?.canDelete) {
            console.warn('Permission denied: Only the owner can delete items');
            return;
        }

        const item = items.find(i => i.id === itemId);
        const itemName = item?.name || 'Item';
        const itemDocRef = doc(db, 'inventories', currentInventoryId, 'items', itemId);
        await deleteDoc(itemDocRef);

        // Log this action in Audit Trail
        await addAuditEntry('deleted-item', {
            itemId,
            itemName
        });
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

        // Log this action in Audit Trail
        const resName = `${residentData.firstName} ${residentData.lastName}`.trim();
        await addAuditEntry('resident-added', {
            residentId: docRef.id,
            residentName: resName
        });
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

        // Log this action in Audit Trail
        const resName = updates.firstName ? `${updates.firstName} ${updates.lastName || ''}`.trim() : (residents.find(r => r.id === residentId)?.firstName || 'Resident');
        await addAuditEntry('resident-updated', {
            residentId,
            residentName,
            updates: Object.keys(updates)
        });
    };

    // Delete resident (owner only)
    const deleteResident = async (residentId) => {
        if (!permissions?.canDelete) {
            console.warn('Permission denied: Only the owner can delete residents');
            return;
        }

        const res = residents.find(r => r.id === residentId);
        const resName = res ? `${res.firstName} ${res.lastName}`.trim() : 'Resident';
        const residentDocRef = doc(db, 'inventories', currentInventoryId, 'residents', residentId);
        await deleteDoc(residentDocRef);

        // Log this action in Audit Trail
        await addAuditEntry('resident-removed', {
            residentId,
            residentName
        });
    };

    // Update log (Usage History only - but Audit the edit)
    const updateLog = async (logId, updates) => {
        if (!permissions?.canEdit) return;

        const logRef = doc(db, 'inventories', currentInventoryId, 'logs', logId);
        const logEntry = logs.find(l => l.id === logId);

        await updateDoc(logRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid
        });

        // Audit the fact that a history entry was modified
        await addAuditEntry('usage-log-edited', {
            logId,
            itemName: logEntry?.itemName || 'Unknown',
            residentName: logEntry?.residentName || 'Unknown',
            originalQuantity: logEntry?.quantity,
            newQuantity: updates.quantity,
            fieldsModified: Object.keys(updates)
        });
    };

    // Delete log (Usage History only - but Audit the deletion)
    const deleteLog = async (logId) => {
        if (!permissions?.canDelete) return;

        const logRef = doc(db, 'inventories', currentInventoryId, 'logs', logId);
        const logEntry = logs.find(l => l.id === logId);

        await deleteDoc(logRef);

        // Audit the fact that a history entry was DELETED
        await addAuditEntry('usage-log-deleted', {
            logId,
            itemName: logEntry?.itemName || 'Unknown',
            residentName: logEntry?.residentName || 'Unknown',
            quantity: logEntry?.quantity
        });
    };

    // Restock item (with permission check)
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
        auditLogs,
        loading,
        error,
        isDemo,
        addLog,
        updateLog,
        deleteLog,
        addItem,
        updateItem,
        deleteItem,
        addResident,
        updateResident,
        deleteResident,
        restockItem,
        updateUserRole,
        users
    };
}
