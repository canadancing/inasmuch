export default function ItemCard({ item, isSelected, onSelect }) {
    return (
        <button
            onClick={() => onSelect(item)}
            className={`card-interactive p-6 flex flex-col items-center gap-4 transition-all duration-500 ${isSelected
                ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-[0_0_30px_rgba(14,165,233,0.15)] scale-105'
                : ''
                }`}
        >
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
        </button>
    );
}
