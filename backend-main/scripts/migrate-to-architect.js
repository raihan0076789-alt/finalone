// backend-main/scripts/migrate-to-architect.js
// Run once:  node scripts/migrate-to-architect.js
// Safe to re-run — uses $setOnInsert-style logic so existing values are preserved.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/house_architect';

async function migrate() {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB:', MONGODB_URI);

    const db = mongoose.connection.db;
    const col = db.collection('users');

    // Step 1: Promote all 'user' role → 'architect'
    const roleResult = await col.updateMany(
        { role: 'user' },
        { $set: { role: 'architect' } }
    );
    console.log(`[1/3] Role updated: ${roleResult.modifiedCount} documents 'user' → 'architect'`);

    // Step 2: Add new professional fields with defaults only where they don't exist yet
    const fieldsResult = await col.updateMany(
        {
            $or: [
                { bio:            { $exists: false } },
                { location:       { $exists: false } },
                { specialization: { $exists: false } },
                { experience:     { $exists: false } },
                { portfolio:      { $exists: false } },
                { rating:         { $exists: false } },
                { totalProjects:  { $exists: false } }
            ]
        },
        {
            $set: {
                bio:            '',
                location:       '',
                specialization: '',
                experience:     0,
                portfolio:      [],
                rating:         0,
                totalProjects:  0
            }
        }
    );
    console.log(`[2/3] Professional fields backfilled: ${fieldsResult.modifiedCount} documents`);

    // Step 3: Verify — count remaining legacy 'user' roles
    const legacyCount = await col.countDocuments({ role: 'user' });
    const architectCount = await col.countDocuments({ role: 'architect' });
    const adminCount = await col.countDocuments({ role: 'admin' });
    console.log(`[3/3] Final counts — architect: ${architectCount}, admin: ${adminCount}, legacy user: ${legacyCount}`);

    if (legacyCount > 0) {
        console.warn('⚠️  Some documents still have role=user. Check for write errors above.');
    } else {
        console.log('✅  Migration complete. All users are now architects.');
    }

    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});