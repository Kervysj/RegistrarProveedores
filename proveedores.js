// ============================================
// CONFIGURACIÓN - CAMBIA ESTO CON TU URL
// ============================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/TU_ID_AQUI/exec';

// ============================================
// VARIABLES GLOBALES
// ============================================
let providers = [];
let editingId = null;
let deletingId = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
loadProviders();
checkTheme();
});

// ============================================
// MODO OSCURO/CLARO
// ============================================
function toggleTheme() {
const body = document.body;
const btn = document.getElementById('theme-toggle');

body.classList.toggle('dark-mode');

if (body.classList.contains('dark-mode')) {
btn.textContent = '☀️ Modo Claro';
localStorage.setItem('theme', 'dark');
} else {
btn.textContent = '🌙 Modo Oscuro';
localStorage.setItem('theme', 'light');
}
}

function checkTheme() {
const savedTheme = localStorage.getItem('theme');
const btn = document.getElementById('theme-toggle');

if (savedTheme === 'dark') {
document.body.classList.add('dark-mode');
btn.textContent = '☀️ Modo Claro';
}
}

// ============================================
// CARGAR PROVEEDORES
// ============================================
async function loadProviders() {
try {
const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAll`);
const data = await response.json();
providers = data.providers || [];
renderProviders();
} catch (error) {
console.error('Error cargando proveedores:', error);
showNotification('Error al cargar los proveedores', 'error');
}
}

// ============================================
// RENDERIZAR TARJETAS
// ============================================
function renderProviders(filteredProviders = null) {
const grid = document.getElementById('providers-grid');
const emptyMsg = document.getElementById('empty-message');
const data = filteredProviders || providers;

if (data.length === 0) {
grid.innerHTML = '';
emptyMsg.style.display = 'block';
return;
}

emptyMsg.style.display = 'none';

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
</div>
` : ''}
${p.descripcion ? `
<div class="info-item">
<span class="info-label">📝 Descripción:</span>
</div>
<div class="description">${escapeHtml(p.descripcion)}</div>
` : ''}
</div>
</div>
`).join('');
}

// ============================================
// BUSCADOR
// ============================================
function searchProviders() {
const query = document.getElementById('search-input').value.toLowerCase().trim();

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
// MODAL - ABRIR/CERRAR
// ============================================
function openModal() {
editingId = null;
document.getElementById('modal-title').textContent = '➕ Agregar Proveedor';
document.getElementById('provider-form').reset();
document.getElementById('modal').classList.add('active');
}

function closeModal() {
document.getElementById('modal').classList.remove('active');
editingId = null;
}

// ============================================
// EDITAR PROVEEDOR
// ============================================
function editProvider(id) {
const provider = providers.find(p => p.id === id);
if (!provider) return;

editingId = id;
document.getElementById('modal-title').textContent = '✏️ Editar Proveedor';
document.getElementById('prov-nombre').value = provider.nombre;
document.getElementById('prov-numero').value = provider.numero;
document.getElementById('prov-etiqueta').value = provider.etiqueta || '';
document.getElementById('prov-alias').value = provider.alias || '';
document.getElementById('prov-descripcion').value = provider.descripcion || '';

document.getElementById('modal').classList.add('active');
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
showNotification('Error de conexión. Intenta de nuevo.', 'error');
}
}

// ============================================
// ELIMINAR PROVEEDOR
// ============================================
function deleteProvider(id) {
const provider = providers.find(p => p.id === id);
if (!provider) return;

deletingId = id;
document.getElementById('confirm-name').textContent = provider.nombre;
document.getElementById('modal-confirm').classList.add('active');
}

function closeConfirmModal() {
document.getElementById('modal-confirm').classList.remove('active');
deletingId = null;
}

async function confirmDelete() {
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

// ============================================
// UTILIDADES
// ============================================
function escapeHtml(text) {
const div = document.createElement('div');
div.textContent = text;
return div.innerHTML;
}

function showNotification(message, type) {
// Crear notificación
const notif = document.createElement('div');
notif.className = `notification ${type}`;
notif.textContent = message;
notif.style.cssText = `
position: fixed;
top: 20px;
right: 20px;
padding: 15px 25px;
background: ${type === 'success' ? '#10b981' : '#ef4444'};
color: white;
border-radius: 10px;
box-shadow: 0 4px 12px rgba(0,0,0,0.3);
z-index: 9999;
animation: slideIn 0.3s ease;
`;

document.body.appendChild(notif);

setTimeout(() => {
notif.style.animation = 'slideOut 0.3s ease';
setTimeout(() => notif.remove(), 300);
}, 3000);
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
from { transform: translateX(400px); opacity: 0; }
to { transform: translateX(0); opacity: 1; }
}
@keyframes slideOut {
from { transform: translateX(0); opacity: 1; }
to { transform: translateX(400px); opacity: 0; }
}
`;
document.head.appendChild(style);
