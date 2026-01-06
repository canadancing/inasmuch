export default function QuantityStepper({ quantity, onChange, min = 1, max = 99 }) {
    const handleDecrement = () => {
        if (quantity > min) {
            onChange(quantity - 1);
        }
    };

    const handleIncrement = () => {
        if (quantity < max) {
            onChange(quantity + 1);
        }
    };

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={handleDecrement}
                disabled={quantity <= min}
                className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm hover:shadow-md"
                aria-label="Decrease quantity"
            >
                −
            </button>

            <div className="w-20 text-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {quantity}
                </span>
            </div>

            <button
                onClick={handleIncrement}
                disabled={quantity >= max}
                className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm hover:shadow-md"
                aria-label="Increase quantity"
            >
                +
            </button>
        </div>
    );
}
