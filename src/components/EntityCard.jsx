import { useMemo } from 'react';

export default function EntityCard({ entity, onClick }) {
    const { name, type, totalUses, activityLevel, lastActive, avatar } = entity;

    const typeConfig = {
        resident: {
            label: '🏠 Resident',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-800',
            textColor: 'text-blue-600 dark:text-blue-400'
        },
        common_area: {
            label: '📍 Common Area',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            borderColor: 'border-emerald-200 dark:border-emerald-800',
            textColor: 'text-emerald-600 dark:text-emerald-400'
        },
        staff: {
            label: '👔 Staff',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            borderColor: 'border-purple-200 dark:border-purple-800',
            textColor: 'text-purple-600 dark:text-purple-400'
        },
        donor: {
            label: '💝 Donor',
            bgColor: 'bg-pink-50 dark:bg-pink-900/20',
            borderColor: 'border-pink-200 dark:border-pink-800',
            textColor: 'text-pink-600 dark:text-pink-400'
        }
    };

    const config = typeConfig[type] || typeConfig.resident;

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

    return (
        <div
            onClick={onClick}
            className={`p-5 rounded-2xl border-2 ${config.borderColor} ${config.bgColor} hover:scale-[1.02] transition-all cursor-pointer`}
        >
            {/* Avatar */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-14 h-14 rounded-full ${config.textColor} bg-white dark:bg-gray-800 flex items-center justify-center text-2xl font-black border-2 ${config.borderColor}`}>
                    {avatar || name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white truncate">
                        {name}
                    </h3>
                    <p className={`text-xs font-semibold ${config.textColor}`}>
                        {config.label}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total uses:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{totalUses || 0}</span>
                </div>

                {/* Activity Level */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Activity:</span>
                    <div className="flex gap-1">
                        {activityBars.map((filled, i) => (
                            <div
                                key={i}
                                className={`w-2 h-4 rounded ${filled
                                        ? `${config.textColor.replace('text-', 'bg-')}`
                                        : 'bg-gray-200 dark:bg-gray-700'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Last Active */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Last active: {formatLastActive(lastActive)}
                    </span>
                </div>
            </div>
        </div>
    );
}
