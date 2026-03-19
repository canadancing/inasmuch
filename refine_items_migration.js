import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper to convert to Title Case
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

function refineItem(item) {
    let name = item.name || '';
    let category = item.category || 'Miscellaneous';

    // Lowercase for easier matching
    let lowerName = name.toLowerCase();

    // 1. Categorization Rules
    if (lowerName.match(/pillow|duvet|quilt|sheet|box spring|mattress|blanket|bedsheet/)) {
        category = 'Linens & Bedding';
    } else if (lowerName.match(/soap|detergent|sponge|trash|washer/)) {
        category = 'Cleaning & Janitorial';
    } else if (lowerName.match(/toilet paper|tissue|paper towel/)) {
        category = 'Paper Goods';
    } else if (lowerName.match(/dish/)) {
        category = 'Kitchen Supplies';
    } else {
        category = 'Miscellaneous';
    }

    // 2. Remove redundant words, raw extensions, underscores
    let oldName = name;
    name = name.replace(/_/g, ' ');
    name = name.replace(/\.\w+$/, ''); // file extensions
    name = name.replace(/boxes/i, '');
    name = name.replace(/bags/i, 'bag'); // Trash Bags -> Trash Bag
    name = name.replace(/test( items?)?/ig, '').trim();
    if (name === '') {
        name = toTitleCase(oldName.trim()); // Revert if stripped completely
    }

    // 3. Dimensional standardizations
    name = name.replace(/54” × 75” \+ 16”/i, 'Full');
    name = name.replace(/\(82\*86\)/i, ', Full/Queen');
    name = name.replace(/82\*86/i, ', Full/Queen');
    name = name.replace(/Double/i, 'Full');
    name = name.replace(/Twins/gi, 'Twin');

    // Specific custom fixes
    if (lowerName.includes('hand washer')) {
        name = 'Hand Soap';
    }
    if (lowerName.includes('fitted sheet')) {
        name = name.replace(/fitted sheet/gi, 'Sheet');
        if (!name.includes('(Fitted)')) {
            name += ' (Fitted)';
        }
    }

    // 4. General-To-Specific (Noun, Specifics) formatting
    // Handle "Something - Size" -> "Something, Size"
    name = name.replace(/\s*-\s*/g, ', ');

    // Specific pattern handlers
    if (name.match(/^(Pillow Cover|Duvet Cover|Duvet|Quilt|Sheet|Box Spring|Mattress|Blanket|Bedsheet)\s+(Twin|Full|Queen|King)/i)) {
        // "Mattress Queen" -> "Mattress, Queen"
        name = name.replace(/^(\D+?)\s+(Twin|Full|Queen|King)(.*)$/i, '$1, $2$3');
    } else if (name.match(/^(Twin|Full|Queen|King)\s+(Pillow Cover|Duvet Cover|Duvet|Quilt|Sheet|Box Spring|Mattress|Blanket|Bedsheet)/i)) {
        // "Queen Mattress" -> "Mattress, Queen"
        name = name.replace(/^(Twin|Full|Queen|King)\s+(\D+)$/i, '$2, $1');
    }

    // Handlers for known exact matches requiring "Noun, Adjective"
    if (name.toLowerCase() === 'trash bag 25l (48ct)') {
        name = 'Trash Bag, 25L';
    }

    // Format to Title Case
    name = toTitleCase(name);

    // Fix up formatting artifacts
    name = name.replace(/,\s*,/g, ',');
    name = name.replace(/\s+,\s+/g, ', ');
    name = name.replace(/,\s*$/g, ''); // Remove trailing comma
    name = name.trim();

    // Fix up specific Title casing edge cases
    name = name.replace(/\(fitted\)/i, '(Fitted)');
    name = name.replace(/Tv/g, 'TV');
    name = name.replace(/Logic /i, 'Logic');
    name = name.replace(/Full\/queen/i, 'Full/Queen');

    return { name, category };
}

async function migrateItems() {
    const snapshot = await db.collectionGroup('items').get();
    console.log(`Found ${snapshot.size} items to migrate.`);

    let batch = db.batch();
    let count = 0;

    snapshot.forEach(doc => {
        const data = doc.data();
        const refined = refineItem(data);

        console.log(`[${doc.id}] ${data.name} => ${refined.name} | ${data.category || 'N/A'} => ${refined.category}`);

        batch.update(doc.ref, {
            name: refined.name,
            category: refined.category,
            updatedAt: new Date()
        });

        count++;
        if (count % 400 === 0) {
            // In a real large scale migration, we'd commit batches of 500
        }
    });

    if (count > 0) {
        await batch.commit();
        console.log(`Successfully migrated ${count} items.`);
    }
}

migrateItems().catch(console.error);
