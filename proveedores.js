// ============================================
// VARIABLES GLOBALES
// ============================================
let GOOGLE_SCRIPT_URL = localStorage.getItem('googleScriptUrl') || '';
let providers = [];
let editingId = null;
let deletingId = null;
let useLocalStorage = !GOOGLE_SCRIPT_URL; // Usar localStorage si no hay URL

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  checkConnection();
  checkTheme();
  loadProviders();
});

// ============================================
// VERIFICAR CONEXIÓN Y UI
// ============================================
function checkConnection() {
  const connBar = document.getElementById('connection-bar');
  const connStatus = document.getElementById('connection-status');
  const statusIcon = document.getElementById('status-icon');
  const btnDisconnect = document.getElementById('btn-disconnect');

  if (GOOGLE_SCRIPT_URL) {
    if (connBar) connBar.classList.add('connected');
    if (connStatus) connStatus.textContent = '✅ Conectado a Google Sheets';
    if (statusIcon) statusIcon.textContent = '☁️';
    if (btnDisconnect) btnDisconnect.style.display = 'inline-block';
    useLocalStorage = false;
  } else {
    if (connBar) connBar.classList.remove('connected');
    if (connStatus) connStatus.textContent = '📱 Modo Local - Los datos se guardan en tu navegador';
    if (statusIcon) statusIcon.textContent = '';
    if (btnDisconnect) btnDisconnect.style.display = 'none';
    useLocalStorage = true;
  }
}

// ============================================
// MODAL DE CONFIGURACIÓN (Conectar/Desconectar)
// ============================================
function showSetupModal() {
  const modal = document.getElementById('modal-setup');
  if (!modal) return;
  const urlInput = document.getElementById('script-url');
  if (urlInput) urlInput.value = GOOGLE_SCRIPT_URL;
  modal.classList.add('active');
}

function closeSetupModal() {
  const modal = document.getElementById('modal-setup');
  if (modal) modal.classList.remove('active');
}

function saveScriptUrl() {
  const urlInput = document.getElementById('script-url');
  if (!urlInput) return;
  const url = urlInput.value.trim();
  if (!url) {
    showNotification('Por favor ingresa la URL del script', 'error');
    return;
  }
  GOOGLE_SCRIPT_URL = url;
  localStorage.setItem('googleScriptUrl', url);
  closeSetupModal();
  checkConnection();
  loadProviders();
  showNotification('✅ Conectado exitosamente a Google Sheets', 'success');
}

function disconnectGoogle() {
  GOOGLE_SCRIPT_URL = '';
  localStorage.removeItem('googleScriptUrl');
  useLocalStorage = true;
  closeSetupModal();
  checkConnection();
  loadProviders();
  showNotification('🔌 Desconectado. Ahora usas modo local.', 'success');
}

// ============================================
// MODO OSCURO/CLARO
// ============================================
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('theme-toggle');
  body.classList.toggle('dark-mode');
  if (body.classList.contains('dark-mode')) {
    if (btn) btn.textContent = '☀️ Modo Claro';
    localStorage.setItem('theme', 'dark');
  } else {
    if (btn) btn.textContent = ' Modo Oscuro';
    localStorage.setItem('theme', 'light');
  }
}

function checkTheme() {
  const savedTheme = localStorage.getItem('theme');
  const btn = document.getElementById('theme-toggle');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (btn) btn.textContent = '☀️ Modo Claro';
  }
}

// ============================================
// CARGAR PROVEEDORES
// ============================================
async function loadProviders() {
  if (useLocalStorage || !GOOGLE_SCRIPT_URL) {
    loadFromLocalStorage();
  } else {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAll`);
      const data = await response.json();
      providers = data.providers || [];
      renderProviders();
    } catch (error) {
      console.error('Error cargando desde Google Sheets:', error);
      showNotification('Error de conexión. Usando modo local.', 'error');
      useLocalStorage = true;
      loadFromLocalStorage();
    }
  }
}

function loadFromLocalStorage() {
  const stored = localStorage.getItem('providers');
  providers = stored ? JSON.parse(stored) : [];
  renderProviders();
}

function saveToLocalStorage() {
  localStorage.setItem('providers', JSON.stringify(providers));
}

// ============================================
// RENDERIZAR TARJETAS
// ============================================
function renderProviders(filteredProviders = null) {
  const grid = document.getElementById('providers-grid');
  const emptyMsg = document.getElementById('empty-message');
  const data = filteredProviders || providers;

  if (data.length === 0) {
    if (grid) grid.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  if (grid) {
    grid.innerHTML = data.map(p => `
      <div class="provider-card">
        <div class="card-header">
          <div class="card-title">
            <h3>${escapeHtml(p.nombre)}</h3>
            ${p.alias ? `<div class="alias">"${escapeHtml(p.alias)}"</div>` : ''}
          </div>
          <div class="card-actions">
            <button class="btn-icon btn-edit" onclick="editProvider(${p.id})" title="Editar">✏️</button>
            <button class="btn-icon btn-delete" onclick="deleteProvider(${p.id})" title="Eliminar">🗑️</button>
          </div>
        </div>
        <div class="card-info">
          <div class="info-item">
            <span class="info-label">📞 Teléfono:</span>
            <span class="info-value">${escapeHtml(p.numero)}</span>
          </div>
          ${p.etiqueta ? `
          <div class="info-item">
            <span class="info-label">🏷️ Etiquetas:</span>
            <div class="tags-container">
              ${p.etiqueta.split(',').map(t => `<span class="tag">${escapeHtml(t.trim())}</span>`).join('')}
            </div>
          </div>` : ''}
          ${p.descripcion ? `
          <div class="info-item">
            <span class="info-label">📝 Descripción:</span>
          </div>
          <div class="description">${escapeHtml(p.descripcion)}</div>` : ''}
        </div>
      </div>
    `).join('');
  }
}

// ============================================
// BUSCADOR
// ============================================
function searchProviders() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase().trim();
  if (!query) {
    renderProviders();
    return;
  }
  const filtered = providers.filter(p => {
    const searchText = `${p.nombre} ${p.alias || ''} ${p.etiqueta || ''} ${p.descripcion || ''}`.toLowerCase();
    return searchText.includes(query);
  });
  renderProviders(filtered);
}

// ============================================
// MODAL AGREGAR/EDITAR
// ============================================
function openModal() {
  editingId = null;
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) modalTitle.textContent = ' Agregar Proveedor';
  const form = document.getElementById('provider-form');
  if (form) form.reset();
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('active');
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.remove('active');
  editingId = null;
}

function editProvider(id) {
  const provider = providers.find(p => p.id === id);
  if (!provider) return;
  editingId = id;
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) modalTitle.textContent = '✏️ Editar Proveedor';
  document.getElementById('prov-nombre').value = provider.nombre;
  document.getElementById('prov-numero').value = provider.numero;
  document.getElementById('prov-etiqueta').value = provider.etiqueta || '';
  document.getElementById('prov-alias').value = provider.alias || '';
  document.getElementById('prov-descripcion').value = provider.descripcion || '';
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('active');
}

// ============================================
// GUARDAR PROVEEDOR
// ============================================
async function saveProvider(event) {
  event.preventDefault();
  const data = {
    nombre: document.getElementById('prov-nombre').value.trim(),
    numero: document.getElementById('prov-numero').value.trim(),
    etiqueta: document.getElementById('prov-etiqueta').value.trim(),
    alias: document.getElementById('prov-alias').value.trim(),
    descripcion: document.getElementById('prov-descripcion').value.trim()
  };

  if (useLocalStorage || !GOOGLE_SCRIPT_URL) {
    saveToLocalStorageMode(data);
  } else {
    try {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...data, action: 'update', id: editingId } : { ...data, action: 'create' })
      };
      const response = await fetch(GOOGLE_SCRIPT_URL, options);
      const result = await response.json();
      if (result.success) {
        closeModal();
        await loadProviders();
        showNotification(editingId ? 'Proveedor actualizado correctamente' : 'Proveedor agregado correctamente', 'success');
      } else {
        showNotification('Error al guardar: ' + (result.error || 'Error desconocido'), 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error de conexión. Guardando localmente...', 'error');
      useLocalStorage = true;
      saveToLocalStorageMode(data);
    }
  }
}

function saveToLocalStorageMode(data) {
  if (editingId) {
    const index = providers.findIndex(p => p.id === editingId);
    if (index !== -1) {
      providers[index] = { ...providers[index], ...data };
    }
  } else {
    const newId = providers.length > 0 ? Math.max(...providers.map(p => p.id)) + 1 : 1;
    providers.push({ id: newId, ...data });
  }
  saveToLocalStorage();
  closeModal();
  renderProviders();
  showNotification(editingId ? 'Proveedor actualizado correctamente' : 'Proveedor agregado correctamente', 'success');
}

// ============================================
// ELIMINAR PROVEEDOR
// ============================================
function deleteProvider(id) {
  const provider = providers.find(p => p.id === id);
  if (!provider) return;
  deletingId = id;
  const confirmName = document.getElementById('confirm-name');
  if (confirmName) confirmName.textContent = provider.nombre;
  const modal = document.getElementById('modal-confirm');
  if (modal) modal.classList.add('active');
}

function closeConfirmModal() {
  const modal = document.getElementById('modal-confirm');
  if (modal) modal.classList.remove('active');
  deletingId = null;
}

async function confirmDelete() {
  if (useLocalStorage || !GOOGLE_SCRIPT_URL) {
    providers = providers.filter(p => p.id !== deletingId);
    saveToLocalStorage();
    renderProviders();
    closeConfirmModal();
    showNotification('Proveedor eliminado correctamente', 'success');
  } else {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deletingId })
      });
      const result = await response.json();
      if (result.success) {
        closeConfirmModal();
        await loadProviders();
        showNotification('Proveedor eliminado correctamente', 'success');
      } else {
        showNotification('Error al eliminar', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error de conexión', 'error');
    }
  }
}

// ============================================
// UTILIDADES
// ============================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type) {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 15px 25px; 
    background: ${type === 'success' ? '#10b981' : '#ef4444'}; 
    color: white; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
    z-index: 9999; animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// Agregar animaciones CSS si no existen
if (!document.getElementById('animations-style')) {
  const style = document.createElement('style');
  style.id = 'animations-style';
  style.textContent = `
    @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
  `;
  document.head.appendChild(style);
}
