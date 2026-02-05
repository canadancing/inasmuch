// Hook for backup and restore functionality
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    exportInventoryBackup,
    downloadBackupFile,
    validateBackupFile,
    importBackup,
    saveLocalBackup,
    getLocalBackups
} from '../firebase/backup';

const AUTO_BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useBackup(inventoryId, inventoryName, user) {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [localBackups, setLocalBackups] = useState([]);
    const [lastAutoBackup, setLastAutoBackup] = useState(null);
    const autoBackupTimerRef = useRef(null);

    // Load local backups on mount
    useEffect(() => {
        if (inventoryId) {
            loadLocalBackups();
        }
    }, [inventoryId]);

    // Auto-backup timer
    useEffect(() => {
        if (!inventoryId || !user) return;

        const runAutoBackup = async () => {
            // Only run backup if user is an owner, to avoid permission errors
            // Guests might not have read access to all collections (like usageLogs)
            // which causes noisy console errors
            try {
                // If we can't determine ownership easily here, we rely on the try/catch
                // But generally, backups should probably be owner-only features
                const backup = await exportInventoryBackup(inventoryId, inventoryName, user);
                await saveLocalBackup(inventoryId, backup);
                setLastAutoBackup(new Date());
                console.log('Auto-backup saved to local storage');
            } catch (err) {
                // Suppress permission-denied errors which are expected for guests
                if (err.code === 'permission-denied' || err.message?.includes('permission')) {
                    // Silent fail for guests
                    return;
                }
                console.warn('Auto-backup failed:', err);
            }
        };

        // Run initial backup after 1 minute
        const initialTimeout = setTimeout(runAutoBackup, 60 * 1000);

        // Then run every 5 minutes
        autoBackupTimerRef.current = setInterval(runAutoBackup, AUTO_BACKUP_INTERVAL);

        return () => {
            clearTimeout(initialTimeout);
            if (autoBackupTimerRef.current) {
                clearInterval(autoBackupTimerRef.current);
            }
        };
    }, [inventoryId, inventoryName, user]);

    const loadLocalBackups = useCallback(async () => {
        if (!inventoryId) return;
        try {
            const backups = await getLocalBackups(inventoryId);
            setLocalBackups(backups);
        } catch (err) {
            console.warn('Failed to load local backups:', err);
        }
    }, [inventoryId]);

    // Export and download backup
    const exportBackup = useCallback(async () => {
        if (!inventoryId) throw new Error('No inventory selected');

        setIsExporting(true);
        try {
            const backup = await exportInventoryBackup(inventoryId, inventoryName, user);
            const filename = downloadBackupFile(backup);

            // Also save to local storage
            await saveLocalBackup(inventoryId, backup);
            await loadLocalBackups();

            return { success: true, filename };
        } catch (err) {
            console.error('Export failed:', err);
            return { success: false, error: err.message };
        } finally {
            setIsExporting(false);
        }
    }, [inventoryId, inventoryName, user, loadLocalBackups]);

    // Import from file
    const importFromFile = useCallback(async (file, mode = 'merge') => {
        if (!inventoryId) throw new Error('No inventory selected');

        setIsImporting(true);
        try {
            // Read file
            const text = await file.text();
            const backup = JSON.parse(text);

            // Validate
            const validation = validateBackupFile(backup);
            if (!validation.isValid) {
                return { success: false, error: `Invalid backup file: ${validation.errors.join(', ')}` };
            }

            // Import
            const results = await importBackup(backup, inventoryId, mode);

            return {
                success: results.errors.length === 0,
                imported: results.imported,
                errors: results.errors
            };
        } catch (err) {
            console.error('Import failed:', err);
            return { success: false, error: err.message };
        } finally {
            setIsImporting(false);
        }
    }, [inventoryId]);

    // Restore from local backup
    const restoreFromLocal = useCallback(async (backupId, mode = 'merge') => {
        if (!inventoryId) throw new Error('No inventory selected');

        setIsImporting(true);
        try {
            const localBackup = localBackups.find(b => b.id === backupId);
            if (!localBackup) {
                return { success: false, error: 'Backup not found' };
            }

            const results = await importBackup(localBackup.backup, inventoryId, mode);

            return {
                success: results.errors.length === 0,
                imported: results.imported,
                errors: results.errors
            };
        } catch (err) {
            console.error('Restore failed:', err);
            return { success: false, error: err.message };
        } finally {
            setIsImporting(false);
        }
    }, [inventoryId, localBackups]);

    // Preview file before import
    const previewFile = useCallback(async (file) => {
        try {
            const text = await file.text();
            const backup = JSON.parse(text);
            const validation = validateBackupFile(backup);

            return {
                isValid: validation.isValid,
                errors: validation.errors,
                summary: validation.summary,
                inventory: backup.inventory,
                exportedAt: backup.exportedAt,
                exportedBy: backup.exportedBy
            };
        } catch (err) {
            return { isValid: false, errors: [err.message] };
        }
    }, []);

    return {
        isExporting,
        isImporting,
        localBackups,
        lastAutoBackup,
        exportBackup,
        importFromFile,
        restoreFromLocal,
        previewFile,
        refreshLocalBackups: loadLocalBackups
    };
}
