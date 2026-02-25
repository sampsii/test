const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'inventory.json');

const SEED_PRODUCTS = [
  { name: 'HydroVault Classic 750ml',          category: 'Stainless Steel Bottles', sku: 'HV-SS-001', price: 44.99,  quantity: 120, description: 'Double-wall vacuum insulated, keeps drinks cold 24 h / hot 12 h. Matte finish.' },
  { name: 'HydroVault Slim 500ml',             category: 'Stainless Steel Bottles', sku: 'HV-SS-002', price: 38.99,  quantity: 95,  description: 'Slim-profile stainless steel, fits most cup holders. Leak-proof lid.' },
  { name: 'HydroVault XL 1.2L',               category: 'Stainless Steel Bottles', sku: 'HV-SS-003', price: 59.99,  quantity: 60,  description: 'Extra-large double-wall bottle for all-day hydration. Wide-mouth opening.' },
  { name: 'HydroVault Sport 650ml',            category: 'Stainless Steel Bottles', sku: 'HV-SS-004', price: 49.99,  quantity: 80,  description: 'Straw lid with carry handle, sweat-proof exterior, BPA-free.' },
  { name: 'HydroVault Flask 350ml',            category: 'Stainless Steel Bottles', sku: 'HV-SS-005', price: 34.99,  quantity: 75,  description: 'Compact hip-flask shape, perfect for hiking and travel.' },
  { name: 'HydroVault Glass 600ml',            category: 'Glass Bottles',           sku: 'HV-GL-001', price: 32.99,  quantity: 55,  description: 'Borosilicate glass with silicone sleeve, pure taste, dishwasher safe.' },
  { name: 'HydroVault Glass 900ml',            category: 'Glass Bottles',           sku: 'HV-GL-002', price: 39.99,  quantity: 40,  description: 'Large borosilicate glass bottle with bamboo lid and time markers.' },
  { name: 'HydroVault Tritan 800ml',           category: 'Tritan Bottles',          sku: 'HV-TR-001', price: 27.99,  quantity: 150, description: 'Lightweight Tritan co-polyester, impact-resistant, crystal-clear body.' },
  { name: 'HydroVault Tritan 500ml Kids',      category: 'Tritan Bottles',          sku: 'HV-TR-002', price: 19.99,  quantity: 200, description: 'Kid-friendly size with flip-top straw lid, drop-proof design.' },
  { name: 'HydroVault Insulated Tumbler 450ml',category: 'Tumblers',                sku: 'HV-TU-001', price: 36.99,  quantity: 110, description: 'Desk tumbler with splash-proof slide lid, fits 12 oz pod machines.' },
  { name: 'HydroVault Travel Tumbler 600ml',   category: 'Tumblers',                sku: 'HV-TU-002', price: 42.99,  quantity: 85,  description: 'Tapered base for car cup holders, 360° grip ring, cold 18 h / hot 8 h.' },
  { name: 'Bamboo Lid (Standard)',             category: 'Lids & Caps',             sku: 'HV-LD-001', price: 8.99,   quantity: 300, description: 'Replacement bamboo lid compatible with all 600 ml+ glass bottles.' },
  { name: 'Straw Lid Kit',                     category: 'Lids & Caps',             sku: 'HV-LD-002', price: 9.99,   quantity: 260, description: 'Replacement straw + lid compatible with Sport and Tritan range.' },
  { name: 'Wide-Mouth Flip Lid',               category: 'Lids & Caps',             sku: 'HV-LD-003', price: 11.99,  quantity: 180, description: 'One-hand flip lid, leak-proof lock, fits all wide-mouth stainless bottles.' },
  { name: 'Silicone Boot (M)',                 category: 'Accessories',             sku: 'HV-AC-001', price: 7.99,   quantity: 220, description: 'Protective silicone base, prevents dents and muffles set-down noise.' },
  { name: 'Carry Strap & Carabiner',           category: 'Accessories',             sku: 'HV-AC-002', price: 12.99,  quantity: 175, description: 'Adjustable paracord carry strap with aluminium carabiner clip.' },
  { name: 'Insulated Sleeve',                  category: 'Accessories',             sku: 'HV-AC-003', price: 14.99,  quantity: 140, description: 'Neoprene sleeve for extra insulation and grip, fits 500–750 ml bottles.' },
  { name: 'Bottle Cleaning Brush Set',         category: 'Cleaning',                sku: 'HV-CL-001', price: 9.99,   quantity: 190, description: 'Long-handle bottle brush + straw brush + lid brush, BPA-free bristles.' },
  { name: 'Eco Cleaning Tablets (30-pack)',    category: 'Cleaning',                sku: 'HV-CL-002', price: 11.99,  quantity: 160, description: 'Effervescent cleaning tabs, removes odours and stains, biodegradable.' },
  { name: 'HydroVault Gift Box Set',           category: 'Gift Sets',               sku: 'HV-GF-001', price: 69.99,  quantity: 35,  description: 'Classic 750 ml bottle + bamboo lid + carry strap in premium gift box.' }
];

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { nextId: SEED_PRODUCTS.length + 1, products: [] };
    SEED_PRODUCTS.forEach((p, i) => {
      initial.products.push({ id: i + 1, ...p, created_at: new Date().toISOString() });
    });
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    console.log('✅ Database seeded with 20 products');
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { loadDb, saveDb };

