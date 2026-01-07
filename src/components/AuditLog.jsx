import { useState } from 'react';

export default function AuditLog({ logs, loading }) {
    const formatDate = (date) => {
        if (!date) return 'Unknown';
        const d = date?.toDate ? date.toDate() : new Date(date);
        return d.toLocaleString([], {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionBadge = (action) => {
        const styles = {
            'log-used': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'log-restocked': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'created-item': 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
            'updated-item': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'deleted-item': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'resident-added': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'resident-updated': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            'resident-removed': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
            'usage-log-edited': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'usage-log-deleted': 'bg-black text-white dark:bg-white dark:text-black',
            'stock-updated': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
        };
        return styles[action] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'log-used': return '📉';
            case 'log-restocked': return '📦';
            case 'created-item': return '✨';
            case 'updated-item': return '📝';
            case 'deleted-item': return '🗑️';
            case 'resident-added': return '🏠';
            case 'resident-updated': return '👤';
            case 'resident-removed': return '👋';
            case 'usage-log-edited': return '🔨';
            case 'usage-log-deleted': return '❌';
            case 'stock-updated': return '🔄';
            default: return '📋';
        }
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
                <div className="text-6xl mb-4">🛡️</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Security Log Empty
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    System-wide actions will be recorded here
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4 px-1">
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Immutable Audit Trail</span>
                <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            </div>

            {logs.map((log, index) => (
                <div
                    key={log.id}
                    className="bg-white/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-3 rounded-xl animate-fade-in"
                    style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
                >
                    <div className="flex items-start gap-3">
                        <div className="text-xl mt-0.5">{getActionIcon(log.action)}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter ${getActionBadge(log.action)}`}>
                                    {log.action.replace(/-/g, ' ')}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                                    {formatDate(log.date)}
                                </span>
                            </div>

                            <div className="mt-1.5 text-sm text-gray-900 dark:text-white flex flex-wrap items-center gap-x-1">
                                <span className="font-bold">{log.performedByName}</span>
                                <span className="text-gray-500 dark:text-gray-400">performed</span>
                                <span className="underline decoration-primary-500/30 underline-offset-2">{log.action.split('-').pop()}</span>
                                {log.itemName && <span>on <span className="font-semibold">{log.itemName}</span></span>}
                                {log.residentName && <span>for <span className="font-semibold">{log.residentName}</span></span>}
                                {log.quantity > 0 && <span>({log.quantity})</span>}
                            </div>

                            {log.updates && (
                                <div className="mt-1 flex gap-1 flex-wrap">
                                    {log.updates.map(field => (
                                        <span key={field} className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1 rounded">
                                            {field}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {log.fieldsModified && (
                                <div className="mt-1 text-[10px] text-orange-500">
                                    Modified: {log.fieldsModified.join(', ')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
