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
    getDoc,
    serverTimestamp,
    writeBatch,
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

        // Get current stock first to save in log
        const item = items.find(i => i.id === itemId);
        let newStock = item?.currentStock || 0;

        if (item) {
            if (action === 'used') {
                newStock = Math.max(0, item.currentStock - parseInt(qty));
            } else if (action === 'restocked') {
                newStock = item.currentStock + parseInt(qty);
            }
        }

        const logsRef = collection(db, 'inventories', currentInventoryId, 'logs');
        const logDoc = {
            residentId: resId,
            residentName: resName,
            itemId,
            itemName,
            action,
            quantity: parseInt(qty),
            newStock, // Save the NEW stock level in the log for history tracking
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
            quantity: qty,
            newStock
        });

        // Update item stock
        if (item) {
            const itemDocRef = doc(db, 'inventories', currentInventoryId, 'items', itemId);
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
                newStock,
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

    // Delete item (owner only) - soft delete to preserve history
    const deleteItem = async (itemId) => {
        if (!permissions?.canDelete) {
            console.warn('Permission denied: Only the owner can delete items');
            return;
        }

        const item = items.find(i => i.id === itemId);
        const itemName = item?.name || 'Item';
        const itemDocRef = doc(db, 'inventories', currentInventoryId, 'items', itemId);

        // Soft delete: mark as deleted instead of removing
        await updateDoc(itemDocRef, {
            deleted: true,
            deletedAt: new Date()
        });

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
            residentName: resName,
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

        if (!logEntry || !logEntry.itemId) return;

        // TIMELINE RECALCULATION APPROACH
        // 1. Get all logs for this item, sorted by date
        const itemLogs = logs
            .filter(l => l.itemId === logEntry.itemId)
            .sort((a, b) => {
                const dateA = a.date || a.timestamp || new Date(0);
                const dateB = b.date || b.timestamp || new Date(0);
                return dateA - dateB;
            });

        // 2. Find the index of the edited log
        const editedIndex = itemLogs.findIndex(l => l.id === logId);
        if (editedIndex === -1) return;

        // 3. Replay timeline UP TO the edited log to get "before" stock
        let stockBeforeEdit = 0;
        for (let i = 0; i < editedIndex; i++) {
            const log = itemLogs[i];
            if (log.action === 'used' || log.action === 'consume') {
                stockBeforeEdit = Math.max(0, stockBeforeEdit - (log.quantity || 0));
            } else if (log.action === 'restocked' || log.action === 'restock') {
                stockBeforeEdit += (log.quantity || 0);
            }
        }

        // 4. Apply the EDITED log with NEW values
        const newQty = updates.quantity !== undefined ? updates.quantity : logEntry.quantity;
        const newAction = updates.action !== undefined ? updates.action : logEntry.action;

        let stockAfterEdit = stockBeforeEdit;
        if (newAction === 'used' || newAction === 'consume') {
            stockAfterEdit = Math.max(0, stockAfterEdit - newQty);
        } else if (newAction === 'restocked' || newAction === 'restock') {
            stockAfterEdit += newQty;
        }

        // 5. Recalculate all SUBSEQUENT logs
        const logsToUpdate = [];
        let runningStock = stockAfterEdit;

        for (let i = editedIndex + 1; i < itemLogs.length; i++) {
            const log = itemLogs[i];
            if (log.action === 'used' || log.action === 'consume') {
                runningStock = Math.max(0, runningStock - (log.quantity || 0));
            } else if (log.action === 'restocked' || log.action === 'restock') {
                runningStock += (log.quantity || 0);
            }

            logsToUpdate.push({
                id: log.id,
                newStock: runningStock
            });
        }

        // Handle date field conversion if provided (preprocessing)
        if (updates.date) {
            // If it's already a valid Date object, use it
            if (updates.date instanceof Date && !isNaN(updates.date.getTime())) {
                updates.date = updates.date;
            }
            // If it's a Firestore timestamp with toDate(), convert it
            else if (updates.date?.toDate && typeof updates.date.toDate === 'function') {
                updates.date = updates.date.toDate();
            }
            // If it's a string, parse it carefully
            else if (typeof updates.date === 'string') {
                const parsedDate = new Date(updates.date);
                if (!isNaN(parsedDate.getTime())) {
                    updates.date = parsedDate;
                } else {
                    // If string parsing failed, remove it
                    console.warn('Could not parse date string:', updates.date);
                    delete updates.date;
                }
            }
        }

        // 6. Batch update all affected logs + item stock
        const batch = writeBatch(db);

        // Update the edited log
        batch.update(logRef, {
            ...updates,
            newStock: stockAfterEdit,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid
        });

        // Update all subsequent logs
        for (const logUpdate of logsToUpdate) {
            batch.update(
                doc(db, 'inventories', currentInventoryId, 'logs', logUpdate.id),
                { newStock: logUpdate.newStock }
            );
        }

        // Update item's current stock
        const itemRef = doc(db, 'inventories', currentInventoryId, 'items', logEntry.itemId);
        batch.update(itemRef, {
            currentStock: runningStock,
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid
        });

        await batch.commit();


        // Audit the fact that a history entry was modified
        await addAuditEntry('usage-log-edited', {
            logId,
            itemName: logEntry?.itemName || 'Unknown',
            residentName: updates.residentName || logEntry?.residentName || 'Unknown',
            originalQuantity: logEntry.quantity,
            newQuantity: newQty,
            originalAction: logEntry.action,
            newAction: newAction,
            affectedLogsCount: logsToUpdate.length + 1,
            fieldsModified: Object.keys(updates)
        });
    };

    // Delete log (Usage History only - but Audit the deletion)
    const deleteLog = async (logId) => {
        if (!permissions?.canDelete) return;

        const logRef = doc(db, 'inventories', currentInventoryId, 'logs', logId);
        const logEntry = logs.find(l => l.id === logId);

        if (!logEntry) return;

        // Restore stock by reversing the log's action
        if (logEntry.itemId && logEntry.quantity) {
            const itemRef = doc(db, 'inventories', currentInventoryId, 'items', logEntry.itemId);
            const itemSnapshot = await getDoc(itemRef);

            if (itemSnapshot.exists()) {
                const currentStock = itemSnapshot.data().currentStock || 0;
                let newStock = currentStock;

                // Reverse the original action
                if (logEntry.action === 'used' || logEntry.action === 'consume') {
                    // Original action reduced stock, so add it back
                    newStock = currentStock + logEntry.quantity;
                } else if (logEntry.action === 'restocked' || logEntry.action === 'restock') {
                    // Original action increased stock, so subtract it
                    newStock = currentStock - logEntry.quantity;
                }

                await updateDoc(itemRef, {
                    currentStock: Math.max(0, newStock),
                    updatedAt: serverTimestamp(),
                    updatedBy: user?.uid
                });
            }
        }

        // Delete the log
        await deleteDoc(logRef);

        // Audit the fact that a history entry was DELETED
        await addAuditEntry('usage-log-deleted', {
            logId,
            itemName: logEntry?.itemName || 'Unknown',
            residentName: logEntry?.residentName || 'Unknown',
            quantity: logEntry?.quantity,
            stockRestored: logEntry.quantity
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
