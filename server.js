const express = require('express');
const path    = require('path');
const { loadDb, saveDb } = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── helpers ──────────────────────────────────────────────────────────────────
function getDb()        { return loadDb(); }
function mutate(data)   { saveDb(data); }

// ── GET all products (search + category filter) ───────────────────────────────
app.get('/api/products', (req, res) => {
  const { search, category } = req.query;
  let products = getDb().products;

  if (search) {
    const term = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term)  ||
      (p.description || '').toLowerCase().includes(term)
    );
  }
  if (category && category !== 'All') {
    products = products.filter(p => p.category === category);
  }
  products.sort((a, b) => a.name.localeCompare(b.name));
  res.json(products);
});

// ── GET single product ────────────────────────────────────────────────────────
app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = getDb().products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// ── POST create product ───────────────────────────────────────────────────────
app.post('/api/products', (req, res) => {
  const { name, category, sku, price, quantity, description } = req.body;
  if (!name || !category || !sku || price == null || quantity == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const db = getDb();
  if (db.products.some(p => p.sku === sku)) {
    return res.status(409).json({ error: 'SKU already exists' });
  }
  const product = {
    id: db.nextId++,
    name, category, sku,
    price:       parseFloat(price),
    quantity:    parseInt(quantity),
    description: description || '',
    created_at:  new Date().toISOString()
  };
  db.products.push(product);
  mutate(db);
  res.status(201).json(product);
});

// ── PUT update product ────────────────────────────────────────────────────────
app.put('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const idx = db.products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });

  const { name, category, sku, price, quantity, description } = req.body;
  const existing = db.products[idx];

  if (sku && sku !== existing.sku && db.products.some(p => p.sku === sku)) {
    return res.status(409).json({ error: 'SKU already exists' });
  }

  db.products[idx] = {
    ...existing,
    name:        name        ?? existing.name,
    category:    category    ?? existing.category,
    sku:         sku         ?? existing.sku,
    price:       price != null ? parseFloat(price) : existing.price,
    quantity:    quantity != null ? parseInt(quantity) : existing.quantity,
    description: description ?? existing.description
  };
  mutate(db);
  res.json(db.products[idx]);
});

// ── PATCH quantity ────────────────────────────────────────────────────────────
app.patch('/api/products/:id/quantity', (req, res) => {
  const id = Number(req.params.id);
  const { quantity } = req.body;
  if (quantity == null) return res.status(400).json({ error: 'quantity is required' });
  const db  = getDb();
  const idx = db.products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  db.products[idx].quantity = parseInt(quantity);
  mutate(db);
  res.json(db.products[idx]);
});

// ── DELETE product ────────────────────────────────────────────────────────────
app.delete('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const db = getDb();
  const idx = db.products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  db.products.splice(idx, 1);
  mutate(db);
  res.json({ message: 'Product deleted' });
});

// ── GET categories ────────────────────────────────────────────────────────────
app.get('/api/categories', (req, res) => {
  const cats = [...new Set(getDb().products.map(p => p.category))].sort();
  res.json(cats);
});

app.listen(PORT, () => {
  console.log(`🚀 HydroVault Inventory running at http://localhost:${PORT}`);
});
