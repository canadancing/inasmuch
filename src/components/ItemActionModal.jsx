export default function ItemActionModal({ item, isOpen, onClose, onRestock, onConsume, onPinItem, onShowRecords, onShowStats, onHideItem }) {
    if (!isOpen || !item) return null;

    const actions = [
        {
            label: 'Restock',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            ),
            color: 'bg-emerald-500 hover:bg-emerald-600',
            handler: () => { onClose(); onRestock?.(item); },
            show: !!onRestock
        },
        {
            label: 'Log Usage',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                </svg>
            ),
            color: 'bg-red-500 hover:bg-red-600',
            handler: () => { onClose(); onConsume?.(item); },
            show: !!onConsume
        },
        {
            label: item.isPinned ? 'Unpin' : 'Pin',
            icon: (
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
            ),
            color: item.isPinned
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-gray-500 hover:bg-amber-500',
            handler: () => { onClose(); onPinItem?.(item); },
            show: !!onPinItem
        },
        {
            label: 'View History',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'bg-blue-500 hover:bg-blue-600',
            handler: () => { onClose(); onShowRecords?.(item); },
            show: !!onShowRecords
        },
        {
            label: 'Statistics',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            color: 'bg-purple-500 hover:bg-purple-600',
            handler: () => { onClose(); onShowStats?.(item); },
            show: !!onShowStats
        },
        {
            label: 'Hide Item',
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
            ),
            color: 'bg-gray-600 hover:bg-gray-700',
            handler: () => { onClose(); onHideItem?.(item.id); },
            show: !!onHideItem
        }
    ].filter(a => a.show);

    const stockColor = item.currentStock <= 2
        ? 'text-red-500'
        : item.currentStock <= 5
            ? 'text-amber-500'
            : 'text-emerald-500';

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-scale-in overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Item Header */}
                <div className="flex items-center gap-4 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="text-5xl">{item.icon}</div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">{item.name}</h2>
                        <p className={`text-sm font-semibold ${stockColor}`}>
                            {item.currentStock} in stock
                            {item.isPinned && <span className="ml-2 text-amber-500">📌 Pinned</span>}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center transition-colors flex-shrink-0"
                    >
                        <span className="text-2xl text-gray-500">×</span>
                    </button>
                </div>

                {/* Action Buttons Grid */}
                <div className="grid grid-cols-3 gap-3 p-6">
                    {actions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.handler}
                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl text-white transition-all duration-200 active:scale-95 shadow-lg ${action.color}`}
                        >
                            {action.icon}
                            <span className="text-xs font-bold tracking-wide">{action.label}</span>
                        </button>
                    ))}
                </div>

                {/* Close hint for mobile */}
                <div className="pb-6 pt-0 text-center">
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        Tap outside to close
                    </button>
                </div>
            </div>
        </div>
    );
}
