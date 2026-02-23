import { useMemo } from 'react';
import RoleBadge from './RoleBadge';

export default function EntityCard({ entity, onClick, viewMode = 'analytics', onMoveOut, onReactivate }) {
    const { name, primaryRole, totalUses, activityLevel, lastActive, avatar, expectedDepartureDate, status } = entity;

    // Activity bar calculation (0-5 bars based on level)
    const activityBars = useMemo(() => {
        const levels = { high: 5, medium: 3, low: 1 };
        const barCount = levels[activityLevel] || 0;
        return Array(5).fill(false).map((_, i) => i < barCount);
    }, [activityLevel]);

    // Format last active
    const formatLastActive = (date) => {
        if (!date) return 'Never';
        const now = new Date();
        const diff = now - new Date(date);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(date).toLocaleDateString();
    };

    // Format expected departure date
    const formatDepartureDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

        if (diff < 0) return `Left ${Math.abs(diff)}d ago`;
        if (diff === 0) return 'Leaving today';
        if (diff === 1) return 'Leaving tomorrow';
        if (diff <= 7) return `Leaving in ${diff} days`;
        return `Leaving ${date.toLocaleDateString()}`;
    };

    // Determine card styling based on role category
    const isLocation = ['common', 'bathroom', 'bedroom', 'utility', 'outdoor'].includes(primaryRole);
    const borderColor = isLocation
        ? 'border-purple-200 dark:border-purple-800'
        : 'border-blue-200 dark:border-blue-800';
    const bgColor = isLocation
        ? 'bg-purple-50 dark:bg-purple-900/20'
        : 'bg-blue-50 dark:bg-blue-900/20';

    const isMovedOut = status === 'moved_out';

    return (
        <div
            className={`p-3 rounded-xl border-2 ${borderColor} ${bgColor} hover:scale-[1.02] transition-all cursor-pointer relative`}
        >
            {/* Archive/Restore Action - Absolute Top Right */}
            {isMovedOut ? (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onReactivate?.();
                    }}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors z-10"
                    title="Reactivate Entity"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                </button>
            ) : (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoveOut?.();
                    }}
                    className="absolute top-3 right-3 p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors z-10"
                    title="Archive / Move Out"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                </button>
            )}

            {/* Avatar and Name - Always Clickable */}
            <div
                className="flex items-center gap-2 mb-3"
                onClick={onClick}
            >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-lg border-2 ${borderColor}`}>
                    {avatar || name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-base font-black text-gray-900 dark:text-white truncate">
                        {name}
                    </h3>
                    <div className="mt-0.5">
                        <RoleBadge role={primaryRole} size="sm" />
                    </div>
                </div>
            </div>

            {/* Expected Departure Date - for temporary/guest */}
            {expectedDepartureDate && (primaryRole === 'guest' || primaryRole === 'temporary') && (
                <div className="mb-2 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-center gap-1">
                        <span className="text-sm">📅</span>
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                            {formatDepartureDate(expectedDepartureDate)}
                        </span>
                    </div>
                </div>
            )}

            {/* Stats - Always Clickable */}
            <div
                className="space-y-1.5"
                onClick={onClick}
            >
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Total uses:</span>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{totalUses || 0}</span>
                </div>

                {/* Activity Level */}
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Activity:</span>
                    <div className="flex gap-1">
                        {activityBars.map((filled, i) => (
                            <div
                                key={i}
                                className={`w-1.5 h-3 rounded ${filled
                                    ? isLocation
                                        ? 'bg-purple-500 dark:bg-purple-400'
                                        : 'bg-blue-500 dark:bg-blue-400'
                                    : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Last Active */}
                <div className="pt-1.5 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Last: {formatLastActive(lastActive)}
                    </span>
                </div>
            </div>
        </div>
    );
}
