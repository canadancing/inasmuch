export default function ThemeToggle({ isDark, onToggle }) {
    return (
        <button
            onClick={onToggle}
            className="relative flex items-center p-1 w-16 h-8 rounded-full bg-gray-200 dark:bg-gray-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 shadow-inner"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {/* The sliding puck */}
            <div
                className={`absolute w-6 h-6 bg-white dark:bg-gray-900 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-8' : 'translate-x-0'
                    }`}
            >
                {isDark ? (
                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                            clipRule="evenodd"
                        />
                    </svg>
                )}
            </div>
            
            {/* Outline icons placed inside the track behind the sliding puck */}
            <div className="flex justify-between w-full px-1.5 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            </div>
        </button>
    );
}
