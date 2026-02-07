// Script to add payment receipt columns to existing Orders table
const sequelize = require('../config/database');

async function migrate() {
  try {
    console.log('Starting migration...');
    
    // Add columns one by one
    const columns = [
      'paymentReceipt VARCHAR(255)',
      'paymentReceiptNotes TEXT',
      'paymentConfirmedAt DATETIME',
      'paymentConfirmedBy VARCHAR(36)'
    ];

    for (const column of columns) {
      const columnName = column.split(' ')[0];
      try {
        await sequelize.query(`ALTER TABLE Orders ADD COLUMN ${column}`);
        console.log(`✓ Added column: ${columnName}`);
      } catch (err) {
        if (err.message.includes('duplicate column name')) {
          console.log(`- Column ${columnName} already exists, skipping`);
        } else {
          console.error(`✗ Error adding ${columnName}:`, err.message);
        }
      }
    }

    console.log('\nMigration completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
