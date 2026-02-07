const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'src/database/database.sqlite');
const db = new Database(dbPath);

const tables = [
  'Users_backup',
  'Products_backup', 
  'Categories_backup',
  'Orders_backup',
  'Coupons_backup',
  'OrderItems_backup',
  'Payments_backup',
  'Carts_backup',
  'CartItems_backup',
  'Settings_backup',
  'ProductImages_backup'
];

tables.forEach(table => {
  try {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
    console.log(`Dropped: ${table}`);
  } catch (e) {
    console.log(`Error dropping ${table}: ${e.message}`);
  }
});

console.log('Done!');
db.close();
