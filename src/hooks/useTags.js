import { useState, useEffect, useMemo } from 'react';

// Default tags
const defaultTags = [
    { id: 'resident', name: 'Resident', color: 'blue', icon: '🏠' },
    { id: 'donor', name: 'Donor', color: 'green', icon: '🎁' },
    { id: 'guest', name: 'Guest', color: 'purple', icon: '👥' },
    { id: 'staff', name: 'Staff', color: 'orange', icon: '🛠️' },
];

// Color options for tags
export const tagColors = [
    { id: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
    { id: 'green', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    { id: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
    { id: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
    { id: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-400', dot: 'bg-pink-500' },
    { id: 'cyan', bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-400', dot: 'bg-cyan-500' },
    { id: 'amber', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
    { id: 'red', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
];

// Load tags from localStorage
const loadTags = () => {
    try {
        const saved = localStorage.getItem('personTags');
        return saved ? JSON.parse(saved) : defaultTags;
    } catch {
        return defaultTags;
    }
};

// Save tags to localStorage
const saveTags = (tags) => {
    localStorage.setItem('personTags', JSON.stringify(tags));
};

export function useTags() {
    const [tags, setTags] = useState(loadTags);

    // Persist to localStorage whenever tags changes
    useEffect(() => {
        saveTags(tags);
    }, [tags]);

    // Add a custom tag
    const addTag = (name, color = 'blue', icon = '🏷️') => {
        const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        const newTag = { id, name, color, icon };
        setTags(prev => [...prev, newTag]);
        return newTag;
    };

    // Update an existing tag
    const updateTag = (id, updates) => {
        setTags(prev => prev.map(tag =>
            tag.id === id ? { ...tag, ...updates } : tag
        ));
    };

    // Remove a tag
    const removeTag = (id) => {
        // Don't allow removing default tags
        if (['resident', 'donor', 'guest', 'staff'].includes(id)) {
            return false;
        }
        setTags(prev => prev.filter(tag => tag.id !== id));
        return true;
    };

    // Get tag by ID
    const getTag = (id) => tags.find(tag => tag.id === id);

    // Get color styles for a tag
    const getTagStyles = (tagId) => {
        const tag = getTag(tagId);
        const color = tag?.color || 'blue';
        return tagColors.find(c => c.id === color) || tagColors[0];
    };

    // Memoize tags map for quick lookup
    const tagsMap = useMemo(() => {
        const map = {};
        tags.forEach(tag => { map[tag.id] = tag; });
        return map;
    }, [tags]);

    return {
        tags,
        tagsMap,
        tagColors,
        addTag,
        updateTag,
        removeTag,
        getTag,
        getTagStyles
    };
}
