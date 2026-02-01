import { useState } from 'react';

export default function AuthForm({ mode = 'login', onSubmit, onGoogleLogin, loading, error }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [currentMode, setCurrentMode] = useState(mode); // 'login' or 'register'

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (password.length < 8 || password.length > 20) {
            alert('Password must be between 8 and 20 characters.');
            return;
        }

        // Processing "username" to email if needed
        let finalEmail = email;
        let displayName = email.trim();

        if (!email.includes('@')) {
            finalEmail = `${email.trim().toLowerCase()}@inasmuch.local`;
            displayName = email.trim();
        }

        if (currentMode === 'register') {
            onSubmit({ email: finalEmail, password, displayName, mode: 'register' });
        } else {
            onSubmit({ email: finalEmail, password, mode: 'login' });
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto space-y-6 animate-fade-in">
            {onGoogleLogin && (
                <div className="text-center">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                        {currentMode === 'login' ? 'Welcome Back' : currentMode === 'link' ? 'Link Password' : 'Create Account'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {currentMode === 'login'
                            ? 'Sign in to manage your supplies'
                            : currentMode === 'link'
                                ? 'Add password authentication to your account'
                                : 'Join Inasmuch to start tracking'}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">
                        {currentMode === 'link' ? 'Choose Username' : 'Username or Email'}
                    </label>
                    <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tony_xiao"
                        autoComplete={currentMode === 'register' ? 'username' : 'username'}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white font-bold transition-all outline-none"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">
                        Password (8-20 chars)
                    </label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        minLength={8}
                        maxLength={20}
                        autoComplete={currentMode === 'register' ? 'new-password' : 'current-password'}
                        className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border-2 border-transparent focus:border-primary-500/30 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white font-bold transition-all outline-none"
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-[11px] font-bold text-red-500 animate-shake">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-primary-500 text-white font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {loading ? 'Processing...' : currentMode === 'login' ? 'Sign In' : currentMode === 'link' ? 'Link Password' : 'Register'}
                </button>
            </form>

            {onGoogleLogin && (
                <>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                            <span className="px-3 bg-white dark:bg-gray-950 text-gray-400">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onGoogleLogin}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 flex items-center justify-center gap-3 text-gray-900 dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => setCurrentMode(currentMode === 'login' ? 'register' : 'login')}
                            className="text-[11px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-colors"
                        >
                            {currentMode === 'login'
                                ? "Don't have an account? Register"
                                : "Already have an account? Sign In"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
