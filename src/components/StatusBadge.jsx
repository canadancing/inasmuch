export default function StatusBadge({ status }) {
    const config = {
        active: {
            label: 'Active',
            emoji: '✅',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
            textColor: 'text-emerald-700 dark:text-emerald-400',
            borderColor: 'border-emerald-200 dark:border-emerald-800'
        },
        moved_out: {
            label: 'Moved Out',
            emoji: '📦',
            bgColor: 'bg-amber-50 dark:bg-amber-900/20',
            textColor: 'text-amber-700 dark:text-amber-400',
            borderColor: 'border-amber-200 dark:border-amber-800'
        },
        archived: {
            label: 'Archived',
            emoji: '📁',
            bgColor: 'bg-gray-50 dark:bg-gray-900/20',
            textColor: 'text-gray-700 dark:text-gray-400',
            borderColor: 'border-gray-200 dark:border-gray-700'
        }
    };

    const effectiveStatus = status || 'active';
    const { label, emoji, bgColor, textColor, borderColor } = config[effectiveStatus] || config.active;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${bgColor} ${textColor} ${borderColor}`}>
            <span>{emoji}</span>
            {label}
        </span>
    );
}
