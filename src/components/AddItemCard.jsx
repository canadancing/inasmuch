export default function AddItemCard({ onClick }) {
    return (
        <button
            onClick={onClick}
            className="card-interactive p-6 flex flex-col items-center justify-center gap-4 relative group transition-all duration-300 hover:scale-105 min-h-[200px]"
        >
            {/* Large Plus Icon */}
            <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90 shadow-lg">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </div>

            {/* Text */}
            <div className="flex flex-col items-center gap-1">
                <span className="text-base font-black text-gray-900 dark:text-white">
                    Add New Item
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    Click to create
                </span>
            </div>

            {/* Decorative Border on Hover */}
            <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-primary-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
        </button>
    );
}
