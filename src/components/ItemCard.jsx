import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function ItemCard({ item, isSelected, onSelect, showStockOnly = false, isSortable = false }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: item.id,
        disabled: !isSortable
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    const content = (
        <>
            <div className={`text-5xl transition-transform duration-500 ${isSelected ? 'scale-110 rotate-3' : 'group-hover:scale-110'}`}>{item.icon}</div>
            <span className={`text-base font-black text-center leading-tight tracking-tight transition-colors duration-300 ${isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                {item.name}
            </span>
            {item.isReusable && (
                <div className="absolute top-2 right-2 flex items-center justify-center p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400" title="Reusable Item">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                </div>
            )}
            {item.isPinned && (
                <div className="absolute top-2 left-2 flex items-center justify-center p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400" title="Pinned Item">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                </div>
            )}
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

    if (showStockOnly) {
        return (
            <div ref={setNodeRef} style={style} className={`relative group ${isDragging ? 'opacity-50' : 'opacity-100'}`} {...attributes} {...listeners}>
                <button
                    onClick={() => onSelect(item)}
                    className="card-interactive p-6 flex flex-col items-center gap-4 w-full transition-all duration-300 group-hover:scale-105"
                >
                    {content}
                </button>
            </div>
        );
    }

    return (
        <button
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onSelect(item)}
            className={`card-interactive p-6 flex flex-col items-center gap-4 transition-all duration-500 ${isDragging ? 'opacity-50' : ''} ${isSelected
                ? 'ring-2 ring-primary-500 border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-[0_0_30px_rgba(14,165,233,0.15)] scale-105'
                : ''
                }`}
        >
            {content}
        </button>
    );
}
