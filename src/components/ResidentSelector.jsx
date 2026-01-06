import { useState } from 'react';

export default function ResidentSelector({ residents, selectedResident, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (resident) => {
        onSelect(resident);
        setIsOpen(false);
    };

    return (
        <div className="relative group">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between gap-4 p-5 glass dark:bg-gray-900/40 rounded-3xl border border-white/40 dark:border-gray-800/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
            >
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 flex items-center justify-center text-white text-2xl font-black shadow-[0_8px_20px_rgba(14,165,233,0.3)] animate-float">
                        {selectedResident
                            ? (selectedResident.firstName || selectedResident.name || '?').charAt(0).toUpperCase()
                            : '?'}
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-500 dark:text-primary-400 mb-0.5">Logging as</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                            {selectedResident
                                ? `${selectedResident.firstName || ''} ${selectedResident.lastName || ''}`.trim() || selectedResident.name || 'Unknown'
                                : 'Choose Resident'}
                        </p>
                    </div>
                </div>
                <div className={`p-2 rounded-xl transition-all duration-300 ${isOpen ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' : 'text-gray-400'}`}>
                    <svg
                        className={`w-6 h-6 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40 bg-gray-950/20 dark:bg-black/40 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-3 z-50 glass dark:bg-gray-900/90 rounded-[2rem] border border-white/40 dark:border-gray-800/50 shadow-[0_30px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-fade-in divide-y divide-gray-100 dark:divide-gray-800/50">
                        {residents.length === 0 ? (
                            <div className="p-8 text-center">
                                <span className="text-4xl block mb-2">👋</span>
                                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-tight">No residents found</p>
                            </div>
                        ) : (
                            residents.map((resident) => {
                                const fullName = `${resident.firstName || ''} ${resident.lastName || ''}`.trim() || resident.name || 'Unknown';
                                const initial = (resident.firstName || resident.name || 'U').charAt(0).toUpperCase();
                                const isSelected = selectedResident?.id === resident.id;

                                return (
                                    <button
                                        key={resident.id}
                                        onClick={() => handleSelect(resident)}
                                        className={`w-full flex items-center gap-4 p-5 hover:bg-white/50 dark:hover:bg-white/5 transition-all duration-300 ${isSelected ? 'bg-primary-50/50 dark:bg-primary-900/30' : ''
                                            }`}
                                    >
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-lg transition-transform duration-300 ${isSelected ? 'scale-110 shadow-lg' : 'opacity-80'}`}>
                                            {initial}
                                        </div>
                                        <span className={`text-base tracking-tight transition-all duration-300 ${isSelected ? 'font-black text-primary-600 dark:text-primary-400' : 'font-bold text-gray-700 dark:text-gray-300'}`}>
                                            {fullName}
                                        </span>
                                        {isSelected && (
                                            <div className="ml-auto w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-lg animate-fade-in shadow-primary-500/30">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
