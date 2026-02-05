// Admin SDK Migration Script
// Adds collaboratorUids field to all inventories in the database
// Requires: npm install firebase-admin

const admin = require('firebase-admin');

// Initialize Admin SDK
// Using service account key for authentication
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addCollaboratorUidsToAllInventories() {
    console.log('🚀 Starting migration to add collaboratorUids field...\n');

    try {
        // Get all inventories
        console.log('📋 Fetching all inventories...');
        const inventoriesSnapshot = await db.collection('inventories').get();
        console.log(`   Found ${inventoriesSnapshot.docs.length} inventories\n`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        // Use batch for efficient updates (max 500 per batch)
        let batch = db.batch();
        let batchCount = 0;

        for (const inventoryDoc of inventoriesSnapshot.docs) {
            try {
                const data = inventoryDoc.data();
                const inventoryId = inventoryDoc.id;

                // Check if collaboratorUids already exists
                if (data.collaboratorUids !== undefined) {
                    console.log(`   ⏭️  Skipping ${inventoryId} - already has collaboratorUids`);
                    skipped++;
                    continue;
                }

                // Extract collaborator UIDs from collaborators object
                const collaborators = data.collaborators || {};
                const collaboratorUids = Object.keys(collaborators);

                // Add to batch
                batch.update(inventoryDoc.ref, {
                    collaboratorUids: collaboratorUids
                });
                batchCount++;

                console.log(`   ✅ Queued ${inventoryId} - will add ${collaboratorUids.length} collaborator(s)`);
                updated++;

                // Commit batch every 500 operations
                if (batchCount >= 500) {
                    await batch.commit();
                    console.log(`   💾 Committed batch of ${batchCount} updates`);
                    batch = db.batch();
                    batchCount = 0;
                }

            } catch (error) {
                console.error(`   ❌ Failed to update ${inventoryDoc.id}:`, error.message);
                errors++;
            }
        }

        // Commit remaining batch
        if (batchCount > 0) {
            await batch.commit();
            console.log(`   💾 Committed final batch of ${batchCount} updates`);
        }

        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log('\n✅ Migration completed!\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    }
}

// Run the migration
addCollaboratorUidsToAllInventories()
    .then(() => {
        console.log('Done! All inventories updated.');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
