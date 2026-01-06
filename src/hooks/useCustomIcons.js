import { useState, useEffect, useMemo } from 'react';

// Load custom icons from localStorage
const loadCustomIcons = () => {
    try {
        const saved = localStorage.getItem('customIcons');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

// Save custom icons to localStorage
const saveCustomIcons = (icons) => {
    localStorage.setItem('customIcons', JSON.stringify(icons));
};

export function useCustomIcons() {
    const [customIcons, setCustomIcons] = useState(loadCustomIcons);

    // Persist to localStorage whenever customIcons changes
    useEffect(() => {
        saveCustomIcons(customIcons);
    }, [customIcons]);

    // Add a custom icon (emoji or text)
    const addCustomIcon = (icon, keywords = []) => {
        const newIcon = {
            id: Date.now().toString(),
            icon,
            keywords: keywords.filter(k => k.trim()),
            createdAt: new Date().toISOString()
        };
        setCustomIcons(prev => [...prev, newIcon]);
        return newIcon;
    };

    // Update an existing custom icon
    const updateCustomIcon = (id, icon, keywords = []) => {
        setCustomIcons(prev => prev.map(item =>
            item.id === id
                ? { ...item, icon, keywords: keywords.filter(k => k.trim()) }
                : item
        ));
    };

    // Remove a custom icon
    const removeCustomIcon = (id) => {
        setCustomIcons(prev => prev.filter(item => item.id !== id));
    };

    // Memoized custom icons map for suggestions (prevents infinite re-renders)
    const customIconsMap = useMemo(() => {
        const map = {};
        customIcons.forEach(item => {
            if (item.keywords && item.keywords.length > 0) {
                map[item.icon] = item.keywords;
            }
        });
        return map;
    }, [customIcons]);

    return {
        customIcons,
        addCustomIcon,
        updateCustomIcon,
        removeCustomIcon,
        customIconsMap
    };
}
