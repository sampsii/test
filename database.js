const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'inventory.db');

function initializeDatabase() {
  const db = new Database(DB_PATH);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as cnt FROM products').get();
  if (count.cnt === 0) {
    const insert = db.prepare(`
      INSERT INTO products (name, category, sku, price, quantity, description)
      VALUES (@name, @category, @sku, @price, @quantity, @description)
    `);

    const products = [
      { name: 'Wireless Bluetooth Headphones', category: 'Electronics', sku: 'ELEC-001', price: 79.99, quantity: 42, description: 'Over-ear noise cancelling headphones with 30hr battery' },
      { name: 'USB-C Charging Cable (2m)', category: 'Electronics', sku: 'ELEC-002', price: 12.99, quantity: 150, description: 'Fast-charging USB-C cable, braided nylon' },
      { name: 'Mechanical Keyboard', category: 'Electronics', sku: 'ELEC-003', price: 129.99, quantity: 18, description: 'Tenkeyless mechanical keyboard with blue switches' },
      { name: 'Ergonomic Office Chair', category: 'Furniture', sku: 'FURN-001', price: 349.00, quantity: 7, description: 'Adjustable lumbar support, mesh back' },
      { name: 'Standing Desk (Electric)', category: 'Furniture', sku: 'FURN-002', price: 499.00, quantity: 5, description: 'Height-adjustable electric standing desk 140x70cm' },
      { name: 'Desk Lamp with USB Port', category: 'Furniture', sku: 'FURN-003', price: 34.99, quantity: 63, description: 'LED desk lamp with adjustable brightness and USB charging port' },
      { name: 'Stainless Steel Water Bottle', category: 'Kitchen', sku: 'KTCH-001', price: 24.99, quantity: 88, description: 'Double-wall insulated, 750ml, BPA-free' },
      { name: 'Coffee Grinder (Electric)', category: 'Kitchen', sku: 'KTCH-002', price: 44.99, quantity: 29, description: 'Burr grinder, 12 grind settings' },
      { name: 'Non-stick Frying Pan Set', category: 'Kitchen', sku: 'KTCH-003', price: 59.99, quantity: 34, description: 'Set of 3: 20cm, 24cm, 28cm ceramic-coated pans' },
      { name: 'Yoga Mat (6mm)', category: 'Sports', sku: 'SPRT-001', price: 29.99, quantity: 55, description: 'Non-slip eco-friendly TPE yoga mat with carry strap' },
      { name: 'Resistance Bands Set', category: 'Sports', sku: 'SPRT-002', price: 19.99, quantity: 72, description: 'Set of 5 resistance bands, light to extra-heavy' },
      { name: 'Running Shoes (Unisex)', category: 'Sports', sku: 'SPRT-003', price: 89.99, quantity: 40, description: 'Lightweight breathable mesh, sizes 36-46' },
      { name: 'Hardcover Notebook A5', category: 'Stationery', sku: 'STAT-001', price: 9.99, quantity: 200, description: 'Dotted pages, 192 pages, lay-flat binding' },
      { name: 'Ballpoint Pen Set (12pk)', category: 'Stationery', sku: 'STAT-002', price: 6.49, quantity: 310, description: 'Smooth writing black ballpoint pens, medium tip' },
      { name: 'Sticky Notes (5-pack)', category: 'Stationery', sku: 'STAT-003', price: 4.99, quantity: 425, description: 'Assorted neon colors, 75x75mm' },
      { name: 'Vitamin C 1000mg (60 tabs)', category: 'Health', sku: 'HLTH-001', price: 14.99, quantity: 95, description: 'High-strength vitamin C with rose hip extract' },
      { name: 'Hand Sanitiser Gel 500ml', category: 'Health', sku: 'HLTH-002', price: 5.99, quantity: 180, description: '70% alcohol antibacterial gel with aloe vera' },
      { name: 'Sunscreen SPF50 (200ml)', category: 'Health', sku: 'HLTH-003', price: 11.99, quantity: 67, description: 'Broad spectrum UVA/UVB, water resistant' },
      { name: 'Bluetooth Smart Speaker', category: 'Electronics', sku: 'ELEC-004', price: 54.99, quantity: 25, description: '360° sound, IPX5 waterproof, 12hr playtime' },
      { name: 'Laptop Stand (Adjustable)', category: 'Electronics', sku: 'ELEC-005', price: 39.99, quantity: 48, description: 'Aluminium alloy, foldable, fits laptops 10–17"' }
    ];

    const insertMany = db.transaction((items) => {
      for (const item of items) insert.run(item);
    });
    insertMany(products);
    console.log('✅ Database seeded with 20 products');
  }

  return db;
}

module.exports = { initializeDatabase };
