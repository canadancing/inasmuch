// Migration script to add collaboratorUids array to existing inventories  
// Standalone Node.js script with hardcoded Firebase config
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase config from environment variables
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Validate config
if (!firebaseConfig.apiKey) {
    console.error('❌ Error: Firebase configuration missing. Make sure to run with environment variables.');
    console.error('Usage: node --env-file=.env migrations/add-collaborator-uids.js');
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addCollaboratorUidsField() {
    console.log('🚀 Starting migration to add collaboratorUids field...\\n');

    try {
        // Get all inventories
        console.log('📋 Fetching all inventories...');
        const inventoriesSnapshot = await getDocs(collection(db, 'inventories'));
        console.log(`   Found ${inventoriesSnapshot.docs.length} inventories\\n`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        // Update each inventory
        for (const inventoryDoc of inventoriesSnapshot.docs) {
            try {
                const data = inventoryDoc.data();

                // Check if collaboratorUids already exists
                if (data.collaboratorUids) {
                    console.log(`   ⏭️  Skipping ${inventoryDoc.id} - already has collaboratorUids`);
                    skipped++;
                    continue;
                }

                // Extract collaborator UIDs from collaborators object
                const collaborators = data.collaborators || {};
                const collaboratorUids = Object.keys(collaborators);

                // Update the inventory
                await updateDoc(doc(db, 'inventories', inventoryDoc.id), {
                    collaboratorUids: collaboratorUids
                });

                console.log(`   ✅ Updated ${inventoryDoc.id} - added ${collaboratorUids.length} collaborator(s)`);
                updated++;

            } catch (error) {
                console.error(`   ❌ Failed to update ${inventoryDoc.id}:`, error.message);
                errors++;
            }
        }

        console.log('\\n📊 Migration Summary:');
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log('\\n✅ Migration completed!\\n');

    } catch (error) {
        console.error('\\n❌ Migration failed:', error);
    }
}

// Run the migration
addCollaboratorUidsField().then(() => {
    console.log('Done! You can now close this process.');
    process.exit(0);
}).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
