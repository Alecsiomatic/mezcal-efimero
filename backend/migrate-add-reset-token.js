const sequelize = require('./src/config/database');
const { User } = require('./src/models');

async function migrate() {
  try {
    console.log('Starting migration: Adding resetToken fields to User table...');
    
    // Sync the model to add new columns if they don't exist
    await sequelize.sync({ alter: true });
    
    console.log('✅ Migration completed successfully!');
    console.log('Added columns: resetToken, resetTokenExpiry');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
