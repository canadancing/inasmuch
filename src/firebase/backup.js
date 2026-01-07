// Backup and Restore utilities for inventory data
import { collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from './config';

// Current backup format version
const BACKUP_VERSION = '1.0.0';

/**
 * Export inventory data to JSON
 */
export async function exportInventoryBackup(inventoryId, inventoryName, user) {
    if (!inventoryId) throw new Error('No inventory selected');

    const backup = {
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        exportedBy: {
            uid: user?.uid || 'anonymous',
            email: user?.email || 'unknown'
        },
        inventory: {
            id: inventoryId,
            name: inventoryName || 'Unknown Inventory'
        },
        data: {
            items: [],
            residents: [],
            usageLogs: [],
            customIcons: [],
            tags: []
        }
    };

    // Fetch all collections
    const collections = [
        { name: 'items', path: `inventories/${inventoryId}/items` },
        { name: 'residents', path: `inventories/${inventoryId}/residents` },
        { name: 'usageLogs', path: `inventories/${inventoryId}/usageLogs` },
        { name: 'customIcons', path: `inventories/${inventoryId}/customIcons` },
        { name: 'tags', path: `inventories/${inventoryId}/tags` }
    ];

    for (const col of collections) {
        try {
            const snapshot = await getDocs(collection(db, col.path));
            backup.data[col.name] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore Timestamps to ISO strings
                ...(doc.data().createdAt && { createdAt: doc.data().createdAt.toDate?.().toISOString() || doc.data().createdAt }),
                ...(doc.data().date && { date: doc.data().date.toDate?.().toISOString() || doc.data().date }),
                ...(doc.data().updatedAt && { updatedAt: doc.data().updatedAt.toDate?.().toISOString() || doc.data().updatedAt })
            }));
        } catch (err) {
            console.warn(`Could not fetch ${col.name}:`, err);
        }
    }

    return backup;
}

/**
 * Download backup as JSON file
 */
export function downloadBackupFile(backup) {
    const filename = `inasmuch-backup-${backup.inventory.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return filename;
}

/**
 * Validate backup file structure
 */
export function validateBackupFile(backup) {
    const errors = [];

    if (!backup.version) errors.push('Missing version field');
    if (!backup.inventory?.id) errors.push('Missing inventory info');
    if (!backup.data) errors.push('Missing data field');

    const requiredData = ['items', 'residents'];
    for (const key of requiredData) {
        if (!Array.isArray(backup.data?.[key])) {
            errors.push(`Missing or invalid ${key} array`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        summary: backup.data ? {
            items: backup.data.items?.length || 0,
            residents: backup.data.residents?.length || 0,
            usageLogs: backup.data.usageLogs?.length || 0,
            customIcons: backup.data.customIcons?.length || 0,
            tags: backup.data.tags?.length || 0
        } : null
    };
}

/**
 * Import backup data to Firestore
 * @param mode 'merge' keeps existing data, 'replace' deletes and replaces
 */
export async function importBackup(backup, targetInventoryId, mode = 'merge') {
    if (!backup?.data) throw new Error('Invalid backup data');
    if (!targetInventoryId) throw new Error('No target inventory');

    const results = {
        imported: { items: 0, residents: 0, usageLogs: 0, customIcons: 0, tags: 0 },
        errors: []
    };

    const collections = ['items', 'residents', 'usageLogs', 'customIcons', 'tags'];

    for (const colName of collections) {
        const colPath = `inventories/${targetInventoryId}/${colName}`;
        const data = backup.data[colName] || [];

        if (data.length === 0) continue;

        try {
            // If replace mode, delete existing data first
            if (mode === 'replace') {
                const existingDocs = await getDocs(collection(db, colPath));
                const deleteBatch = writeBatch(db);
                existingDocs.docs.forEach(d => deleteBatch.delete(d.ref));
                await deleteBatch.commit();
            }

            // Import data in batches of 500 (Firestore limit)
            const batchSize = 500;
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = writeBatch(db);
                const chunk = data.slice(i, i + batchSize);

                for (const item of chunk) {
                    const { id, ...docData } = item;
                    // Convert ISO strings back to Dates
                    if (docData.createdAt) docData.createdAt = new Date(docData.createdAt);
                    if (docData.date) docData.date = new Date(docData.date);
                    if (docData.updatedAt) docData.updatedAt = new Date(docData.updatedAt);

                    const docRef = doc(collection(db, colPath), id);
                    batch.set(docRef, docData, { merge: mode === 'merge' });
                }

                await batch.commit();
                results.imported[colName] += chunk.length;
            }
        } catch (err) {
            console.error(`Error importing ${colName}:`, err);
            results.errors.push(`Failed to import ${colName}: ${err.message}`);
        }
    }

    return results;
}

// IndexedDB for local auto-backups
const DB_NAME = 'inasmuch-backups';
const STORE_NAME = 'backups';
const MAX_LOCAL_BACKUPS = 5;

function openBackupDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                store.createIndex('inventoryId', 'inventoryId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

/**
 * Save backup to local IndexedDB
 */
export async function saveLocalBackup(inventoryId, backup) {
    const db = await openBackupDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        // Add new backup
        store.add({
            inventoryId,
            timestamp: Date.now(),
            backup
        });

        // Cleanup old backups (keep only MAX_LOCAL_BACKUPS)
        const index = store.index('inventoryId');
        const request = index.getAll(inventoryId);

        request.onsuccess = () => {
            const backups = request.result.sort((a, b) => b.timestamp - a.timestamp);
            const toDelete = backups.slice(MAX_LOCAL_BACKUPS);
            toDelete.forEach(b => store.delete(b.id));
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/**
 * Get local backups for an inventory
 */
export async function getLocalBackups(inventoryId) {
    const db = await openBackupDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const index = store.index('inventoryId');
        const request = index.getAll(inventoryId);

        request.onsuccess = () => {
            const backups = request.result.sort((a, b) => b.timestamp - a.timestamp);
            resolve(backups);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get a specific local backup by ID
 */
export async function getLocalBackup(backupId) {
    const db = await openBackupDB();

    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(backupId);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
