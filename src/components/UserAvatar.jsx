import { useState } from 'react';

/**
 * UserAvatar - Displays user profile photo or beautiful gradient fallback with initials
 * 
 * Features:
 * - Shows profile photo if available
 * - Generates consistent gradient based on user ID
 * - Displays user initials as fallback
 * - Handles loading and error states gracefully
 */
export default function UserAvatar({ user, size = 'md', className = '' }) {
    const [imageError, setImageError] = useState(false);

    // Size classes
    const sizeClasses = {
        sm: 'w-7 h-7 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-16 h-16 text-lg'
    };

    // Generate consistent gradient from user ID
    const generateGradient = (uid) => {
        if (!uid) return 'from-gray-400 to-gray-600';

        // Hash the UID to get a number
        let hash = 0;
        for (let i = 0; i < uid.length; i++) {
            hash = uid.charCodeAt(i) + ((hash << 5) - hash);
        }

        // Use hash to pick from beautiful gradient combinations
        const gradients = [
            'from-blue-400 to-blue-600',
            'from-purple-400 to-purple-600',
            'from-pink-400 to-pink-600',
            'from-green-400 to-green-600',
            'from-yellow-400 to-yellow-600',
            'from-red-400 to-red-600',
            'from-indigo-400 to-indigo-600',
            'from-teal-400 to-teal-600',
            'from-cyan-400 to-cyan-600',
            'from-orange-400 to-orange-600'
        ];

        return gradients[Math.abs(hash) % gradients.length];
    };

    // Extract initials from name
    const getInitials = (name) => {
        if (!name) return '?';

        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const hasPhoto = user?.photoURL && !imageError;
    const initials = getInitials(user?.displayName || user?.realName);
    const gradient = generateGradient(user?.uid);

    if (hasPhoto) {
        return (
            <img
                src={user.photoURL}
                alt={user.displayName || user.realName || 'User'}
                onError={() => setImageError(true)}
                className={`${sizeClasses[size]} ${className} rounded-lg object-cover flex-shrink-0`}
            />
        );
    }

    // Gradient fallback with initials
    return (
        <div
            className={`${sizeClasses[size]} ${className} rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center font-black text-white flex-shrink-0 shadow-sm`}
            title={user?.displayName || user?.realName || 'User'}
        >
            {initials}
        </div>
    );
}
