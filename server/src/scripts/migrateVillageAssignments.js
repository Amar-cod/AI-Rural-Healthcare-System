const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Village = require('../models/Village');
const AshaWorkerProfile = require('../models/AshaWorkerProfile');

async function migrate() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rhcs';
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for migration');

    const profiles = await AshaWorkerProfile.find({}).lean();
    
    let migratedCount = 0;
    
    for (const profile of profiles) {
      if (profile.assignedVillageIds && profile.assignedVillageIds.length > 0) {
        for (const villageId of profile.assignedVillageIds) {
          const village = await Village.findById(villageId);
          if (village) {
            const ashaWorkerIdStr = profile.userId.toString();
            const isAssigned = village.assignedAshaWorkerIds.some(id => id.toString() === ashaWorkerIdStr);
            if (!isAssigned) {
              village.assignedAshaWorkerIds.push(profile.userId);
              await village.save();
              migratedCount++;
              console.log(`Migrated ASHA ${profile.userId} to Village ${village.name}`);
            }
          }
        }
      }
    }

    const villages = await Village.find({});
    for (const village of villages) {
      const originalLength = village.assignedAshaWorkerIds.length;
      const uniqueIdsMap = new Map();
      for (const id of village.assignedAshaWorkerIds) {
        uniqueIdsMap.set(id.toString(), id);
      }
      const uniqueIds = Array.from(uniqueIdsMap.values());
      
      if (uniqueIds.length !== originalLength) {
        village.assignedAshaWorkerIds = uniqueIds;
        await village.save();
        console.log(`Cleaned up duplicates for Village ${village.name}: Reduced from ${originalLength} to ${uniqueIds.length}`);
      }
    }

    console.log(`Migration Complete. Successfully migrated ${migratedCount} assignments.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
