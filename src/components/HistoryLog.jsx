import { useState } from 'react';

export default function HistoryLog({ logs, loading, onDeleteLog, onUpdateLog, residents, items }) {
    const [editingLog, setEditingLog] = useState(null);
    const [editQuantity, setEditQuantity] = useState(1);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

    const formatDate = (date) => {
        if (!date) return 'Unknown';
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getActionBadge = (action) => {
        const styles = {
            used: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            restocked: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'move-in': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'move-out': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        };
        return styles[action] || styles.used;
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'used': return '📉';
            case 'restocked': return '📦';
            case 'move-in': return '🏠';
            case 'move-out': return '👋';
            default: return '📋';
        }
    };

    const handleEdit = (log) => {
        setEditingLog(log.id);
        setEditQuantity(log.quantity || 1);
    };

    const handleSaveEdit = async (log) => {
        await onUpdateLog(log.id, { quantity: editQuantity });
        setEditingLog(null);
    };

    const handleDelete = async (logId) => {
        await onDeleteLog(logId);
        setShowDeleteConfirm(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Activity Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Logged activities will appear here
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {logs.map((log, index) => (
                <div
                    key={log.id}
                    className="card p-4 animate-fade-in"
                    style={{ animationDelay: `${Math.min(index, 10) * 50}ms` }}
                >
                    {/* Delete Confirmation */}
                    {showDeleteConfirm === log.id ? (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Delete this log entry?
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(log.id)}
                                    className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : editingLog === log.id ? (
                        /* Edit Mode */
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{getActionIcon(log.action)}</span>
                                <span className="font-medium">{log.residentName}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getActionBadge(log.action)}`}>
                                    {log.action}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500">Quantity:</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold"
                                    >
                                        −
                                    </button>
                                    <span className="w-8 text-center font-bold">{editQuantity}</span>
                                    <button
                                        onClick={() => setEditQuantity(editQuantity + 1)}
                                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                                <span className="text-sm text-gray-500">× {log.itemName}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setEditingLog(null)}
                                    className="flex-1 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSaveEdit(log)}
                                    className="flex-1 py-2 text-sm bg-primary-500 text-white rounded-lg"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Normal View */
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">{getActionIcon(log.action)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {log.residentName}
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getActionBadge(log.action)}`}>
                                        {log.action}
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                                    {log.quantity}× {log.itemName}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {formatDate(log.timestamp)}
                                </p>
                            </div>
                            {/* Edit/Delete buttons */}
                            {onDeleteLog && onUpdateLog && (
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(log)}
                                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(log.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
