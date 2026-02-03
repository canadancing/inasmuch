import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ResidentSelector from './ResidentSelector';
import SearchableSection from './SearchableSection';
import RoleBadge from './RoleBadge';

export default function AdminPanel({
    residents,
    items,
    logs = [],
    onAddResident,
    onUpdateResident,
    onRemoveResident,
    onAddItem,
    onUpdateItem,
    onRemoveItem,
    onRestock,
    isDemo,
    isDark,
    // Custom icon props
    customIcons = [],
    onAddCustomIcon,
    onUpdateCustomIcon,
    onRemoveCustomIcon,
    customIconsMap = {},
    // Tag props
    tags = [],
    tagsMap = {},
    tagColors = [],
    onAddTag,
    onUpdateTag,
    onRemoveTag,
    getTagStyles
}) {
    const [activeTab, setActiveTab] = useState('tags');
    // Custom icon editing state
    const [newCustomIcon, setNewCustomIcon] = useState('');
    const [newCustomKeywords, setNewCustomKeywords] = useState('');
    const [editingIcon, setEditingIcon] = useState(null);
    const [editIconValue, setEditIconValue] = useState('');
    const [editKeywordsValue, setEditKeywordsValue] = useState('');
    // Tag management state
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('blue');
    const [newTagIcon, setNewTagIcon] = useState('🏷️');
    const [editingTag, setEditingTag] = useState(null);
    const [editTagName, setEditTagName] = useState('');
    const [editTagColor, setEditTagColor] = useState('blue');
    const [editTagIcon, setEditTagIcon] = useState('🏷️');
    // Country picker state
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');

    // Safety Alert State
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // Function to run if "No" (Discard) is clicked
    const [saveAction, setSaveAction] = useState(null); // Function to run if "Save" is clicked

    // Countries with flags (emoji flags)
    const countries = [
        { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
        { code: 'AL', name: 'Albania', flag: '🇦🇱' },
        { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
        { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
        { code: 'AO', name: 'Angola', flag: '🇦🇴' },
        { code: 'AG', name: 'Antigua & Barbuda', flag: '🇦🇬' },
        { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
        { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
        { code: 'AU', name: 'Australia', flag: '🇦🇺' },
        { code: 'AT', name: 'Austria', flag: '🇦🇹' },
        { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
        { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
        { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
        { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
        { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
        { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
        { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
        { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
        { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
        { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
        { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
        { code: 'BA', name: 'Bosnia & Herzegovina', flag: '🇧🇦' },
        { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
        { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
        { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
        { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
        { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
        { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
        { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
        { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦' },
        { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
        { code: 'CF', name: 'Central African Rep.', flag: '🇨🇫' },
        { code: 'TD', name: 'Chad', flag: '🇹🇩' },
        { code: 'CL', name: 'Chile', flag: '🇨🇱' },
        { code: 'CN', name: 'China', flag: '🇨🇳' },
        { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
        { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
        { code: 'CG', name: 'Congo', flag: '🇨🇬' },
        { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
        { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
        { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
        { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
        { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
        { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
        { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
        { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
        { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
        { code: 'CD', name: 'DR Congo', flag: '🇨🇩' },
        { code: 'TL', name: 'East Timor', flag: '🇹🇱' },
        { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
        { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
        { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
        { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
        { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
        { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
        { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
        { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
        { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
        { code: 'FI', name: 'Finland', flag: '🇫🇮' },
        { code: 'FR', name: 'France', flag: '🇫🇷' },
        { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
        { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
        { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
        { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
        { code: 'GR', name: 'Greece', flag: '🇬🇷' },
        { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
        { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
        { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
        { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
        { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
        { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
        { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
        { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
        { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
        { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
        { code: 'IN', name: 'India', flag: '🇮🇳' },
        { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
        { code: 'IR', name: 'Iran', flag: '🇮🇷' },
        { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
        { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
        { code: 'IL', name: 'Israel', flag: '🇮🇱' },
        { code: 'IT', name: 'Italy', flag: '🇮🇹' },
        { code: 'CI', name: 'Ivory Coast', flag: '🇨🇮' },
        { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
        { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
        { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
        { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
        { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
        { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
        { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
        { code: 'LA', name: 'Laos', flag: '🇱🇦' },
        { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
        { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
        { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
        { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
        { code: 'LY', name: 'Libya', flag: '🇱🇾' },
        { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
        { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
        { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
        { code: 'MK', name: 'Macedonia', flag: '🇲🇰' },
        { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
        { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
        { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
        { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
        { code: 'ML', name: 'Mali', flag: '🇲🇱' },
        { code: 'MT', name: 'Malta', flag: '🇲🇹' },
        { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
        { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
        { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
        { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
        { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
        { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
        { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
        { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
        { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
        { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
        { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
        { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
        { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
        { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
        { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
        { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
        { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
        { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
        { code: 'NE', name: 'Niger', flag: '🇳🇪' },
        { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
        { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
        { code: 'NO', name: 'Norway', flag: '🇳🇴' },
        { code: 'OM', name: 'Oman', flag: '🇴🇲' },
        { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
        { code: 'PW', name: 'Palau', flag: '🇵🇼' },
        { code: 'PS', name: 'Palestine', flag: '🇵🇸' },
        { code: 'PA', name: 'Panama', flag: '🇵🇦' },
        { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
        { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
        { code: 'PE', name: 'Peru', flag: '🇵🇪' },
        { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
        { code: 'PL', name: 'Poland', flag: '🇵🇱' },
        { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
        { code: 'PR', name: 'Puerto Rico', flag: '🇵🇷' },
        { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
        { code: 'RO', name: 'Romania', flag: '🇷🇴' },
        { code: 'RU', name: 'Russia', flag: '🇷🇺' },
        { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
        { code: 'KN', name: 'Saint Kitts & Nevis', flag: '🇰🇳' },
        { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
        { code: 'VC', name: 'Saint Vincent', flag: '🇻🇨' },
        { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
        { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
        { code: 'ST', name: 'Sao Tome & Principe', flag: '🇸🇹' },
        { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
        { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
        { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
        { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
        { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
        { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
        { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
        { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
        { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
        { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
        { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
        { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
        { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
        { code: 'ES', name: 'Spain', flag: '🇪🇸' },
        { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
        { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
        { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
        { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
        { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
        { code: 'SY', name: 'Syria', flag: '🇸🇾' },
        { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
        { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
        { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
        { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
        { code: 'TG', name: 'Togo', flag: '🇹🇬' },
        { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
        { code: 'TT', name: 'Trinidad & Tobago', flag: '🇹🇹' },
        { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
        { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
        { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
        { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
        { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
        { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
        { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
        { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
        { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
        { code: 'VA', name: 'Vatican City', flag: '🇻🇦' },
        { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
        { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
        { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
        { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
        { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' }
    ];

    // Get flag for country name
    const getCountryFlag = (countryName) => {
        const country = countries.find(c => c.name.toLowerCase() === (countryName || '').toLowerCase());
        return country?.flag || '🌍';
    };

    // Filter countries based on search
    const filteredCountries = countrySearch.trim()
        ? countries.filter(c =>
            c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
            c.code.toLowerCase().includes(countrySearch.toLowerCase())
        )
        : countries;

    // Icon mapping with keywords for smart suggestions
    const iconMap = {
        // Electronics
        '📱': ['phone', 'cell', 'mobile', 'iphone', 'android', 'smartphone'],
        '💻': ['laptop', 'computer', 'macbook', 'notebook'],
        '🖥️': ['desktop', 'monitor', 'screen', 'pc'],
        '📺': ['tv', 'television', 'monitor'],
        '🎮': ['game', 'controller', 'xbox', 'playstation', 'nintendo'],
        '⌨️': ['keyboard'],
        '🖱️': ['mouse'],
        '🔌': ['charger', 'cable', 'cord', 'plug', 'adapter'],
        '🔋': ['battery', 'batteries', 'aaa', 'aa', 'power'],
        '💡': ['bulb', 'light', 'lamp', 'led'],

        // Cleaning
        '🧻': ['toilet paper', 'tp', 'tissue', 'tissues', 'kleenex', 'bathroom tissue'],
        '🧼': ['soap', 'shampoo', 'conditioner', 'lotion', 'body wash', 'hand soap'],
        '🧽': ['sponge', 'scrubber', 'scrub'],
        '🧹': ['broom', 'sweep', 'mop'],
        '🗑️': ['trash', 'garbage', 'bin', 'waste', 'trash bag', 'garbage bag'],
        '🪣': ['bucket', 'pail', 'mop bucket'],
        '🧺': ['laundry', 'detergent', 'washing', 'fabric softener'],
        '🧴': ['bar soap', 'hand soap', 'dish soap', 'dishwashing'],

        // Kitchen
        '🍽️': ['dish', 'plate', 'dishes', 'dinnerware'],
        '☕': ['coffee', 'tea', 'mug', 'cup'],
        '🥤': ['cup', 'straw', 'drink'],
        '🧃': ['juice', 'drink box'],
        '🥛': ['milk', 'cream'],
        '🧈': ['butter', 'margarine'],
        '🍞': ['bread', 'loaf'],
        '🥫': ['can', 'canned', 'soup'],
        '�🧂': ['salt', 'pepper', 'spice', 'seasoning'],
        '🍳': ['pan', 'egg', 'cooking'],

        // Bathroom & Personal
        '🪥': ['toothbrush', 'tooth brush', 'dental'],
        '🪒': ['razor', 'shave', 'shaving'],
        '💊': ['medicine', 'pill', 'vitamin', 'medication', 'drug'],
        '🩹': ['bandaid', 'band-aid', 'bandage', 'first aid'],
        '💅': ['nail', 'polish', 'manicure'],

        // Office
        '📦': ['box', 'package', 'shipping'],
        '📝': ['paper', 'note', 'notepad', 'memo'],
        '✏️': ['pencil', 'eraser'],
        '🖊️': ['pen', 'marker'],
        '📎': ['clip', 'paperclip'],
        '✂️': ['scissors', 'cutter'],
        '📁': ['folder', 'file'],
        '📌': ['pin', 'thumbtack', 'pushpin'],

        // Tools
        '🔧': ['wrench', 'tool'],
        '🔨': ['hammer', 'nail'],
        '🪛': ['screwdriver', 'screw'],
        '🔦': ['flashlight', 'torch'],
        '🧰': ['toolbox', 'tools'],
        '🪜': ['ladder', 'step'],

        // Pets & Garden
        '🐶': ['dog', 'puppy', 'pet food'],
        '🐱': ['cat', 'kitten', 'kitty'],
        '🦴': ['bone', 'treat', 'dog treat'],
        '🐟': ['fish', 'fish food'],
        '🌱': ['plant', 'seed', 'soil'],
        '🪴': ['pot', 'planter', 'houseplant'],

        // Laundry & Fabric
        '👕': ['shirt', 'clothes', 'clothing'],
        '🧦': ['sock', 'socks'],
        '👖': ['pants', 'jeans'],
        '🛏️': ['bed', 'sheet', 'sheets', 'bedding', 'pillow'],
        '🧵': ['thread', 'sewing'],

        // Misc
        '🔑': ['key', 'keys', 'lock'],
        '🪞': ['mirror'],
        '🎁': ['gift', 'present'],
        '🎒': ['bag', 'backpack'],
        '💳': ['card', 'credit'],
    };

    // Merge built-in icons with custom icons (memoized to prevent infinite loops)
    const combinedIconMap = useMemo(() => ({ ...iconMap, ...customIconsMap }), [customIconsMap]);

    // All available icons (flattened from map + extras + custom)
    const customIconsList = customIcons.map(c => c.icon);
    const allIcons = [
        ...Object.keys(iconMap),
        '🧯', '🪠', '🧪', '🛁', '🚿', '🗂️', '📏', '🔩', '🪤', '🧲', '⚙️',
        '🧥', '👟', '🪡', '🧶', '🪆', '🌿', '🌻', '🪺', '🌾', '🏷️', '🎨', '🧸', '🪙',
        ...customIconsList.filter(icon => !Object.keys(iconMap).includes(icon))
    ];









    const toggleTag = (tagId, currentTags, setTags) => {
        if (currentTags.includes(tagId)) {
            setTags(currentTags.filter(t => t !== tagId));
        } else {
            setTags([...currentTags, tagId]);
        }
    };

    // Helper to render tag badges
    const renderTagBadge = (tagId, small = false) => {
        const tag = tagsMap[tagId];
        if (!tag) return null;
        const styles = getTagStyles ? getTagStyles(tagId) : { bg: 'bg-gray-100', text: 'text-gray-700' };
        return (
            <span
                key={tagId}
                className={`inline-flex items-center gap-1 ${small ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'} rounded-full ${styles.bg} ${styles.text}`}
            >
                {small ? null : <span>{tag.icon}</span>}
                <span>{tag.name}</span>
            </span>
        );
    };



    const tabs = [
        { id: 'tags', label: 'Tags', icon: '🏷️' },
        { id: 'icons', label: 'Icons', icon: '🎨' },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[60px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${activeTab === tab.id
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Stats/Dashboard Tab */}
            {activeTab === 'stats' && (
                <div className="space-y-6 animate-fade-in">
                    {/* 1. Hero Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="card p-5 border-l-4 border-primary-500">
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Total Items</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalItems}</span>
                                <span className="text-xs text-gray-400">SKUs</span>
                            </div>
                        </div>
                        <div className="card p-5 border-l-4 border-blue-500">
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Residents</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalResidents}</span>
                                <span className="text-xs text-gray-400">active</span>
                            </div>
                        </div>
                        <div className="card p-5 border-l-4 border-emerald-500">
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Health Score</div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl font-black ${stats.healthScore > 80 ? 'text-emerald-500' : stats.healthScore > 50 ? 'text-amber-500' : 'text-red-500'
                                    }`}>{stats.healthScore}%</span>
                            </div>
                        </div>
                        <div className="card p-5 border-l-4 border-red-500">
                            <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Alerts</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-red-500">
                                    {stats.lowStockItems.length + stats.outOfStockItems.length}
                                </span>
                                <span className="text-xs text-gray-400">items</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 2. Stock Health Visualization */}
                        <div className="card p-6 flex flex-col">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                📊 Stock Health Distribution
                            </h3>

                            <div className="flex-1 flex flex-col justify-center gap-8">
                                {/* Distribution Bar */}
                                <div className="h-8 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                                    <div style={{ width: `${(stats.wellStockedItems.length / stats.totalItems) * 100}%` }} className="h-full bg-emerald-500" />
                                    <div style={{ width: `${(stats.lowStockItems.length / stats.totalItems) * 100}%` }} className="h-full bg-amber-400" />
                                    <div style={{ width: `${(stats.outOfStockItems.length / stats.totalItems) * 100}%` }} className="h-full bg-red-500" />
                                </div>

                                {/* Legend / Stats */}
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl">
                                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.wellStockedItems.length}</div>
                                        <div className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">Healthy</div>
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.lowStockItems.length}</div>
                                        <div className="text-xs font-bold uppercase text-amber-800 dark:text-amber-300">Low</div>
                                    </div>
                                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
                                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.outOfStockItems.length}</div>
                                        <div className="text-xs font-bold uppercase text-red-800 dark:text-red-300">Empty</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Consumption Leaderboard */}
                        <div className="card p-6">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                🔥 Top Consumed Items
                            </h3>
                            <div className="space-y-4">
                                {stats.topItems.length > 0 ? stats.topItems.map((item, idx) => {
                                    const maxCount = stats.topItems[0].count; // Benchmark against top item
                                    const percent = (item.count / maxCount) * 100;
                                    return (
                                        <div key={item.name} className="relative">
                                            <div className="flex justify-between items-center mb-1 text-sm font-medium z-10 relative">
                                                <span className="flex items-center gap-2">
                                                    <span className="text-xs font-bold w-5 text-gray-400">#{idx + 1}</span>
                                                    <span>{item.name}</span>
                                                </span>
                                                <span className="font-bold text-gray-700 dark:text-gray-300">{item.count}</span>
                                            </div>
                                            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <div
                                                    style={{ width: `${percent}%` }}
                                                    className={`h-full rounded-full ${idx === 0 ? 'bg-primary-500' : 'bg-primary-300 dark:bg-primary-700'}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-gray-500 text-center py-4">No data available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 4. Actionable Alerts (Low/Out Stock) */}
                    {(stats.lowStockItems.length > 0 || stats.outOfStockItems.length > 0) && (
                        <div className="card overflow-hidden">
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center justify-between">
                                <h3 className="font-bold text-red-800 dark:text-red-200 flex items-center gap-2">
                                    ⚠️ Needs Attention ({stats.lowStockItems.length + stats.outOfStockItems.length})
                                </h3>
                                <span className="text-xs font-semibold px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-red-600 shadow-sm">
                                    Restock Recommended
                                </span>
                            </div>
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {[...stats.outOfStockItems, ...stats.lowStockItems].slice(0, 5).map(item => (
                                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{item.icon}</span>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    Stock: <span className={`font-bold ${item.currentStock === 0 ? 'text-red-600' : 'text-amber-500'}`}>{item.currentStock}</span>
                                                    {' '}/ Min: {item.minStock}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRestock && onRestock(item)}
                                            className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 dark:bg-gray-700 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            Restock
                                        </button>
                                    </div>
                                ))}
                                {stats.lowStockItems.length + stats.outOfStockItems.length > 5 && (
                                    <div className="p-3 text-center text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800/50">
                                        + {stats.lowStockItems.length + stats.outOfStockItems.length - 5} more items
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tags Tab - Tag Management */}
            {activeTab === 'tags' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="card p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Create New Tag
                        </h3>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTagIcon}
                                    onChange={(e) => setNewTagIcon(e.target.value)}
                                    placeholder="🏷️"
                                    className="input w-16 text-2xl text-center"
                                    maxLength={4}
                                />
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="Tag name..."
                                    className="input flex-1"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <span className="text-sm text-gray-500 mr-2">Color:</span>
                                {tagColors.map(color => (
                                    <button
                                        key={color.id}
                                        type="button"
                                        onClick={() => setNewTagColor(color.id)}
                                        className={`w-6 h-6 rounded-full ${color.dot} ${newTagColor === color.id ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                                            }`}
                                        aria-label={color.id}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    if (newTagName.trim()) {
                                        onAddTag(newTagName.trim(), newTagColor, newTagIcon);
                                        setNewTagName('');
                                        setNewTagIcon('🏷️');
                                        setNewTagColor('blue');
                                    }
                                }}
                                className="btn btn-primary w-full"
                                disabled={!newTagName.trim()}
                            >
                                Add Tag
                            </button>
                        </div>
                    </div>

                    {/* List of Tags */}
                    <div className="space-y-2">
                        {tags.map(tag => {
                            const styles = getTagStyles ? getTagStyles(tag.id) : { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
                            const isDefault = ['resident', 'donor', 'guest', 'staff'].includes(tag.id);
                            const isEditing = editingTag === tag.id;

                            return (
                                <div key={tag.id} className="card p-4">
                                    {isEditing ? (
                                        /* Edit Mode */
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editTagIcon}
                                                    onChange={(e) => setEditTagIcon(e.target.value)}
                                                    className="input w-16 text-2xl text-center"
                                                    maxLength={4}
                                                    placeholder="🏷️"
                                                />
                                                <input
                                                    type="text"
                                                    value={editTagName}
                                                    onChange={(e) => setEditTagName(e.target.value)}
                                                    className="input flex-1"
                                                    placeholder="Tag name"
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-sm text-gray-500 mr-2">Color:</span>
                                                {tagColors.map(color => (
                                                    <button
                                                        key={color.id}
                                                        type="button"
                                                        onClick={() => setEditTagColor(color.id)}
                                                        className={`w-6 h-6 rounded-full ${color.dot} ${editTagColor === color.id ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                                        aria-label={color.id}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingTag(null);
                                                        setEditTagName('');
                                                        setEditTagColor('blue');
                                                        setEditTagIcon('🏷️');
                                                    }}
                                                    className="btn btn-secondary flex-1"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (editTagName.trim()) {
                                                            onUpdateTag(tag.id, {
                                                                name: editTagName.trim(),
                                                                color: editTagColor,
                                                                icon: editTagIcon
                                                            });
                                                            setEditingTag(null);
                                                            setEditTagName('');
                                                            setEditTagColor('blue');
                                                            setEditTagIcon('🏷️');
                                                        }
                                                    }}
                                                    className="btn btn-primary flex-1"
                                                    disabled={!editTagName.trim()}
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Normal View */
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{tag.icon}</span>
                                                <div>
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${styles.bg} ${styles.text}`}>
                                                        {tag.name}
                                                    </span>
                                                    {isDefault && (
                                                        <span className="text-xs text-gray-400 ml-2">(default)</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingTag(tag.id);
                                                        setEditTagName(tag.name);
                                                        setEditTagColor(tag.color);
                                                        setEditTagIcon(tag.icon);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                    aria-label="Edit"
                                                    title="Edit tag"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                {!isDefault && (
                                                    <button
                                                        onClick={() => onRemoveTag(tag.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                        aria-label="Delete"
                                                        title="Delete tag"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Icons Tab - Custom Icon Management */}
            {activeTab === 'icons' && (
                <div className="space-y-4 animate-fade-in">
                    <div className="card p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                            Add Custom Icon
                        </h3>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newCustomIcon}
                                    onChange={(e) => setNewCustomIcon(e.target.value)}
                                    placeholder="Emoji (e.g. 🎉)"
                                    className="input w-24 text-2xl text-center"
                                    maxLength={4}
                                />
                                <input
                                    type="text"
                                    value={newCustomKeywords}
                                    onChange={(e) => setNewCustomKeywords(e.target.value)}
                                    placeholder="Keywords (comma separated, e.g. party, celebration)"
                                    className="input flex-1"
                                />
                            </div>
                            <button
                                onClick={() => {
                                    if (newCustomIcon.trim()) {
                                        const keywords = newCustomKeywords.split(',').map(k => k.trim().toLowerCase());
                                        onAddCustomIcon(newCustomIcon.trim(), keywords);
                                        setNewCustomIcon('');
                                        setNewCustomKeywords('');
                                    }
                                }}
                                disabled={!newCustomIcon.trim()}
                                className="btn btn-primary w-full"
                            >
                                Add Custom Icon
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                            💡 Keywords help auto-suggest icons when typing item names.
                        </p>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Your Custom Icons ({customIcons.length})
                    </h3>

                    <div className="space-y-2">
                        {customIcons.map((item) => (
                            <div key={item.id} className="card p-4">
                                {editingIcon === item.id ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={editIconValue}
                                                onChange={(e) => setEditIconValue(e.target.value)}
                                                className="input w-20 text-2xl text-center"
                                                maxLength={4}
                                            />
                                            <input
                                                type="text"
                                                value={editKeywordsValue}
                                                onChange={(e) => setEditKeywordsValue(e.target.value)}
                                                placeholder="Keywords (comma separated)"
                                                className="input flex-1"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingIcon(null)}
                                                className="btn btn-secondary flex-1"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const keywords = editKeywordsValue.split(',').map(k => k.trim().toLowerCase());
                                                    onUpdateCustomIcon(item.id, editIconValue.trim(), keywords);
                                                    setEditingIcon(null);
                                                }}
                                                className="btn btn-primary flex-1"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{item.icon}</span>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {item.keywords && item.keywords.length > 0
                                                        ? item.keywords.join(', ')
                                                        : 'No keywords'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingIcon(item.id);
                                                    setEditIconValue(item.icon);
                                                    setEditKeywordsValue(item.keywords?.join(', ') || '');
                                                }}
                                                className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                                                aria-label="Edit icon"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onRemoveCustomIcon(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                aria-label="Delete icon"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {customIcons.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <p className="text-4xl mb-3">🎨</p>
                                <p>No custom icons yet</p>
                                <p className="text-sm">Add emojis above to use them for items</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Unsaved Changes Alert */}
            {showUnsavedAlert && createPortal(
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="card p-6 w-full max-w-sm animate-scale-up text-center shadow-2xl">
                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            ⚠️
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Unsaved Changes
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            You have not saved the change, do you want to save it or not?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowUnsavedAlert(false);
                                    if (typeof pendingAction === 'function') {
                                        try {
                                            pendingAction();
                                        } catch (e) {
                                            console.error("Error executing pending action:", e);
                                        }
                                    }
                                }}
                                className="btn btn-secondary flex-1"
                            >
                                No
                            </button>
                            <button
                                onClick={() => {
                                    setShowUnsavedAlert(false);
                                    if (typeof saveAction === 'function') {
                                        try {
                                            saveAction();
                                        } catch (e) {
                                            console.error("Error executing save action:", e);
                                        }
                                    }
                                }}
                                className="btn btn-primary flex-1"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
