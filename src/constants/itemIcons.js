// Categorized icon library for household items
export const ITEM_ICON_CATEGORIES = {
    bathroom: {
        label: '🚿 Bathroom',
        icons: [
            { emoji: '🧻', keywords: ['paper', 'towel', 'toilet', 'tissue', 'tp'] },
            { emoji: '🧼', keywords: ['soap', 'hand', 'wash', 'bar'] },
            { emoji: '🧴', keywords: ['shampoo', 'conditioner', 'lotion', 'body wash', 'liquid'] },
            { emoji: '🪥', keywords: ['toothbrush', 'brush', 'dental'] },
            { emoji: '🧽', keywords: ['sponge', 'scrub', 'cleaning'] },
            { emoji: '🛁', keywords: ['towel', 'bath', 'shower'] },
            { emoji: '🚿', keywords: ['shower', 'bath', 'bathroom'] },
            { emoji: '🪒', keywords: ['razor', 'shave', 'blade'] },
            { emoji: '💊', keywords: ['medicine', 'pill', 'medication', 'vitamin'] },
            { emoji: '🧹', keywords: ['broom', 'sweep', 'clean'] },
        ]
    },
    bedroom: {
        label: '🛏️ Bedroom',
        icons: [
            { emoji: '🛏️', keywords: ['bed', 'sheet', 'linen', 'bedding'] },
            { emoji: '🛌', keywords: ['pillow', 'cushion', 'sleep'] },
            { emoji: '🧺', keywords: ['blanket', 'comforter', 'duvet', 'throw', 'basket', 'laundry'] },
            { emoji: '👕', keywords: ['clothes', 'shirt', 'clothing', 'garment'] },
            { emoji: '🧦', keywords: ['sock', 'socks', 'pair'] },
            { emoji: '👔', keywords: ['tie', 'formal', 'dress'] },
            { emoji: '🧥', keywords: ['jacket', 'coat', 'outerwear'] },
            { emoji: '💡', keywords: ['light', 'bulb', 'lamp'] },
        ]
    },
    kitchen: {
        label: '🍽️ Kitchen',
        icons: [
            { emoji: '🍽️', keywords: ['dish', 'soap', 'plate', 'tableware'] },
            { emoji: '🧽', keywords: ['sponge', 'scrub', 'dish'] },
            { emoji: '🥤', keywords: ['drink', 'beverage', 'cup', 'glass', 'soda'] },
            { emoji: '🧃', keywords: ['juice', 'box', 'drink', 'beverage'] },
            { emoji: '☕', keywords: ['coffee', 'tea', 'mug', 'caffeine'] },
            { emoji: '🥛', keywords: ['milk', 'dairy', 'beverage'] },
            { emoji: '🧂', keywords: ['salt', 'pepper', 'seasoning', 'spice'] },
            { emoji: '🧈', keywords: ['butter', 'spread', 'margarine'] },
            { emoji: '🍞', keywords: ['bread', 'loaf', 'slice'] },
            { emoji: '🥐', keywords: ['croissant', 'pastry', 'baked'] },
            { emoji: '🧀', keywords: ['cheese', 'dairy'] },
            { emoji: '🥚', keywords: ['egg', 'eggs'] },
            { emoji: '🍳', keywords: ['pan', 'fry', 'cook', 'cooking'] },
            { emoji: '🔪', keywords: ['knife', 'utensil', 'cutlery'] },
            { emoji: '🥄', keywords: ['spoon', 'utensil', 'cutlery'] },
            { emoji: '🍴', keywords: ['fork', 'utensil', 'cutlery'] },
            { emoji: '🥢', keywords: ['chopstick', 'utensil'] },
            { emoji: '🍺', keywords: ['beer', 'alcohol', 'drink'] },
        ]
    },
    cleaning: {
        label: '🧹 Cleaning',
        icons: [
            { emoji: '🧹', keywords: ['broom', 'sweep', 'floor'] },
            { emoji: '🧼', keywords: ['soap', 'detergent', 'cleaner'] },
            { emoji: '🧴', keywords: ['cleaner', 'spray', 'liquid', 'detergent'] },
            { emoji: '🧽', keywords: ['sponge', 'scrub', 'wipe'] },
            { emoji: '🧺', keywords: ['basket', 'laundry', 'hamper'] },
            { emoji: '🧯', keywords: ['supplies', 'emergency', 'safety'] },
            { emoji: '🗑️', keywords: ['trash', 'garbage', 'bag', 'bin'] },
            { emoji: '♻️', keywords: ['recycle', 'recycling', 'green'] },
            { emoji: '🧻', keywords: ['paper', 'towel', 'tissue'] },
            { emoji: '🪣', keywords: ['bucket', 'pail', 'mop'] },
        ]
    },
    storage: {
        label: '📦 Storage',
        icons: [
            { emoji: '📦', keywords: ['box', 'package', 'misc', 'general', 'item'] },
            { emoji: '💡', keywords: ['light', 'bulb', 'lamp', 'lighting'] },
            { emoji: '🔋', keywords: ['battery', 'batteries', 'power'] },
            { emoji: '🔌', keywords: ['plug', 'cord', 'cable', 'electric'] },
            { emoji: '🎁', keywords: ['gift', 'present', 'wrapped'] },
            { emoji: '📝', keywords: ['note', 'paper', 'writing', 'notepad'] },
            { emoji: '✏️', keywords: ['pencil', 'pen', 'writing'] },
            { emoji: '📚', keywords: ['book', 'books', 'reading'] },
            { emoji: '🔧', keywords: ['tool', 'wrench', 'repair'] },
            { emoji: '🔨', keywords: ['hammer', 'tool', 'fix'] },
            { emoji: '🪛', keywords: ['screwdriver', 'tool', 'screw'] },
            { emoji: '🧰', keywords: ['toolbox', 'tools', 'repair'] },
            { emoji: '🔑', keywords: ['key', 'lock', 'access'] },
            { emoji: '🎨', keywords: ['art', 'paint', 'craft'] },
            { emoji: '✂️', keywords: ['scissors', 'cut', 'cutting'] },
        ]
    }
};

// Default icon for items without a specific selection
export const DEFAULT_ICON = '📦';

// Flatten all icons for quick search
export const ALL_ICONS = Object.values(ITEM_ICON_CATEGORIES).flatMap(
    category => category.icons
);

/**
 * Suggest icons based on item name
 * @param {string} itemName - The name of the item
 * @returns {string[]} - Array of suggested emoji icons (max 5)
 */
export function suggestIcons(itemName) {
    if (!itemName || itemName.trim().length === 0) {
        return [];
    }

    const searchTerms = itemName.toLowerCase().trim().split(/\s+/);
    const scores = new Map();

    // Score each icon based on keyword matches
    ALL_ICONS.forEach(({ emoji, keywords }) => {
        let score = 0;
        searchTerms.forEach(term => {
            keywords.forEach(keyword => {
                if (keyword.includes(term) || term.includes(keyword)) {
                    // Exact match gets higher score
                    score += keyword === term ? 10 : 5;
                }
            });
        });
        if (score > 0) {
            scores.set(emoji, score);
        }
    });

    // Sort by score and return top 5
    return Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([emoji]) => emoji);
}
