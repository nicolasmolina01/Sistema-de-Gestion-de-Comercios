// Configuración de formato (puede ajustarse a otra moneda si necesitás)
const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

// Selectores
const form = document.getElementById('product-form');
const barcodeInput = document.getElementById('barcode');
const nameInput = document.getElementById('name');
const descriptionInput = document.getElementById('description');
const quantityInput = document.getElementById('quantity');
const categoryInput = document.getElementById('category');
const expiryDateInput = document.getElementById('expiryDate');
const costInput = document.getElementById('cost');
const marginInput = document.getElementById('margin');
const priceInput = document.getElementById('price');
const profitOutput = document.getElementById('profit');
// Perfil del comercio
const storeNameInput = document.getElementById('store-name');
const storePhotoInput = document.getElementById('store-photo');
const storeSaveBtn = document.getElementById('store-save');
const storePreviewImg = document.getElementById('store-preview');
const storeLogoImg = document.getElementById('store-logo');
const storeTitleNameEl = document.getElementById('store-title-name');
const storeRemovePhotoBtn = document.getElementById('store-remove-photo');
const storeRestoreDefaultBtn = document.getElementById('store-restore-default');
const storeAddressInput = document.getElementById('store-address');
const DEFAULT_STORE_NAME = 'Kiosco La Esquina';

const searchInput = document.getElementById('search');
const exportBtn = document.getElementById('export');
const exportCsvInventoryBtn = document.getElementById('export-csv-inventory');
const clearBtn = document.getElementById('clear');
const tableBody = document.getElementById('table-body');
const expiryAlert = document.getElementById('expiry-alert');

// Ventas
const saleBarcodeInput = document.getElementById('sale-barcode');
const saleQuantityInput = document.getElementById('sale-quantity');
const saleIvaSelect = document.getElementById('sale-iva');
const salePayMethodSelect = document.getElementById('sale-pay-method');
const addToCartBtn = document.getElementById('add-to-cart');
const clearCartBtn = document.getElementById('clear-cart');
const cartBody = document.getElementById('cart-body');
const totalNetEl = document.getElementById('total-net');
const totalIvaEl = document.getElementById('total-iva');
const totalGrossEl = document.getElementById('total-gross');
const confirmSaleBtn = document.getElementById('confirm-sale');

// Storage helpers
const STORAGE_KEY = 'kiosco_stock_products';
const SALES_KEY = 'kiosco_sales_history';
const getProducts = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const setProducts = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const getSales = () => JSON.parse(localStorage.getItem(SALES_KEY) || '[]');
const setSales = (items) => localStorage.setItem(SALES_KEY, JSON.stringify(items));
const STORE_KEY = 'kiosco_store_profile';
const getStore = () => JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
const setStore = (obj) => localStorage.setItem(STORE_KEY, JSON.stringify(obj));

// Utiles
const round2 = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;
const calcPrice = (cost, marginPct) => round2(Number(cost) * (1 + Number(marginPct) / 100));
const calcProfit = (cost, price) => round2(Number(price) - Number(cost));

// Toasts
const toastContainer = document.getElementById('toast-container');
function showToast(message, type = 'info', duration = 2500) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  // Animate in
  requestAnimationFrame(() => toast.classList.add('visible'));
  // Auto-dismiss
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
const parseDate = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const daysUntil = (s) => {
  const dt = parseDate(s);
  if (!dt) return Infinity;
  const today = new Date();
  today.setHours(0,0,0,0);
  dt.setHours(0,0,0,0);
  const diffMs = dt - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};
const isExpiringSoon = (s) => daysUntil(s) <= 10;

// Cálculo dinámico de precio de venta y ganancia
function updatePriceAndProfit() {
  const cost = Number(costInput.value);
  const marginPct = Number(marginInput.value);
  if (!isFinite(cost) || cost <= 0 || !isFinite(marginPct) || marginPct < 0) {
    priceInput.value = '';
    profitOutput.textContent = '—';
    return;
  }
  const price = calcPrice(cost, marginPct);
  const profit = calcProfit(cost, price);
  priceInput.value = price.toFixed(2);
  profitOutput.textContent = `${currency.format(profit)} por unidad`;
}

costInput.addEventListener('input', updatePriceAndProfit);
marginInput.addEventListener('input', updatePriceAndProfit);

// Soporte para lectores de código de barras: suelen "tipear" y enviar Enter
barcodeInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    nameInput.focus();
  }
});

// Render de tabla
function renderTable(filter = '') {
  const products = getProducts();
  const q = (filter || '').trim().toLowerCase();
  const rows = products
    .filter(p => !q || p.name.toLowerCase().includes(q) || String(p.barcode).toLowerCase().includes(q))
    .map(p => {
      const costFmt = currency.format(p.cost);
      const priceFmt = currency.format(p.price);
      const profitFmt = currency.format(calcProfit(p.cost, p.price));
      const desc = p.description?.length > 60 ? p.description.slice(0, 57) + '…' : (p.description || '');
      const expiresIn = daysUntil(p.expiryDate);
      const expiryText = p.expiryDate ? `${p.expiryDate} (${isFinite(expiresIn) ? (expiresIn >= 0 ? `en ${expiresIn} días` : `${Math.abs(expiresIn)} días vencido`) : ''})` : '';
      const warningClass = isExpiringSoon(p.expiryDate) ? ' class="warning"' : '';
      return `
        <tr${warningClass}>
          <td>${p.barcode}</td>
          <td>${p.name}</td>
          <td>${p.category || ''}</td>
          <td title="${p.description || ''}">${desc}</td>
          <td>${p.quantity ?? 0}</td>
          <td>${costFmt}</td>
          <td>${p.margin}%</td>
          <td>${priceFmt}</td>
          <td>${profitFmt}</td>
          <td>${expiryText}</td>
          <td>
            <div class="row-actions">
              <button class="btn" data-action="edit" data-barcode="${p.barcode}">Editar</button>
              <button class="btn danger" data-action="delete" data-barcode="${p.barcode}">Eliminar</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
  tableBody.innerHTML = rows || `<tr><td colspan="11" style="color:#9ca3af">No hay productos cargados.</td></tr>`;

  // Badge de alertas
  const soonCount = products.filter(p => isExpiringSoon(p.expiryDate)).length;
  if (soonCount > 0) {
    expiryAlert.hidden = false;
    expiryAlert.textContent = `${soonCount} próximos a vencer`;
  } else {
    expiryAlert.hidden = true;
    expiryAlert.textContent = '';
  }
}

// Manejo de acciones en la tabla (delegación)
tableBody.addEventListener('click', (e) => {
  const target = e.target;
  if (target.matches('[data-action="edit"]')) {
    const barcode = target.getAttribute('data-barcode');
    startInlineEdit(barcode, target);
    return;
  }
  if (target.matches('[data-action="delete"]')) {
    const barcode = target.getAttribute('data-barcode');
    const items = getProducts().filter(p => String(p.barcode) !== String(barcode));
    setProducts(items);
    renderTable(searchInput.value);
  }
});

function startInlineEdit(barcode, triggerBtn) {
  const row = triggerBtn.closest('tr');
  const items = getProducts();
  const product = items.find(p => String(p.barcode) === String(barcode));
  if (!product) return;
  const originalHTML = row.innerHTML;
  const cost = product.cost;
  const margin = product.margin;
  const price = calcPrice(cost, margin);
  row.innerHTML = `
    <td>${product.barcode}</td>
    <td><input type="text" value="${product.name}" data-edit="name"></td>
    <td><input type="text" value="${product.category || ''}" data-edit="category"></td>
    <td><input type="text" value="${product.description || ''}" data-edit="description"></td>
    <td><input type="number" min="0" step="1" value="${product.quantity ?? 0}" data-edit="quantity"></td>
    <td><input type="number" min="0" step="0.01" value="${product.cost}" data-edit="cost"></td>
    <td><input type="number" min="0" step="1" value="${product.margin}" data-edit="margin"></td>
    <td><input type="number" min="0" step="0.01" value="${price}" data-edit="price" readonly></td>
    <td>${currency.format(calcProfit(cost, price))}</td>
    <td><input type="date" value="${product.expiryDate || ''}" data-edit="expiryDate"></td>
    <td>
      <div class="row-actions">
        <button class="btn primary" data-edit-action="save">Guardar</button>
        <button class="btn" data-edit-action="cancel">Cancelar</button>
      </div>
    </td>
  `;

  const inputs = row.querySelectorAll('input[data-edit]');
  const costInputEdit = row.querySelector('input[data-edit="cost"]');
  const marginInputEdit = row.querySelector('input[data-edit="margin"]');
  const priceInputEdit = row.querySelector('input[data-edit="price"]');
  const updatePrice = () => {
    const c = Number(costInputEdit.value);
    const m = Number(marginInputEdit.value);
    if (isFinite(c) && c >= 0 && isFinite(m) && m >= 0) {
      priceInputEdit.value = calcPrice(c, m).toFixed(2);
    }
  };
  costInputEdit.addEventListener('input', updatePrice);
  marginInputEdit.addEventListener('input', updatePrice);

  row.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t.matches('[data-edit-action="save"]')) {
      const updated = { ...product };
      inputs.forEach(inp => {
        const key = inp.getAttribute('data-edit');
        let val = inp.value;
        if (['quantity','cost','margin','price'].includes(key)) {
          val = Number(val);
        }
        updated[key] = val;
      });
      // recalcular precio en base a costo/margen
      updated.price = calcPrice(updated.cost, updated.margin);
      const idx = items.findIndex(p => String(p.barcode) === String(barcode));
      items[idx] = updated;
      setProducts(items);
      renderTable(searchInput.value);
    }
    if (t.matches('[data-edit-action="cancel"]')) {
      row.innerHTML = originalHTML;
    }
  }, { once: true });
}

// Guardar producto
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const barcode = barcodeInput.value.trim();
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  const quantity = Number(quantityInput.value || 0);
  const category = categoryInput.value.trim();
  const expiryDate = expiryDateInput.value;
  const cost = Number(costInput.value);
  const margin = Number(marginInput.value);
  const price = Number(priceInput.value);

  if (!barcode || !name || !isFinite(cost) || cost <= 0 || !isFinite(margin) || margin < 0 || !isFinite(price) || price <= 0) {
    alert('Por favor, completá los campos obligatorios con valores válidos.');
    return;
  }

  const items = getProducts();
  const exists = items.find(i => String(i.barcode) === String(barcode));
  if (exists) {
    // Si ya existe el código, actualizamos el producto (p. ej. nueva entrada de stock)
    Object.assign(exists, { name, description, quantity, category, expiryDate, cost, margin, price });
  } else {
    // Asignar un ID único para distinguir productos aunque reutilicen el mismo código
    const pid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : (`p-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    items.push({ pid, barcode, name, description, quantity, category, expiryDate, cost, margin, price });
  }
  setProducts(items);
  renderTable(searchInput.value);
  form.reset();
  profitOutput.textContent = '—';
  barcodeInput.focus();
});

// Búsqueda
searchInput.addEventListener('input', () => renderTable(searchInput.value));

// Exportar JSON
exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify(getProducts(), null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventario_kiosco.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Exportar CSV Inventario
function exportInventoryCSV() {
  const products = getProducts();
  if (!products.length) {
    alert('No hay productos en el inventario para exportar.');
    return;
  }
  const header = ['Código','Nombre','Categoría','Cantidad','Costo','Margen %','Precio','Ganancia unitaria','Vencimiento'];
  const rows = products.map(p => [
    String(p.barcode || ''),
    String(p.name || ''),
    String(p.category || ''),
    String(p.quantity ?? 0),
    String(Number(p.cost ?? 0).toFixed(2)),
    String(Number(p.margin ?? 0)),
    String(Number(p.price ?? 0).toFixed(2)),
    String(calcProfit(Number(p.cost ?? 0), Number(p.price ?? 0)).toFixed(2)),
    String(p.expiryDate || '')
  ]);
  const csv = [header, ...rows]
    .map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventario_kiosco.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

exportCsvInventoryBtn?.addEventListener('click', exportInventoryCSV);

// Vaciar inventario
clearBtn.addEventListener('click', () => {
  if (confirm('¿Seguro que querés vaciar todo el inventario? Esta acción no se puede deshacer.')) {
    setProducts([]);
    renderTable(searchInput.value);
  }
});

// Inicialización
window.addEventListener('DOMContentLoaded', () => {
  renderTable();
});

// ===== Navegación por vistas =====
function switchView(view) {
  // Mostrar solo secciones con el data-view seleccionado
  document.querySelectorAll('[data-view]')?.forEach(sec => {
    const v = sec.getAttribute('data-view');
    sec.classList.toggle('hidden', v !== view);
  });
  // Activar botón de nav
  document.querySelectorAll('.nav-btn')?.forEach(btn => {
    const v = btn.getAttribute('data-view-btn');
    btn.classList.toggle('active', v === view);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  // Navegación
  document.querySelectorAll('.nav-btn')?.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.getAttribute('data-view-btn')));
  });
  // Vista inicial
  switchView('home');
  // Inicializar perfil del comercio
  const profile = getStore();
  if (storeNameInput) storeNameInput.value = profile.name || '';
  if (storeTitleNameEl) storeTitleNameEl.textContent = (profile.name || DEFAULT_STORE_NAME);
  if (storeAddressInput) storeAddressInput.value = profile.address || '';
  if (profile.photo) {
    storePreviewImg?.setAttribute('src', profile.photo);
    storePreviewImg && (storePreviewImg.hidden = false);
    storeLogoImg?.setAttribute('src', profile.photo);
    storeLogoImg && (storeLogoImg.hidden = false);
  }
  // Eventos de perfil
  storePhotoInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      storePreviewImg?.setAttribute('src', dataUrl);
      storePreviewImg && (storePreviewImg.hidden = false);
    };
    reader.readAsDataURL(file);
  });
  // Actualizar en vivo el nombre del header
  storeNameInput?.addEventListener('input', (e) => {
    const val = (e.target.value || '').trim();
    if (storeTitleNameEl) storeTitleNameEl.textContent = val || DEFAULT_STORE_NAME;
  });
  storeSaveBtn?.addEventListener('click', () => {
    const name = storeNameInput?.value?.trim() || '';
    const address = storeAddressInput?.value?.trim() || '';
    const photo = storePreviewImg?.getAttribute('src') || '';
    setStore({ name, address, photo });
    if (photo) {
      storeLogoImg?.setAttribute('src', photo);
      storeLogoImg && (storeLogoImg.hidden = false);
    }
    if (storeTitleNameEl) storeTitleNameEl.textContent = name || DEFAULT_STORE_NAME;
    showToast('Perfil del comercio guardado.', 'success');
  });
  // Restaurar nombre por defecto
  storeRestoreDefaultBtn?.addEventListener('click', () => {
    if (storeNameInput) storeNameInput.value = DEFAULT_STORE_NAME;
    if (storeTitleNameEl) storeTitleNameEl.textContent = DEFAULT_STORE_NAME;
    const profile = getStore();
    setStore({ ...profile, name: DEFAULT_STORE_NAME });
    showToast(`Nombre restaurado a ${DEFAULT_STORE_NAME}.`, 'info');
  });
  // Quitar foto
  storeRemovePhotoBtn?.addEventListener('click', () => {
    // Limpiar vista previa y logo
    storePreviewImg?.setAttribute('src', '');
    storePreviewImg && (storePreviewImg.hidden = true);
    storeLogoImg?.setAttribute('src', '');
    storeLogoImg && (storeLogoImg.hidden = true);
    // Limpiar input
    if (storePhotoInput) storePhotoInput.value = '';
    // Persistir cambio
    const profile = getStore();
    setStore({ ...profile, photo: '' });
  });
});

// ===== Carrito de ventas =====
let cart = [];

function renderCart() {
  const rows = cart.map(item => {
    const unit = Number(item.price);
    const qty = Number(item.quantity);
    const ivaPct = Number(item.ivaPct);
    const net = round2(unit * qty);
    const ivaAmt = round2(net * (ivaPct / 100));
    const gross = round2(net + ivaAmt);
    return `
      <tr>
        <td>${item.barcode}</td>
        <td>${item.name}</td>
        <td>${qty}</td>
        <td>${currency.format(unit)}</td>
        <td>${ivaPct}%</td>
        <td>${currency.format(ivaAmt)}</td>
        <td>${currency.format(net)}</td>
        <td>${currency.format(gross)}</td>
        <td><button class="btn danger" data-cart-delete="${item.barcode}">Quitar</button></td>
      </tr>
    `;
  }).join('');
  cartBody.innerHTML = rows || `<tr><td colspan="9" style="color:#9ca3af">Carrito vacío.</td></tr>`;

  const totals = cart.reduce((acc, item) => {
    const unit = Number(item.price);
    const qty = Number(item.quantity);
    const ivaPct = Number(item.ivaPct);
    const net = round2(unit * qty);
    const ivaAmt = round2(net * (ivaPct / 100));
    acc.net += net; acc.iva += ivaAmt; acc.gross += net + ivaAmt; return acc;
  }, { net:0, iva:0, gross:0 });
  totals.net = round2(totals.net);
  totals.iva = round2(totals.iva);
  totals.gross = round2(totals.gross);
  totalNetEl.textContent = currency.format(totals.net);
  totalIvaEl.textContent = currency.format(totals.iva);
  totalGrossEl.textContent = currency.format(totals.gross);
}

cartBody.addEventListener('click', (e) => {
  const t = e.target;
  if (t.matches('[data-cart-delete]')) {
    const bc = t.getAttribute('data-cart-delete');
    cart = cart.filter(i => String(i.barcode) !== String(bc));
    renderCart();
  }
});

addToCartBtn.addEventListener('click', () => {
  const bc = (saleBarcodeInput.value || '').trim();
  const qty = Number(saleQuantityInput.value || 1);
  const ivaPct = Number(saleIvaSelect.value || 21);
  if (!bc || !isFinite(qty) || qty <= 0) {
    alert('Ingresá código y una cantidad válida.');
    return;
  }
  const products = getProducts();
  const p = products.find(x => String(x.barcode) === String(bc));
  if (!p) {
    alert('Producto no encontrado en inventario.');
    return;
  }
  if ((p.quantity ?? 0) < qty) {
    alert(`Stock insuficiente. Disponible: ${p.quantity ?? 0}`);
    return;
  }
  const existing = cart.find(i => String(i.barcode) === String(bc) && Number(i.ivaPct) === ivaPct);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ pid: p.pid, barcode: p.barcode, name: p.name, price: p.price, quantity: qty, ivaPct });
  }
  renderCart();
  saleBarcodeInput.value = '';
  saleQuantityInput.value = '1';
  saleBarcodeInput.focus();
});

clearCartBtn.addEventListener('click', () => { cart = []; renderCart(); });

confirmSaleBtn.addEventListener('click', () => {
  if (cart.length === 0) { alert('El carrito está vacío.'); return; }
  const items = getProducts();
  // Verificar stock antes de procesar
  for (const line of cart) {
    const prod = items.find(p => String(p.barcode) === String(line.barcode));
    if (!prod || (prod.quantity ?? 0) < line.quantity) {
      alert(`Stock insuficiente para ${line.name}.`);
      return;
    }
  }
  // Descontar stock
  for (const line of cart) {
    const idx = items.findIndex(p => String(p.barcode) === String(line.barcode));
    items[idx].quantity = (items[idx].quantity ?? 0) - line.quantity;
  }
  setProducts(items);

  // Registrar venta en historial
  const saleLines = cart.map(line => {
    const prod = items.find(p => String(p.barcode) === String(line.barcode));
    const unit = Number(line.price);
    const qty = Number(line.quantity);
    const ivaPct = Number(line.ivaPct);
    const net = round2(unit * qty);
    const ivaAmt = round2(net * (ivaPct / 100));
    const gross = round2(net + ivaAmt);
    const unitCost = Number(prod?.cost ?? 0);
    const profit = round2((unit - unitCost) * qty);
    return {
      productId: prod?.pid || line.pid,
      barcode: line.barcode,
      name: line.name,
      category: prod?.category || '',
      qty,
      unitPrice: unit,
      unitCost,
      ivaPct,
      net,
      iva: ivaAmt,
      gross,
      profit,
    };
  });
  const totals = saleLines.reduce((acc, l) => {
    acc.net += l.net; acc.iva += l.iva; acc.gross += l.gross; acc.profit += l.profit; return acc;
  }, { net:0, iva:0, gross:0, profit:0 });
  totals.net = round2(totals.net);
  totals.iva = round2(totals.iva);
  totals.gross = round2(totals.gross);
  totals.profit = round2(totals.profit);
  const saleRecord = {
    id: `${Date.now()}`,
    at: new Date().toISOString(),
    lines: saleLines,
    totals,
    paymentMethod: salePayMethodSelect?.value || 'Efectivo',
  };
  const sales = getSales();
  sales.push(saleRecord);
  setSales(sales);

  cart = [];
  renderCart();
  renderTable(searchInput.value);
  showToast('Venta confirmada y stock actualizado.', 'success');
  generateTicket(saleRecord);
});

function generateTicket(sale) {
  const profile = getStore();
  const storeName = (profile.name || DEFAULT_STORE_NAME);
  const storeAddress = (profile.address || '');
  const at = new Date(sale.at);
  const dateStr = at.toLocaleDateString('es-AR');
  const timeStr = at.toLocaleTimeString('es-AR', { hour12: false });
  const ivaPctCommon = (() => {
    // Si todas las líneas comparten el mismo IVA, lo mostramos en resumen
    const pcts = Array.from(new Set(sale.lines.map(l => Number(l.ivaPct))));
    return pcts.length === 1 ? `${pcts[0]}%` : 'varios';
  })();
  const rows = sale.lines.map(l => `
      <tr>
        <td>${l.name}</td>
        <td style="text-align:center;">${l.qty}</td>
        <td style="text-align:right;">${currency.format(l.unitPrice)}</td>
        <td style="text-align:right;">${currency.format(l.iva)}</td>
        <td style="text-align:right;">${currency.format(l.gross)}</td>
      </tr>
  `).join('');

  const html = `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Ticket</title>
    <style>
      body { font-family: Inter, Arial, sans-serif; color:#111; }
      .ticket { width: 260px; margin: 0 auto; padding: 12px; }
      .brand { text-align:center; font-weight:700; font-size:16px; }
      .muted { color:#374151; font-size:12px; text-align:center; }
      .address { color:#374151; font-size:12px; text-align:center; }
      table { width:100%; border-collapse: collapse; margin-top:8px; font-size:11px; }
      th, td { border-bottom: 1px dashed #bbb; padding: 6px 4px; }
      th { text-align:left; font-weight:700; }
      .summary { margin-top:10px; border-top:1px dashed #bbb; padding-top:8px; font-size:13px; }
      .summary div { display:flex; justify-content:space-between; margin: 2px 0; }
      .total { font-weight:700; font-size:16px; }
      .footer { margin-top:12px; text-align:center; font-size:12px; }
      @media print { .actions { display:none; } }
      .actions { text-align:center; margin-top:12px; }
      .btn { padding:6px 10px; border-radius:8px; border:1px solid #ddd; background:#f5f5f5; cursor:pointer; }
      @page { size: 58mm auto; margin: 6mm; }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="brand">${storeName}</div>
      ${storeAddress ? `<div class="address">${storeAddress}</div>` : ''}
      <div class="muted">Comprobante de compra</div>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th style="text-align:center;">Cant.</th>
            <th style="text-align:right;">Unit</th>
            <th style="text-align:right;">IVA</th>
            <th style="text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div class="summary">
        <div><span>Subtotal (sin IVA)</span><span>${currency.format(sale.totals.net)}</span></div>
        <div><span>Total IVA (${ivaPctCommon})</span><span>${currency.format(sale.totals.iva)}</span></div>
        <div class="total"><span>Total a Pagar</span><span>${currency.format(sale.totals.gross)}</span></div>
      </div>
      <div class="summary">
        ${sale.paymentMethod && sale.paymentMethod !== 'Efectivo' ? `<div><span>Método de pago</span><span>${sale.paymentMethod}</span></div>` : ''}
        <div><span>Fecha</span><span>${dateStr}</span></div>
        <div><span>Hora</span><span>${timeStr}</span></div>
      </div>
      <div class="footer">¡Gracias por su compra! Vuelva pronto.</div>
      <div class="actions"><button class="btn" onclick="window.print()">Imprimir</button></div>
    </div>
    <script>
      // Auto imprimir para permitir 'Guardar como PDF' o impresora térmica
      window.addEventListener('load', () => {
        setTimeout(() => { window.print(); }, 200);
      });
    </script>
  </body>
  </html>`;

  const win = window.open('', 'ticket', 'width=380,height=640');
  if (!win) { showToast('No se pudo abrir el ticket (bloqueado por el navegador).', 'error'); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
}

// ===== Historial de ventas =====
const histDailyBtn = document.getElementById('hist-daily');
const histWeeklyBtn = document.getElementById('hist-weekly');
const histMonthlyBtn = document.getElementById('hist-monthly');
const histDailyDateInput = document.getElementById('hist-daily-date');
const histWeekInput = document.getElementById('hist-week-week');
const histMonthInput = document.getElementById('hist-month-month');
const histProfitEl = document.getElementById('hist-profit');
const histUnitsEl = document.getElementById('hist-units');
const histOrdersEl = document.getElementById('hist-orders');
const histTopBody = document.getElementById('hist-top-body');
const histLeastEl = document.getElementById('hist-least');
const histCategorySelect = document.getElementById('hist-category');
const histExportCsvBtn = document.getElementById('hist-export-csv');
const histClearBtn = document.getElementById('hist-clear');

function startOfToday() {
  const d = new Date(); d.setHours(0,0,0,0); return d;
}
function endOfToday() {
  const d = new Date(); d.setHours(23,59,59,999); return d;
}
function startOfWeek7() {
  const d = startOfToday(); d.setDate(d.getDate() - 6); return d; // últimos 7 días
}
function startOfMonth() {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth() {
  const d = new Date(); return new Date(d.getFullYear(), d.getMonth()+1, 0, 23,59,59,999);
}

// Helpers ISO week
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}
function isoWeekStart(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  let dow = simple.getUTCDay(); if (dow === 0) dow = 7;
  const start = new Date(simple);
  if (dow <= 4) start.setUTCDate(simple.getUTCDate() - dow + 1);
  else start.setUTCDate(simple.getUTCDate() + 8 - dow);
  start.setUTCHours(0,0,0,0);
  return start;
}
function endOfDay(d) { const e = new Date(d); e.setHours(23,59,59,999); return e; }

function getRangeForPeriod(period) {
  if (period === 'daily') {
    const val = histDailyDateInput.value;
    const dt = parseDate(val) || startOfToday();
    const start = new Date(dt); start.setHours(0,0,0,0);
    return { start, end: endOfDay(start) };
  }
  if (period === 'weekly') {
    const val = histWeekInput.value; // formato YYYY-Www
    let start;
    if (val && /^\d{4}-W\d{2}$/.test(val)) {
      const [y, w] = val.split('-W');
      start = isoWeekStart(Number(y), Number(w));
    } else {
      const { year, week } = getISOWeek(new Date());
      start = isoWeekStart(year, week);
    }
    const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
    return { start, end };
  }
  if (period === 'monthly') {
    const val = histMonthInput.value; // formato YYYY-MM
    let y, m;
    if (val && /^\d{4}-\d{2}$/.test(val)) {
      [y, m] = val.split('-').map(Number);
    } else {
      const d = new Date(); y = d.getFullYear(); m = d.getMonth() + 1;
    }
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23,59,59,999);
    return { start, end };
  }
  return { start: startOfToday(), end: endOfToday() };
}

function filterSalesInRange(start, end) {
  const s = getSales();
  return s.filter(rec => {
    const at = new Date(rec.at).getTime();
    return at >= start.getTime() && at <= end.getTime();
  });
}

let currentPeriod = 'daily';
let lastRanking = [];
function renderHistory(period = currentPeriod) {
  currentPeriod = period;
  const { start, end } = getRangeForPeriod(period);
  const sales = filterSalesInRange(start, end);
  const selectedCat = histCategorySelect?.value || '';
  // Mapa de categorías actuales por código (para completar si la línea no trae)
  const productsNow = getProducts();
  const catByBarcode = new Map(productsNow.map(p => [String(p.barcode), p.category || '']));

  // Agrupar por producto con filtro de categoría aplicado
  const byProduct = new Map();
  let totalProfit = 0;
  let salesWithLinesCount = 0;
  for (const rec of sales) {
    let recHasIncluded = false;
    for (const l of rec.lines) {
      // categoría de la línea: preferir la persistida, si no buscar en inventario
      let lineCat = l.category;
      if (!lineCat) {
        lineCat = catByBarcode.get(String(l.barcode)) || '';
      }
      if (!selectedCat || selectedCat === lineCat) {
        // Clave de agrupamiento: preferir ID de producto (persistido en la línea);
        // si no existe (histórico), separar por combinación código+nombre de la venta.
        const k = l.productId || (String(l.barcode) + '|' + String(l.name));
        // Nombre visible: usar SIEMPRE el nombre de la línea (nombre en el momento de la venta)
        const visibleName = l.name;
        const prev = byProduct.get(k) || { name: visibleName, units:0, profit:0 };
        prev.units += l.qty;
        prev.profit += l.profit;
        // Mantener el nombre de la venta para consistencia histórica
        prev.name = visibleName;
        byProduct.set(k, prev);
        totalProfit += l.profit;
        recHasIncluded = true;
      }
    }
    if (recHasIncluded) salesWithLinesCount += 1;
  }

  // totales UI
  const totalUnits = Array.from(byProduct.values()).reduce((s,v)=>s+v.units,0);
  histProfitEl.textContent = currency.format(round2(totalProfit));
  histUnitsEl.textContent = String(totalUnits);
  histOrdersEl.textContent = String(salesWithLinesCount);

  // ranking top (por unidades)
  const ranking = Array.from(byProduct.entries())
    .sort((a,b) => b[1].units - a[1].units)
    .slice(0, 5);
  lastRanking = ranking;
  const rows = ranking.map(([bc, info]) => `
    <tr>
      <td>${info.name}</td>
      <td>${info.units}</td>
      <td>${currency.format(round2(info.profit))}</td>
    </tr>
  `).join('');
  histTopBody.innerHTML = rows || `<tr><td colspan="3" style="color:#9ca3af">Sin ventas en el periodo seleccionado.</td></tr>`;

  // Gráfico de barras Top productos (por unidades)
  renderHistBarChart(ranking);

  // menor movimiento (entre vendidos)
  const sold = Array.from(byProduct.entries()).filter(([bc,info]) => info.units > 0);
  if (sold.length === 0) {
    histLeastEl.textContent = 'Sin ventas en el periodo.';
  } else {
    sold.sort((a,b) => a[1].units - b[1].units);
    const [bc, info] = sold[0];
    histLeastEl.textContent = `${info.name} (${info.units} u.)`;
  }

  // actualizar estado visual de tabs
  histDailyBtn.setAttribute('aria-selected', period === 'daily' ? 'true' : 'false');
  histWeeklyBtn.setAttribute('aria-selected', period === 'weekly' ? 'true' : 'false');
  histMonthlyBtn.setAttribute('aria-selected', period === 'monthly' ? 'true' : 'false');

  // Mostrar controles según periodo
  document.getElementById('control-daily').hidden = period !== 'daily';
  document.getElementById('control-weekly').hidden = period !== 'weekly';
  document.getElementById('control-monthly').hidden = period !== 'monthly';
}

histDailyBtn.addEventListener('click', () => renderHistory('daily'));
histWeeklyBtn.addEventListener('click', () => renderHistory('weekly'));
histMonthlyBtn.addEventListener('click', () => renderHistory('monthly'));

// Render inicial del historial (diario)
renderHistory('daily');

// Inicialización de valores por defecto y eventos
window.addEventListener('DOMContentLoaded', () => {
  // Diario: hoy
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth()+1).padStart(2,'0');
  const dd = String(today.getDate()).padStart(2,'0');
  if (histDailyDateInput) histDailyDateInput.value = `${yyyy}-${mm}-${dd}`;
  // Semanal: semana ISO actual
  const iso = getISOWeek(today);
  const w = String(iso.week).padStart(2,'0');
  if (histWeekInput) histWeekInput.value = `${iso.year}-W${w}`;
  // Mensual: mes actual
  if (histMonthInput) histMonthInput.value = `${yyyy}-${mm}`;

  // Eventos para re-render al cambiar controles
  histDailyDateInput?.addEventListener('change', () => renderHistory('daily'));
  histWeekInput?.addEventListener('change', () => renderHistory('weekly'));
  histMonthInput?.addEventListener('change', () => renderHistory('monthly'));
  // Filtro por categoría
  histCategorySelect?.addEventListener('change', () => renderHistory(currentPeriod));
  // Exportar CSV
  histExportCsvBtn?.addEventListener('click', () => exportTopCSV());
  // Vaciar historial de ventas
  histClearBtn?.addEventListener('click', () => {
    if (!confirm('¿Seguro que querés vaciar todo el historial de ventas? Esta acción no se puede deshacer.')) return;
    setSales([]);
    populateHistCategories();
    if (histCategorySelect) histCategorySelect.value = '';
    renderHistory(currentPeriod);
    showToast('Historial de ventas vaciado.', 'success');
  });
  // Popular categorías
  populateHistCategories();
});

// Añadir categoría a líneas nuevas de venta
// (modificación en confirmSaleBtn ya calcula saleLines; ampliamos su contenido)
// Nota: ya está definido confirmSaleBtn arriba; interceptamos creando una función auxiliar
// y reutilizamos la lógica existente sin romper el flujo.


// ===== Gráfico de barras en canvas (Top productos) =====
function renderHistBarChart(ranking) {
  const canvas = document.getElementById('hist-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Si no hay datos
  if (!ranking || ranking.length === 0) {
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sin ventas en el periodo', W / 2, H / 2);
    return;
  }

  const padding = { left: 60, right: 20, top: 20, bottom: 40 };
  const plotW = W - padding.left - padding.right;
  const plotH = H - padding.top - padding.bottom;
  const maxUnits = Math.max(1, ...ranking.map(([, info]) => info.units));
  const n = ranking.length;
  const gap = 12;
  const barW = Math.floor((plotW - gap * (n - 1)) / n);

  // Ejes
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, H - padding.bottom);
  ctx.lineTo(W - padding.right, H - padding.bottom);
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, H - padding.bottom);
  ctx.stroke();

  ranking.forEach(([, info], idx) => {
    const x = padding.left + idx * (barW + gap);
    const h = Math.round(plotH * info.units / maxUnits);
    const y = H - padding.bottom - h;
    ctx.fillStyle = idx === 0 ? '#2563eb' : '#60a5fa';
    ctx.fillRect(x, y, barW, h);

    // Etiqueta de unidades sobre la barra
    ctx.fillStyle = '#e5e7eb';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(info.units), x + barW / 2, y - 6);

    // Etiqueta de nombre en el eje X
    ctx.fillStyle = '#e5e7eb';
    const label = info.name.length > 16 ? (info.name.slice(0, 16) + '…') : info.name;
    ctx.save();
    ctx.translate(x + barW / 2, H - padding.bottom + 14);
    ctx.rotate(0);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  });

  // Marca del máximo
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`Máx: ${maxUnits} u.`, W - padding.right, padding.top + 12);
}

// ===== Categorías y exportación CSV =====
function collectCategories() {
  const set = new Set();
  // Desde inventario
  getProducts().forEach(p => { if (p.category) set.add(p.category); });
  // Desde historial de ventas
  getSales().forEach(rec => {
    rec.lines?.forEach(l => { if (l.category) set.add(l.category); });
  });
  return Array.from(set.values()).sort((a,b) => a.localeCompare(b));
}

function populateHistCategories() {
  const sel = histCategorySelect;
  if (!sel) return;
  const current = sel.value;
  const cats = collectCategories();
  // Reconstruir opciones
  sel.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = '';
  optAll.textContent = 'Todas';
  sel.appendChild(optAll);
  cats.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c; sel.appendChild(o);
  });
  // Restaurar selección si existe
  const exists = cats.includes(current) || current === '';
  sel.value = exists ? current : '';
}

function exportTopCSV() {
  const ranking = lastRanking || [];
  if (!ranking.length) {
    alert('No hay datos para exportar en el periodo y filtro seleccionados.');
    return;
  }
  const header = ['Código','Producto','Unidades','Ganancia'];
  const rows = ranking.map(([bc, info]) => [String(bc), info.name, String(info.units), String(round2(info.profit))]);
  const csv = [header, ...rows]
    .map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const cat = histCategorySelect?.value || 'todas';
  a.href = url;
  a.download = `top_productos_${currentPeriod}_${cat}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}