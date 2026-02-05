// Migration script to add collaboratorUids array to existing inventories  
// Standalone Node.js script with hardcoded Firebase config
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase config from .env
const firebaseConfig = {
    apiKey: 'AIzaSyDeoz2takCZM00ycA87NQOogpLutxZsA9s',
    authDomain: 'inasmuch-909c7.firebaseapp.com',
    projectId: 'inasmuch-909c7',
    storageBucket: 'inasmuch-909c7.firebasestorage.app',
    messagingSenderId: '984547364434',
    appId: '1:984547364434:web:1caed19d0d50cd5d89d98b'
};

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
