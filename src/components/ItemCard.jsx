export default function ItemCard({ item, isSelected, onSelect, showStockOnly = false, onHideItem, onConsume, onShowRecords, onRestock, onShowStats }) {
    const content = (
        <>
            <div className={`text-5xl transition-transform duration-500 ${isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`}>{item.icon}</div>
            <span className={`text-base font-black text-center leading-tight tracking-tight transition-colors duration-300 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                {item.name}
            </span>
            <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl transition-all duration-300 ${item.currentStock <= 2
                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-100 dark:border-red-900/50'
                : item.currentStock <= 5
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50'
                    : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50'
                }`}>
                {item.currentStock} in stock
            </div>
        </>
    );

    // Calculate notification badge count (e.g., items below min stock)
    const badgeCount = item.currentStock > 0 && item.currentStock <= item.minStock ? 1 : 0;

    if (showStockOnly) {
        return (
            <div className="relative group">
                <button
                    onClick={() => onSelect(item)}
                    className="card-interactive p-6 flex flex-col items-center gap-4 w-full transition-all duration-300 group-hover:scale-105"
                >
                    {content}
                </button>
                {/* Consumption (Minus) Button */}
                {onConsume && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onConsume(item);
                        }}
                        className="absolute top-3 left-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:bg-red-600 z-10"
                        title="Log Consumption"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                    </button>
                )}
                {/* Restock (Plus) Button */}
                {onRestock && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRestock(item);
                        }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:bg-primary-600 z-10"
                        title="Restock Item"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </button>
                )}
                {/* Hide Button */}
                {onHideItem && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onHideItem(item.id);
                        }}
                        className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-gray-600 dark:bg-gray-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 z-10"
                        title="Hide Item"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    </button>
                )}
                {/* Records Button */}
                {onShowRecords && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowRecords(item);
                        }}
                        className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:bg-blue-600 z-10"
                        title="View Records"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </button>
                )}
                {/* Stats Button (Purple, bottom-right when records absent, otherwise inset) */}
                {onShowStats && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onShowStats(item);
                        }}
                        className={`absolute bottom-3 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg hover:bg-purple-600 z-10 ${onShowRecords ? 'right-12' : 'right-3'}`}
                        title="View Stats"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </button>
                )}
            </div>
        );
    }

    return (
        <button
            onClick={() => onSelect(item)}
            className={`card-interactive p-6 flex flex-col items-center gap-4 transition-all duration-500 ${isSelected
                ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-[0_0_30px_rgba(14,165,233,0.15)] scale-105'
                : ''
                }`}
        >
            {content}
        </button>
    );
}
