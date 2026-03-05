import { config } from 'dotenv';
import { connect } from 'mongoose';
import { KYCUserModel } from '../modules/kyc/model/kyc-user.model';

config();

async function addSoftDeleteToKYC() {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    console.log('Connecting to MongoDB...');
    await connect(mongoUri);

    console.log('✅ Connected to MongoDB');
    console.log('Adding soft delete fields to KYC Users...\n');

    // Count total records
    const totalCount = await KYCUserModel.countDocuments({});
    console.log(`📊 Total KYC records: ${totalCount}`);

    // Count records without soft delete fields
    const recordsWithoutFields = await KYCUserModel.countDocuments({
      isDeleted: { $exists: false },
    });
    console.log(
      `📝 Records without soft delete fields: ${recordsWithoutFields}\n`,
    );

    if (recordsWithoutFields === 0) {
      console.log(
        '✅ All records already have soft delete fields. Migration not needed.',
      );
      process.exit(0);
    }

    // Update KYC Users
    const result = await KYCUserModel.updateMany(
      { isDeleted: { $exists: false } },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
        },
      },
    );

    console.log(`✅ Updated ${result.modifiedCount} KYC users`);

    // Verify migration
    const verifyCount = await KYCUserModel.countDocuments({
      isDeleted: { $exists: true },
    });

    // Show sample record
    const sampleRecord = await KYCUserModel.findOne({})
      .select('firstName lastName email isDeleted deletedAt deletedBy')
      .lean();

    if (sampleRecord) {
      console.log('\n📄 Sample record after migration:');
      console.log(JSON.stringify(sampleRecord, null, 2));
    }

    console.log('\n========================================');
    console.log('MIGRATION SUMMARY');
    console.log('========================================');
    console.log(`Total KYC Records: ${totalCount}`);
    console.log(`Records Updated: ${result.modifiedCount}`);
    console.log(
      `Verification: ${verifyCount}/${totalCount} records have soft delete fields`,
    );
    console.log('========================================');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addSoftDeleteToKYC();
