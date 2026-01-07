// Data Management section for backup and restore
import { useState, useRef } from 'react';
import { useBackup } from '../hooks/useBackup';
import { useInventory } from '../context/InventoryContext';

export default function DataManagement({ user }) {
    const { currentInventory, currentInventoryId } = useInventory();
    const {
        isExporting,
        isImporting,
        localBackups,
        lastAutoBackup,
        exportBackup,
        importFromFile,
        restoreFromLocal,
        previewFile
    } = useBackup(currentInventoryId, currentInventory?.name, user);

    const [showImportModal, setShowImportModal] = useState(false);
    const [showLocalBackups, setShowLocalBackups] = useState(false);
    const [importPreview, setImportPreview] = useState(null);
    const [importMode, setImportMode] = useState('merge');
    const [importResult, setImportResult] = useState(null);
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        const result = await exportBackup();
        if (result.success) {
            alert(`✅ Backup saved as ${result.filename}`);
        } else {
            alert(`❌ Export failed: ${result.error}`);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const preview = await previewFile(file);
        setImportPreview({ ...preview, file });
        setShowImportModal(true);
        setImportResult(null);
    };

    const handleImport = async () => {
        if (!importPreview?.file) return;

        const result = await importFromFile(importPreview.file, importMode);
        setImportResult(result);

        if (result.success) {
            setTimeout(() => {
                setShowImportModal(false);
                setImportPreview(null);
                setImportResult(null);
                window.location.reload(); // Refresh to show imported data
            }, 2000);
        }
    };

    const handleRestoreLocal = async (backupId) => {
        if (!confirm('Restore from this backup? This will merge with your current data.')) return;

        const result = await restoreFromLocal(backupId, 'merge');
        if (result.success) {
            alert('✅ Restored successfully!');
            window.location.reload();
        } else {
            alert(`❌ Restore failed: ${result.error}`);
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatTimeAgo = (date) => {
        if (!date) return 'Never';
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>💾</span> Data Management
                </h3>
                {lastAutoBackup && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Auto-saved {formatTimeAgo(lastAutoBackup)}
                    </span>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Export */}
                <button
                    onClick={handleExport}
                    disabled={isExporting || !currentInventoryId}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold transition-colors"
                >
                    {isExporting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <span>📥</span> Export Backup
                        </>
                    )}
                </button>

                {/* Import */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isImporting || !currentInventoryId}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold transition-colors"
                >
                    <span>📤</span> Restore from File
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Local Backups */}
                <button
                    onClick={() => setShowLocalBackups(!showLocalBackups)}
                    disabled={!currentInventoryId}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold transition-colors"
                >
                    <span>🔄</span> Local Backups ({localBackups.length})
                </button>
            </div>

            {/* Local Backups List */}
            {showLocalBackups && (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Auto-saved Backups (Browser Storage)
                    </h4>
                    {localBackups.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No local backups yet. Backups are saved automatically every 5 minutes.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {localBackups.map((backup) => (
                                <div
                                    key={backup.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-700"
                                >
                                    <div>
                                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                                            {formatDate(backup.timestamp)}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {backup.backup?.data?.items?.length || 0} items,{' '}
                                            {backup.backup?.data?.residents?.length || 0} residents
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRestoreLocal(backup.id)}
                                        disabled={isImporting}
                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                    >
                                        Restore
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Restore from Backup
                        </h3>

                        {importPreview && (
                            <>
                                {importPreview.isValid ? (
                                    <div className="space-y-4">
                                        {/* Backup Info */}
                                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                <p><strong>Inventory:</strong> {importPreview.inventory?.name}</p>
                                                <p><strong>Exported:</strong> {new Date(importPreview.exportedAt).toLocaleString()}</p>
                                                <p><strong>By:</strong> {importPreview.exportedBy?.email}</p>
                                            </div>
                                        </div>

                                        {/* Summary */}
                                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                                                Will import:
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700 dark:text-blue-300">
                                                <span>📦 {importPreview.summary?.items || 0} items</span>
                                                <span>👤 {importPreview.summary?.residents || 0} residents</span>
                                                <span>📋 {importPreview.summary?.usageLogs || 0} logs</span>
                                                <span>🎨 {importPreview.summary?.customIcons || 0} icons</span>
                                            </div>
                                        </div>

                                        {/* Import Mode */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Import Mode
                                            </label>
                                            <div className="flex gap-3">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        value="merge"
                                                        checked={importMode === 'merge'}
                                                        onChange={(e) => setImportMode(e.target.value)}
                                                        className="text-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        Merge (keep existing)
                                                    </span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        value="replace"
                                                        checked={importMode === 'replace'}
                                                        onChange={(e) => setImportMode(e.target.value)}
                                                        className="text-red-500"
                                                    />
                                                    <span className="text-sm text-gray-900 dark:text-white">
                                                        Replace (delete existing)
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Result */}
                                        {importResult && (
                                            <div className={`p-3 rounded-lg ${importResult.success
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                                }`}>
                                                {importResult.success
                                                    ? '✅ Import successful! Refreshing...'
                                                    : `❌ ${importResult.error}`
                                                }
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                        <div className="text-red-700 dark:text-red-300">
                                            ❌ Invalid backup file
                                        </div>
                                        <ul className="text-sm text-red-600 dark:text-red-400 mt-2 list-disc list-inside">
                                            {importPreview.errors?.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowImportModal(false);
                                    setImportPreview(null);
                                    setImportResult(null);
                                }}
                                className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                Cancel
                            </button>
                            {importPreview?.isValid && (
                                <button
                                    onClick={handleImport}
                                    disabled={isImporting}
                                    className="flex-1 px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50"
                                >
                                    {isImporting ? 'Importing...' : 'Import'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
