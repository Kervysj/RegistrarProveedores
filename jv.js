// CONFIGURACIÓN - CAMBIA ESTOS VALORES CON TUS DATOS DE GOOGLE SHEETS
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/TU_SCRIPT_ID_AQUI/exec';

// Variables globales
let providers = [];
let editingId = null;
let deletingId = null;

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
loadProviders();
setupSearch();
});

// Cargar proveedores desde Google Sheets
async function loadProviders() {
try {
const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getAll`);
const data = await response.json();
providers = data.providers || [];
renderProviders();
} catch (error) {
console.error('Error cargando proveedores:', error);
showError('Error al cargar los proveedores. Verifica la conexión con Google Sheets.');
}
}

// Renderizar tarjetas
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
<span class="info-label">🏷️ Etiqueta:</span>
<span class="info-value">
${p.etiqueta.split(',').map(t => `<span class="tag">${escapeHtml(t.trim())}</span>`).join('')}
</span>
</div>
` : ''}
${p.descripcion ? `
<div class="info-item">
<span class="info-label">📝 Descripción:</span>
<span class="info-value">
<div class="description">${escapeHtml(p.descripcion)}</div>
</span>
</div>
` : ''}
</div>
</div>
`).join('');
}

// Configuración del buscador
function setupSearch() {
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', (e) => {
const query = e.target.value.toLowerCase().trim();
if (!query) {
renderProviders();
return;
}
const filtered = providers.filter(p => {
const searchText = `${p.nombre} ${p.alias || ''} ${p.etiqueta || ''} ${p.descripcion || ''}`.toLowerCase();
return searchText.includes(query);
});
renderProviders(filtered);
});
}

// Abrir modal para agregar
function openModal() {
editingId = null;
document.getElementById('modal-title').textContent = 'Agregar Proveedor';
document.getElementById('provider-form').reset();
document.getElementById('modal').classList.add('active');
}

// Cerrar modal
function closeModal() {
document.getElementById('modal').classList.remove('active');
editingId = null;
}

// Editar proveedor
function editProvider(id) {
const provider = providers.find(p => p.id === id);
if (!provider) return;

editingId = id;
document.getElementById('modal-title').textContent = 'Editar Proveedor';
document.getElementById('prov-nombre').value = provider.nombre;
document.getElementById('prov-numero').value = provider.numero;
document.getElementById('prov-etiqueta').value = provider.etiqueta || '';
document.getElementById('prov-alias').value = provider.alias || '';
document.getElementById('prov-descripcion').value = provider.descripcion || '';

document.getElementById('modal').classList.add('active');
}

// Guardar proveedor (crear o actualizar)
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
let url = GOOGLE_SCRIPT_URL;
let options = { method: 'POST', body: null };

if (editingId) {
// Actualizar
data.id = editingId;
data.action = 'update';
options.body = JSON.stringify(data);
options.headers = { 'Content-Type': 'application/json' };
} else {
// Crear
data.action = 'create';
options.body = JSON.stringify(data);
options.headers = { 'Content-Type': 'application/json' };
}

const response = await fetch(url, options);
const result = await response.json();

if (result.success) {
closeModal();
await loadProviders();
showSuccess(editingId ? 'Proveedor actualizado correctamente' : 'Proveedor agregado correctamente');
} else {
showError('Error al guardar: ' + (result.error || 'Error desconocido'));
}
} catch (error) {
console.error('Error guardando:', error);
showError('Error de conexión. Intenta de nuevo.');
}
}

// Eliminar proveedor
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
const data = {
action: 'delete',
id: deletingId
};

const response = await fetch(GOOGLE_SCRIPT_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(data)
});

const result = await response.json();

if (result.success) {
closeConfirmModal();
await loadProviders();
showSuccess('Proveedor eliminado correctamente');
} else {
showError('Error al eliminar: ' + (result.error || 'Error desconocido'));
}
} catch (error) {
console.error('Error eliminando:', error);
showError('Error de conexión. Intenta de nuevo.');
}
}

// Helpers
function escapeHtml(text) {
const div = document.createElement('div');
div.textContent = text;
return div.innerHTML;
}

function showSuccess(message) {
alert('✅ ' + message);
}

function showError(message) {
alert('❌ ' + message);
}