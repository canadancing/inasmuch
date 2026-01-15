import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ResidentSelector from './ResidentSelector';
import SearchableSection from './SearchableSection';

export default function AdminPanel({
    residents,
    items,
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
    const [activeTab, setActiveTab] = useState('residents');
    const [restockResident, setRestockResident] = useState(null);
    const [restockDate, setRestockDate] = useState(new Date().toISOString().split('T')[0]);
    // Resident form state (for add/edit modal)
    const [showResidentModal, setShowResidentModal] = useState(false);
    const [residentForm, setResidentForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        room: '',
        country: '',
        moveInDate: '',
        moveOutDate: '',
        notes: '',
        tags: ['resident']
    });
    const [editingResident, setEditingResident] = useState(null);
    // Item state
    const [newItemName, setNewItemName] = useState('');
    const [newItemIcon, setNewItemIcon] = useState('📦');
    const [restockItem, setRestockItem] = useState(null);
    const [restockQuantity, setRestockQuantity] = useState(1);
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [iconSearch, setIconSearch] = useState('');
    // Custom icon editing state
    const [newCustomIcon, setNewCustomIcon] = useState('');
    const [newCustomKeywords, setNewCustomKeywords] = useState('');
    const [editingIcon, setEditingIcon] = useState(null);
    const [editIconValue, setEditIconValue] = useState('');
    const [editKeywordsValue, setEditKeywordsValue] = useState('');
    // Item editing state
    const [editingItem, setEditingItem] = useState(null);
    const [editItemName, setEditItemName] = useState('');
    const [editItemIcon, setEditItemIcon] = useState('');
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

    // Initial state for dirty checking
    const [initialResidentForm, setInitialResidentForm] = useState(null);
    const [initialItemState, setInitialItemState] = useState(null);

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

    // Smart icon suggestion based on item name
    useEffect(() => {
        if (!newItemName.trim()) {
            setNewItemIcon('📦');
            return;
        }

        const name = newItemName.toLowerCase();

        // Find matching icon (check combined map including custom icons)
        for (const [icon, keywords] of Object.entries(combinedIconMap)) {
            for (const keyword of keywords) {
                if (name.includes(keyword)) {
                    setNewItemIcon(icon);
                    return;
                }
            }
        }

        // No match - keep current or use default
    }, [newItemName, combinedIconMap]);

    // Filter icons based on search
    const filteredIcons = iconSearch.trim()
        ? allIcons.filter(icon => {
            const keywords = combinedIconMap[icon] || [];
            const iconStr = icon.toLowerCase();
            const searchLower = iconSearch.toLowerCase();
            return keywords.some(k => k.includes(searchLower)) || iconStr.includes(searchLower);
        })
        : allIcons;

    // Reset resident form (Force Close)
    const resetResidentForm = () => {
        setResidentForm({
            firstName: '',
            lastName: '',
            phone: '',
            room: '',
            country: '',
            moveInDate: '',
            moveOutDate: '',
            notes: '',
            tags: ['resident']
        });
        setEditingResident(null);
        setShowResidentModal(false);
        setInitialResidentForm(null);
    };

    // Attempt to close resident modal (Check for unsaved changes)
    const attemptCloseResidentModal = () => {
        const currentString = JSON.stringify(residentForm);
        const initialString = JSON.stringify(initialResidentForm);

        if (initialResidentForm && currentString !== initialString) {
            // Unsaved changes detected
            setPendingAction(() => () => resetResidentForm());
            setSaveAction(() => () => handleSaveResident());
            setShowUnsavedAlert(true);
        } else {
            // No changes, just close
            resetResidentForm();
        }
    };

    // Handle opening add modal
    const openAddResidentModal = () => {
        const emptyForm = {
            firstName: '',
            lastName: '',
            phone: '',
            room: '',
            country: '',
            moveInDate: '',
            moveOutDate: '',
            notes: '',
            tags: ['resident']
        };
        setResidentForm(emptyForm);
        setInitialResidentForm(emptyForm);
        setEditingResident(null);
        setShowResidentModal(true);
    };

    // Handle opening edit modal
    const openEditResidentModal = (resident) => {
        // Handle legacy data where name might be combined in 'name' field
        let fName = resident.firstName || '';
        let lName = resident.lastName || '';

        if (!fName && !lName && resident.name) {
            const parts = resident.name.trim().split(' ');
            fName = parts[0] || '';
            lName = parts.slice(1).join(' ') || '';
        }

        const formData = {
            firstName: fName,
            lastName: lName,
            phone: resident.phone || '',
            room: resident.room || '',
            country: resident.country || '',
            moveInDate: resident.moveInDate || '',
            moveOutDate: resident.moveOutDate || '',
            notes: resident.notes || '',
            tags: resident.tags || ['resident']
        };

        setResidentForm(formData);
        setInitialResidentForm(formData);
        setEditingResident(resident);
        setShowResidentModal(true);
    };

    // Handle form field change
    const updateResidentField = (field, value) => {
        setResidentForm(prev => ({ ...prev, [field]: value }));
    };

    // Handle form submission (add or update)
    const handleSaveResident = () => {
        if (!residentForm.firstName.trim()) return;

        if (editingResident) {
            onUpdateResident(editingResident.id, residentForm);
        } else {
            onAddResident(residentForm);
        }
        resetResidentForm();
    };

    // Toggle tag in form
    const toggleFormTag = (tagId) => {
        const current = residentForm.tags || [];
        if (current.includes(tagId)) {
            updateResidentField('tags', current.filter(t => t !== tagId));
        } else {
            updateResidentField('tags', [...current, tagId]);
        }
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        if (newItemName.trim()) {
            onAddItem(newItemName.trim(), newItemIcon);
            setNewItemName('');
            setNewItemIcon('📦');
        }
    };

    const handleSaveItem = (item) => {
        onUpdateItem(item.id, {
            name: editItemName,
            icon: editItemIcon
        });
        setEditingItem(null);
    };

    const attemptCancelEditItem = (item) => {
        const currentString = JSON.stringify({ name: editItemName, icon: editItemIcon });
        const initialString = JSON.stringify(initialItemState);

        if (initialItemState && currentString !== initialString) {
            setPendingAction(() => () => setEditingItem(null)); // Closure to clear specific item
            setSaveAction(() => () => handleSaveItem(item));
            setShowUnsavedAlert(true);
        } else {
            setEditingItem(null);
        }
    };

    const handleRestock = () => {
        if (restockItem && restockResident && restockQuantity > 0) {
            const [year, month, day] = restockDate.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);

            const todayStr = new Date().toISOString().split('T')[0];
            if (restockDate === todayStr) {
                const now = new Date();
                dateObj.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            } else {
                dateObj.setHours(12, 0, 0, 0);
            }

            const residentFullName = `${restockResident.firstName || ''} ${restockResident.lastName || ''}`.trim() || restockResident.name || 'Unknown';
            onRestock(restockItem.id, restockItem.name, restockQuantity, restockResident.id, residentFullName, dateObj);
            setRestockItem(null);
            setRestockQuantity(1);
            setRestockResident(null);
            setRestockDate(new Date().toISOString().split('T')[0]);
        }
    };

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
        { id: 'residents', label: 'People', icon: '👥' },
        { id: 'items', label: 'Items', icon: '📦' },
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

            {/* Residents Tab */}
            {activeTab === 'residents' && (
                <div className="space-y-4 animate-fade-in">
                    {/* Add Person Button */}
                    <button
                        onClick={openAddResidentModal}
                        className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Person
                    </button>

                    {/* Person List */}
                    <div className="space-y-2">
                        {residents.map((resident) => {
                            const fullName = `${resident.firstName || ''} ${resident.lastName || ''}`.trim() || resident.name || 'Unknown';
                            const initial = (resident.firstName || resident.name || 'U').charAt(0).toUpperCase();

                            return (
                                <div key={resident.id} className="card p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {initial}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-semibold text-gray-900 dark:text-white block">{fullName}</span>
                                                {resident.room && (
                                                    <span className="text-sm text-gray-500 block">📍 {resident.room}</span>
                                                )}
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(resident.tags || []).map(tagId => renderTagBadge(tagId, true))}
                                                </div>
                                                {resident.phone && (
                                                    <span className="text-xs text-gray-400 block mt-1">📞 {resident.phone}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                onClick={() => openEditResidentModal(resident)}
                                                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                aria-label="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onRemoveResident(resident.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                aria-label="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {residents.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No people added yet
                            </div>
                        )}
                    </div>

                    {/* Add/Edit Person Modal */}
                    {showResidentModal && createPortal(
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="card w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-slide-up shadow-2xl">
                                {/* Fixed Header */}
                                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {editingResident ? 'Edit Person' : 'Add New Person'}
                                    </h3>
                                    <button
                                        onClick={attemptCloseResidentModal}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Scrollable Body */}
                                <div className="flex-1 overflow-y-auto p-6">
                                    <div className="space-y-4">
                                        {/* Name Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    First Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={residentForm.firstName}
                                                    onChange={(e) => updateResidentField('firstName', e.target.value)}
                                                    className="input w-full"
                                                    placeholder="John"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Last Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={residentForm.lastName}
                                                    onChange={(e) => updateResidentField('lastName', e.target.value)}
                                                    className="input w-full"
                                                    placeholder="Doe"
                                                />
                                            </div>
                                        </div>

                                        {/* Contact Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    📞 Phone
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={residentForm.phone}
                                                    onChange={(e) => updateResidentField('phone', e.target.value)}
                                                    className="input w-full"
                                                    placeholder="555-0123"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    📍 Room
                                                </label>
                                                <input
                                                    type="text"
                                                    value={residentForm.room}
                                                    onChange={(e) => updateResidentField('room', e.target.value)}
                                                    className="input w-full"
                                                    placeholder="Room 101"
                                                />
                                            </div>
                                        </div>

                                        {/* Country */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                🌍 Country of Origin
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setShowCountryPicker(true)}
                                                className="input w-full text-left flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <span className="text-xl">{getCountryFlag(residentForm.country)}</span>
                                                <span className={residentForm.country ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                                                    {residentForm.country || 'Select country...'}
                                                </span>
                                            </button>
                                        </div>

                                        {/* Dates Row */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    📅 Move-in Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={residentForm.moveInDate}
                                                    onChange={(e) => updateResidentField('moveInDate', e.target.value)}
                                                    className="input w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    📅 Move-out Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={residentForm.moveOutDate}
                                                    onChange={(e) => updateResidentField('moveOutDate', e.target.value)}
                                                    className="input w-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                🏷️ Tags
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {tags.map(tag => {
                                                    const isSelected = (residentForm.tags || []).includes(tag.id);
                                                    const styles = getTagStyles ? getTagStyles(tag.id) : { bg: 'bg-gray-100', text: 'text-gray-700' };
                                                    return (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => toggleFormTag(tag.id)}
                                                            className={`inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-full transition-all ${isSelected
                                                                ? `${styles.bg} ${styles.text} ring-2 ring-offset-1 ring-current`
                                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                                                }`}
                                                        >
                                                            <span>{tag.icon}</span>
                                                            <span>{tag.name}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                📝 Notes
                                            </label>
                                            <textarea
                                                value={residentForm.notes}
                                                onChange={(e) => updateResidentField('notes', e.target.value)}
                                                className="input w-full h-24 resize-none"
                                                placeholder="Any additional notes about this person..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Fixed Footer */}
                                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={attemptCloseResidentModal}
                                            className="btn btn-secondary flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveResident}
                                            className="btn btn-primary flex-1"
                                            disabled={!residentForm.firstName.trim()}
                                        >
                                            {editingResident ? 'Save Changes' : 'Add Person'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Country Picker Modal - nested within backdrop, will stay relative to it */}
                            {showCountryPicker && (
                                <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                                    <div className="card p-4 w-full max-w-md max-h-[70vh] flex flex-col animate-slide-up shadow-2xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Select Country
                                            </h3>
                                            <button
                                                onClick={() => {
                                                    setShowCountryPicker(false);
                                                    setCountrySearch('');
                                                }}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>

                                        <input
                                            type="text"
                                            value={countrySearch}
                                            onChange={(e) => setCountrySearch(e.target.value)}
                                            placeholder="Search countries..."
                                            className="input mb-3"
                                            autoFocus
                                        />

                                        <div className="flex-1 overflow-y-auto space-y-1">
                                            {filteredCountries.map((country) => (
                                                <button
                                                    key={country.code}
                                                    type="button"
                                                    onClick={() => {
                                                        updateResidentField('country', country.name);
                                                        setShowCountryPicker(false);
                                                        setCountrySearch('');
                                                    }}
                                                    className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition-colors ${residentForm.country === country.name
                                                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                                                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                                                        }`}
                                                >
                                                    <span className="text-2xl">{country.flag}</span>
                                                    <span className="font-medium">{country.name}</span>
                                                </button>
                                            ))}
                                            {filteredCountries.length === 0 && (
                                                <p className="text-center text-gray-500 py-8">
                                                    No countries match "{countrySearch}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>,
                        document.body
                    )}
                </div>
            )}

            {/* Items Tab */}
            {activeTab === 'items' && (
                <div className="space-y-4 animate-fade-in">
                    <form onSubmit={handleAddItem} className="space-y-3">
                        <div className="flex gap-2">
                            {/* Icon button - opens picker */}
                            <button
                                type="button"
                                onClick={() => setShowIconPicker(true)}
                                className="input w-16 h-12 text-2xl text-center flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                title="Click to change icon"
                            >
                                {newItemIcon}
                            </button>
                            <input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="New item name..."
                                className="input flex-1"
                            />
                            <button type="submit" className="btn btn-primary" disabled={!newItemName.trim()}>
                                Add
                            </button>
                        </div>
                        {newItemName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                💡 Icon auto-suggested based on name. Tap icon to change.
                            </p>
                        )}
                    </form>

                    {/* Icon Picker Modal */}
                    {showIconPicker && createPortal(
                        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="card p-4 w-full max-w-md max-h-[70vh] flex flex-col animate-slide-up shadow-2xl">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Choose Icon
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setShowIconPicker(false);
                                            setIconSearch('');
                                        }}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <input
                                    type="text"
                                    value={iconSearch}
                                    onChange={(e) => setIconSearch(e.target.value)}
                                    placeholder="Search icons... (e.g. phone, soap, battery)"
                                    className="input mb-4"
                                    autoFocus
                                />

                                <div className="flex-1 overflow-y-auto">
                                    <div className="grid grid-cols-6 gap-2">
                                        {filteredIcons.map((icon) => (
                                            <button
                                                key={icon}
                                                type="button"
                                                onClick={() => {
                                                    setNewItemIcon(icon);
                                                    setShowIconPicker(false);
                                                    setIconSearch('');
                                                }}
                                                className={`p-3 text-2xl rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${newItemIcon === icon ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' : ''
                                                    }`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                    {filteredIcons.length === 0 && (
                                        <p className="text-center text-gray-500 py-8">
                                            No icons match "{iconSearch}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}

                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="card p-4">
                                {editingItem === item.id ? (
                                    /* Edit Mode */
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowIconPicker(true)}
                                                className="input w-14 h-12 text-2xl text-center flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700"
                                            >
                                                {editItemIcon}
                                            </button>
                                            <input
                                                type="text"
                                                value={editItemName}
                                                onChange={(e) => setEditItemName(e.target.value)}
                                                className="input flex-1"
                                                placeholder="Item name"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => attemptCancelEditItem(item)}
                                                className="btn btn-secondary flex-1"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSaveItem(item)}
                                                className="btn btn-primary flex-1"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Normal View */
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{item.icon}</span>
                                            <div>
                                                <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                                                <p className="text-sm text-gray-500">Stock: {item.currentStock}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setRestockItem(item)}
                                                className="btn btn-success text-sm py-2 px-3"
                                            >
                                                Restock
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingItem(item.id);
                                                    setEditItemName(item.name);
                                                    setEditItemIcon(item.icon);
                                                    setInitialItemState({ name: item.name, icon: item.icon });
                                                }}
                                                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                aria-label="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => onUpdateItem(item.id, { hidden: !item.hidden })}
                                                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors ${item.hidden ? 'text-gray-400 hover:text-primary-500' : 'text-primary-500 hover:text-gray-400'}`}
                                                aria-label={item.hidden ? "Unhide Item" : "Hide Item"}
                                                title={item.hidden ? "Unhide Item" : "Hide Item"}
                                            >
                                                {item.hidden ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => onRemoveItem(item.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                aria-label="Delete"
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
                        {items.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No items added yet
                            </div>
                        )}
                    </div>

                    {/* Restock Modal */}
                    {restockItem && createPortal(
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <div className="card p-6 w-full max-w-sm animate-slide-up shadow-2xl">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
                                    Restock {restockItem.name}
                                </h3>

                                <div className="mb-6 mt-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 text-center">Who is restocking?</p>
                                    <ResidentSelector
                                        residents={residents}
                                        selectedResident={restockResident}
                                        onSelect={setRestockResident}
                                    />
                                </div>

                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <button
                                        onClick={() => setRestockQuantity(Math.max(1, restockQuantity - 1))}
                                        className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold"
                                    >
                                        −
                                    </button>
                                    <span className="text-3xl font-bold w-16 text-center">{restockQuantity}</span>
                                    <button
                                        onClick={() => setRestockQuantity(restockQuantity + 1)}
                                        className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl font-bold"
                                    >
                                        +
                                    </button>
                                </div>

                                {/* Date Selection */}
                                <div className="mb-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Restock Date</span>
                                    <input
                                        type="date"
                                        value={restockDate}
                                        onChange={(e) => setRestockDate(e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-xl text-sm font-medium border-none focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setRestockItem(null);
                                            setRestockDate(new Date().toISOString().split('T')[0]);
                                        }}
                                        className="btn btn-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRestock}
                                        className={`btn btn-success flex-1 ${!restockResident ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        disabled={!restockResident}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
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
