import React from 'react';

/**
 * RoleBadge - Displays a visual badge for entity roles
 * Supports: resident, guest, temporary, staff, donor, volunteer, common, bathroom, bedroom, utility, outdoor
 */
export default function RoleBadge({ role, size = 'md' }) {
    const roleConfig = {
        // People roles
        resident: { icon: '🏠', label: 'Resident', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
        guest: { icon: '🎒', label: 'Guest', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
        temporary: { icon: '🏕️', label: 'Temp', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
        staff: { icon: '🧹', label: 'Staff', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' },
        donor: { icon: '🎁', label: 'Donor', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400' },
        volunteer: { icon: '👔', label: 'Volunteer', bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },

        // Location roles
        common: { icon: '📍', label: 'Common', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300' },
        bathroom: { icon: '🚽', label: 'Bathroom', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400' },
        bedroom: { icon: '🛏️', label: 'Bedroom', bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' },
        utility: { icon: '🏢', label: 'Utility', bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-700 dark:text-slate-400' },
        outdoor: { icon: '🌳', label: 'Outdoor', bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-700 dark:text-lime-400' }
    };

    const config = roleConfig[role] || roleConfig.resident;

    const sizeClasses = {
        sm: 'text-xs px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-3 py-1.5'
    };

    return (
        <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${config.bg} ${config.text} ${sizeClasses[size]}`}>
            <span>{config.icon}</span>
            <span>{config.label}</span>
        </span>
    );
}
