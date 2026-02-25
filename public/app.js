/* ──────────────────────────────────────────
   Inventory Manager — Frontend App
────────────────────────────────────────── */

let allProducts = [];
let viewMode = 'grid'; // 'grid' | 'list'
let deleteTargetId = null;
let toastTimer = null;

// ── DOM refs ──────────────────────────────
const productContainer = document.getElementById('productContainer');
const emptyState       = document.getElementById('emptyState');
const searchInput      = document.getElementById('searchInput');
const categoryFilter   = document.getElementById('categoryFilter');
const productModal     = document.getElementById('productModal');
const deleteModal      = document.getElementById('deleteModal');
const productForm      = document.getElementById('productForm');
const modalTitle       = document.getElementById('modalTitle');
const saveBtn          = document.getElementById('saveBtn');
const toast            = document.getElementById('toast');

// Stats
const statTotal      = document.getElementById('statTotal');
const statUnits      = document.getElementById('statUnits');
const statCategories = document.getElementById('statCategories');
const statLowStock   = document.getElementById('statLowStock');

// ── Init ──────────────────────────────────
loadCategories();
loadProducts();

// ── Event listeners ───────────────────────
document.getElementById('openAddModal').addEventListener('click', () => openProductModal());
document.getElementById('closeModal').addEventListener('click', closeProductModal);
document.getElementById('cancelModal').addEventListener('click', closeProductModal);
document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
document.getElementById('cancelDelete').addEventListener('click', closeDeleteModal);
document.getElementById('confirmDelete').addEventListener('click', confirmDelete);
productForm.addEventListener('submit', handleFormSubmit);
searchInput.addEventListener('input', debounce(applyFilters, 250));
categoryFilter.addEventListener('change', applyFilters);
document.getElementById('gridViewBtn').addEventListener('click', () => setView('grid'));
document.getElementById('listViewBtn').addEventListener('click', () => setView('list'));

// Close modals on overlay click
productModal.addEventListener('click', e => { if (e.target === productModal) closeProductModal(); });
deleteModal.addEventListener('click',  e => { if (e.target === deleteModal)  closeDeleteModal(); });

// Keyboard: Escape closes modals
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeProductModal();
    closeDeleteModal();
  }
});

// ── API helpers ───────────────────────────
async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

// ── Load categories ───────────────────────
async function loadCategories() {
  const cats = await api('GET', '/api/categories');
  const datalist = document.getElementById('categoryList');
  datalist.innerHTML = cats.map(c => `<option value="${c}">`).join('');

  // Keep existing "All" option and append new ones
  const current = [...categoryFilter.options].map(o => o.value);
  cats.forEach(c => {
    if (!current.includes(c)) {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      categoryFilter.appendChild(opt);
    }
  });
}

// ── Load / render products ─────────────────
async function loadProducts() {
  const search   = searchInput.value.trim();
  const category = categoryFilter.value;
  const params   = new URLSearchParams();
  if (search)              params.set('search', search);
  if (category !== 'All')  params.set('category', category);

  allProducts = await api('GET', `/api/products?${params}`);
  renderProducts();
  updateStats();
}

function renderProducts() {
  productContainer.innerHTML = '';
  productContainer.className = viewMode === 'grid' ? 'product-grid' : 'product-list';

  if (allProducts.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  allProducts.forEach(p => {
    if (viewMode === 'grid') {
      productContainer.appendChild(buildCard(p));
    } else {
      productContainer.appendChild(buildListItem(p));
    }
  });
}

function buildCard(p) {
  const isLow = p.quantity <= 10;
  const div = document.createElement('div');
  div.className = `product-card${isLow ? ' low-stock' : ''}`;
  div.dataset.id = p.id;
  div.innerHTML = `
    <div class="card-top">
      <span class="card-badge${isLow ? ' low' : ''}">${escHtml(p.category)}</span>
      <span class="card-sku">${escHtml(p.sku)}</span>
    </div>
    <div class="card-name">${escHtml(p.name)}</div>
    <div class="card-desc">${escHtml(p.description || '—')}</div>
    <div class="card-footer">
      <span class="card-price">$${Number(p.price).toFixed(2)}</span>
      <div class="qty-control">
        <button class="qty-btn" data-action="dec" data-id="${p.id}" title="Decrease">−</button>
        <span class="qty-display">${p.quantity}</span>
        <button class="qty-btn" data-action="inc" data-id="${p.id}" title="Increase">+</button>
      </div>
    </div>
    <div class="card-actions">
      <button class="icon-btn edit-btn" data-id="${p.id}" title="Edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="icon-btn delete-btn delete" data-id="${p.id}" data-name="${escHtml(p.name)}" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `;
  div.querySelector('.edit-btn').addEventListener('click', () => openProductModal(p));
  div.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(p.id, p.name));
  div.querySelectorAll('.qty-btn').forEach(btn => btn.addEventListener('click', handleQtyBtn));
  return div;
}

function buildListItem(p) {
  const isLow = p.quantity <= 10;
  const div = document.createElement('div');
  div.className = `product-list-item${isLow ? ' low-stock' : ''}`;
  div.dataset.id = p.id;
  div.innerHTML = `
    <div>
      <div class="list-name">${escHtml(p.name)}</div>
      <div class="list-meta">${escHtml(p.sku)} · ${escHtml(p.description || '')}</div>
    </div>
    <div class="list-category">${escHtml(p.category)}</div>
    <div class="list-price">$${Number(p.price).toFixed(2)}</div>
    <div class="qty-control">
      <button class="qty-btn" data-action="dec" data-id="${p.id}">−</button>
      <span class="qty-display">${p.quantity}</span>
      <button class="qty-btn" data-action="inc" data-id="${p.id}">+</button>
    </div>
    <div class="card-actions">
      <button class="icon-btn edit-btn" data-id="${p.id}" title="Edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="icon-btn delete-btn delete" data-id="${p.id}" data-name="${escHtml(p.name)}" title="Delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  `;
  div.querySelector('.edit-btn').addEventListener('click', () => openProductModal(p));
  div.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(p.id, p.name));
  div.querySelectorAll('.qty-btn').forEach(btn => btn.addEventListener('click', handleQtyBtn));
  return div;
}

// ── Stats ─────────────────────────────────
async function updateStats() {
  // Load all products for accurate stats (not filtered)
  const all = await api('GET', '/api/products');
  statTotal.textContent     = all.length;
  statUnits.textContent     = all.reduce((s, p) => s + p.quantity, 0).toLocaleString();
  statCategories.textContent = new Set(all.map(p => p.category)).size;
  statLowStock.textContent  = all.filter(p => p.quantity <= 10).length;
}

// ── Quantity controls ─────────────────────
async function handleQtyBtn(e) {
  const btn    = e.currentTarget;
  const id     = btn.dataset.id;
  const action = btn.dataset.action;
  const product = allProducts.find(p => String(p.id) === String(id));
  if (!product) return;

  const newQty = action === 'inc' ? product.quantity + 1 : Math.max(0, product.quantity - 1);
  try {
    const updated = await api('PATCH', `/api/products/${id}/quantity`, { quantity: newQty });
    product.quantity = updated.quantity;

    // Update display inline
    const container = btn.closest('[data-id]');
    container.querySelector('.qty-display').textContent = updated.quantity;

    // Update low-stock styling
    const isLow = updated.quantity <= 10;
    container.classList.toggle('low-stock', isLow);
    const badge = container.querySelector('.card-badge');
    if (badge) badge.classList.toggle('low', isLow);

    updateStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Filters ───────────────────────────────
function applyFilters() { loadProducts(); }

// ── View toggle ───────────────────────────
function setView(mode) {
  viewMode = mode;
  document.getElementById('gridViewBtn').classList.toggle('active', mode === 'grid');
  document.getElementById('listViewBtn').classList.toggle('active', mode === 'list');
  renderProducts();
}

// ── Add / Edit modal ──────────────────────
function openProductModal(product = null) {
  productForm.reset();
  document.getElementById('productId').value = '';

  if (product) {
    modalTitle.textContent = 'Edit Product';
    saveBtn.textContent    = 'Save Changes';
    document.getElementById('productId').value    = product.id;
    document.getElementById('fieldName').value    = product.name;
    document.getElementById('fieldSku').value     = product.sku;
    document.getElementById('fieldCategory').value = product.category;
    document.getElementById('fieldPrice').value   = product.price;
    document.getElementById('fieldQuantity').value = product.quantity;
    document.getElementById('fieldDescription').value = product.description || '';
  } else {
    modalTitle.textContent = 'Add Product';
    saveBtn.textContent    = 'Add Product';
  }
  productModal.classList.remove('hidden');
  document.getElementById('fieldName').focus();
}

function closeProductModal() { productModal.classList.add('hidden'); }

async function handleFormSubmit(e) {
  e.preventDefault();
  const id   = document.getElementById('productId').value;
  const body = {
    name:        document.getElementById('fieldName').value.trim(),
    sku:         document.getElementById('fieldSku').value.trim(),
    category:    document.getElementById('fieldCategory').value.trim(),
    price:       document.getElementById('fieldPrice').value,
    quantity:    document.getElementById('fieldQuantity').value,
    description: document.getElementById('fieldDescription').value.trim(),
  };

  saveBtn.disabled = true;
  try {
    if (id) {
      await api('PUT', `/api/products/${id}`, body);
      showToast('Product updated successfully', 'success');
    } else {
      await api('POST', '/api/products', body);
      showToast('Product added successfully', 'success');
    }
    closeProductModal();
    await loadCategories();
    await loadProducts();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

// ── Delete modal ──────────────────────────
function openDeleteModal(id, name) {
  deleteTargetId = id;
  document.getElementById('deleteProductName').textContent = name;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  deleteTargetId = null;
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  try {
    await api('DELETE', `/api/products/${deleteTargetId}`);
    showToast('Product deleted', 'success');
    closeDeleteModal();
    await loadProducts();
    await loadCategories();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ── Toast ─────────────────────────────────
function showToast(message, type = '') {
  toast.textContent = message;
  toast.className   = `toast${type ? ' ' + type : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.add('hidden'); }, 3500);
}

// ── Helpers ───────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
