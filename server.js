const express = require('express');
const path = require('path');
const { initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

const db = initializeDatabase();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET all products (with optional search/filter)
app.get('/api/products', (req, res) => {
  const { search, category } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];
  const conditions = [];

  if (search) {
    conditions.push("(name LIKE ? OR sku LIKE ? OR description LIKE ?)");
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (category && category !== 'All') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY name ASC';

  const products = db.prepare(query).all(...params);
  res.json(products);
});

// GET a single product
app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST create a new product
app.post('/api/products', (req, res) => {
  const { name, category, sku, price, quantity, description } = req.body;
  if (!name || !category || !sku || price == null || quantity == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO products (name, category, sku, price, quantity, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, category, sku, parseFloat(price), parseInt(quantity), description || '');
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update a product
app.put('/api/products/:id', (req, res) => {
  const { name, category, sku, price, quantity, description } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  try {
    db.prepare(`
      UPDATE products SET name=?, category=?, sku=?, price=?, quantity=?, description=?
      WHERE id=?
    `).run(
      name ?? existing.name,
      category ?? existing.category,
      sku ?? existing.sku,
      price != null ? parseFloat(price) : existing.price,
      quantity != null ? parseInt(quantity) : existing.quantity,
      description ?? existing.description,
      req.params.id
    );
    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH update quantity only
app.patch('/api/products/:id/quantity', (req, res) => {
  const { quantity } = req.body;
  if (quantity == null) return res.status(400).json({ error: 'quantity is required' });
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  db.prepare('UPDATE products SET quantity=? WHERE id=?').run(parseInt(quantity), req.params.id);
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE a product
app.delete('/api/products/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ message: 'Product deleted' });
});

// GET distinct categories
app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json(categories.map(r => r.category));
});

app.listen(PORT, () => {
  console.log(`🚀 Inventory Manager running at http://localhost:${PORT}`);
});
