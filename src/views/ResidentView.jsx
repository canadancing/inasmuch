import { useState } from 'react';
import ResidentSelector from '../components/ResidentSelector';
import ItemGrid from '../components/ItemGrid';
import QuantityStepper from '../components/QuantityStepper';

export default function ResidentView({
    residents,
    items,
    onLog,
    loading,
    isDemo,
    isAdmin,
    role,
    requestAdminAccess,
    user,
    onLogin
}) {
    const [selectedResident, setSelectedResident] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    const handleRequestAdmin = async () => {
        setIsSubmitting(true);
        try {
            await requestAdminAccess();
            setRequestSent(true);
        } catch (error) {
            console.error('Error requesting admin:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedResident || !selectedItem || !isAdmin) return;

        // Prevent if out of stock
        if (selectedItem.currentStock < quantity) return;

        setIsSubmitting(true);
        try {
            const [year, month, day] = logDate.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);

            // If it's today, we can use the current time for better sorting
            const todayStr = new Date().toISOString().split('T')[0];
            if (logDate === todayStr) {
                const now = new Date();
                dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                // For past dates, set to noon to be safe
                dateObj.setHours(12, 0, 0, 0);
            }

            await onLog(
                selectedResident.id,
                `${selectedResident.firstName || ''} ${selectedResident.lastName || ''}`.trim() || selectedResident.name || 'Unknown',
                selectedItem.id,
                selectedItem.name,
                'used',
                quantity,
                dateObj
            );

            // Show success feedback
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

            // Reset selection
            setSelectedItem(null);
            setQuantity(1);
            setLogDate(new Date().toISOString().split('T')[0]);
        } catch (error) {
            console.error('Error logging:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isOutOfStock = selectedItem && selectedItem.currentStock < quantity;
    const canSubmit = selectedResident && selectedItem && !isSubmitting && !isOutOfStock && isAdmin;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header / Brand */}
            <div className="flex items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
                        I
                    </div>
                    <div>
                        <h1 className="font-black text-xl tracking-tight text-gray-900 dark:text-white leading-none uppercase">Inasmuch</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-primary-500 dark:text-primary-400 font-bold mt-1">Supply Tracker</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isAdmin && (
                        <div className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Read Only</span>
                        </div>
                    )}
                    {isDemo && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">Demo</span>
                        </div>
                    )}
                </div>
            </div>


            {/* Success Toast */}
            {showSuccess && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-6 py-3 rounded-2xl shadow-lg animate-fade-in flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Logged successfully!</span>
                </div>
            )}

            {/* Resident Selector - Only for Admins */}
            {user && isAdmin && (
                <div className="mb-6">
                    <ResidentSelector
                        residents={residents}
                        selectedResident={selectedResident}
                        onSelect={setSelectedResident}
                    />
                </div>
            )}

            {/* Item Grid */}
            <div className="flex-1 overflow-y-auto mb-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    {user ? 'What did you use?' : 'Current Inventory'}
                </h2>
                <ItemGrid
                    items={items}
                    selectedItem={selectedItem}
                    onSelectItem={setSelectedItem}
                />
            </div>

            {/* Bottom Action Bar */}
            {selectedItem && (
                <div className="sticky bottom-0 bg-gradient-to-t from-gray-50 dark:from-gray-950 pt-4 pb-safe animate-slide-up">
                    <div className="card p-4 shadow-2xl border-primary-100 dark:border-primary-900/30">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">{selectedItem.icon}</span>
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">{selectedItem.name}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-500">Stock Level</p>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedItem.currentStock === 0
                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/10 dark:text-emerald-400'
                                            }`}>
                                            {selectedItem.currentStock} remaining
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {user && isAdmin && (
                                <QuantityStepper
                                    quantity={quantity}
                                    onChange={setQuantity}
                                />
                            )}
                        </div>

                        {user ? (
                            isAdmin ? (
                                <>
                                    {/* Date Selection */}
                                    <div className="mb-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Date</span>
                                        <input
                                            type="date"
                                            value={logDate}
                                            onChange={(e) => setLogDate(e.target.value)}
                                            max={new Date().toISOString().split('T')[0]}
                                            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                        />
                                    </div>

                                    <button
                                        onClick={handleConfirm}
                                        disabled={!canSubmit}
                                        className={`btn w-full text-lg ${canSubmit
                                            ? 'btn-primary shadow-lg shadow-primary-500/20'
                                            : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                                        ) : !selectedResident ? (
                                            'Select a Resident First'
                                        ) : isOutOfStock ? (
                                            'Out of Stock'
                                        ) : (
                                            <>
                                                <span>Confirm</span>
                                                <span className="ml-2 opacity-70">
                                                    {quantity}× {selectedItem.name}
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">You need admin privileges to log usage.</p>
                                    <button
                                        onClick={handleRequestAdmin}
                                        disabled={requestSent || isSubmitting}
                                        className={`btn w-full ${requestSent ? 'bg-emerald-500 text-white' : 'btn-primary'}`}
                                    >
                                        {requestSent ? 'Request Sent ✓' : 'Apply for Co-Admin'}
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={onLogin}
                                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign In to Log Usage
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
