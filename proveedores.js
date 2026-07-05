// ============================================
// CÓDIGO DEL GOOGLE APPS SCRIPT (se muestra en el modal)
// ============================================
const GOOGLE_SCRIPT_CODE = `// ============================================
// CONFIGURACIÓN
// ============================================
const SHEET_NAME = 'Proveedores';
const PASSWORD = 'Adri2712*';

// ============================================
// FUNCIÓN DE INICIALIZACIÓN - EJECUTA ESTA PRIMERO
// ============================================
function setup() {
const ss = SpreadsheetApp.getActiveSpreadsheet();
let sheet = ss.getSheetByName(SHEET_NAME);

// Si no existe la hoja, crearla
if (!sheet) {
sheet = ss.insertSheet(SHEET_NAME);
}

// Limpiar y crear encabezados
sheet.clear();
sheet.getRange('A1:F1').setValues([['id', 'nombre', 'numero', 'etiqueta', 'alias', 'descripcion']]);
sheet.getRange('A1:F1').setFontWeight('bold');
sheet.getRange('A1:F1').setBackground('#4285f4');
sheet.getRange('A1:F1').setFontColor('#ffffff');

// Ajustar ancho de columnas
sheet.setColumnWidth(1, 80);
sheet.setColumnWidth(2, 200);
sheet.setColumnWidth(3, 150);
sheet.setColumnWidth(4, 200);
sheet.setColumnWidth(5, 150);
sheet.setColumnWidth(6, 400);

SpreadsheetApp.getUi().alert('✅ Hoja de Proveedores creada exitosamente!');
}

// ============================================
// FUNCIÓN PRINCIPAL - POST
// ============================================
function doPost(e) {
try {
const data = JSON.parse(e.postData.contents);
const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

if (!sheet) {
return createResponse(false, 'Hoja no encontrada. Ejecuta setup() primero.');
}

if (data.action === 'create') return createProvider(sheet, data);
if (data.action === 'update') return updateProvider(sheet, data);
if (data.action === 'delete') return deleteProvider(sheet, data);

return createResponse(false, 'Acción no válida');
} catch (error) {
return createResponse(false, error.toString());
}
}

// ============================================
// FUNCIÓN GET - OBTENER TODOS
// ============================================
function doGet(e) {
try {
const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

if (!sheet) {
return ContentService.createTextOutput(JSON.stringify({ 
success: false, 
error: 'Hoja no encontrada. Ejecuta setup() primero.' 
})).setMimeType(ContentService.MimeType.JSON);
}

const data = sheet.getDataRange().getValues();
const providers = [];

// Saltar encabezados (fila 1)
for (let i = 1; i < data.length; i++) {
if (data[i][0]) {
providers.push({
id: data[i][0],
nombre: data[i][1],
numero: data[i][2],
etiqueta: data[i][3],
alias: data[i][4],
descripcion: data[i][5]
});
}
}

return ContentService.createTextOutput(JSON.stringify({ 
success: true, 
providers: providers 
})).setMimeType(ContentService.MimeType.JSON);
} catch (error) {
return ContentService.createTextOutput(JSON.stringify({ 
success: false, 
error: error.toString() 
})).setMimeType(ContentService.MimeType.JSON);
}
}

// ============================================
// CREAR PROVEEDOR
// ============================================
function createProvider(sheet, data) {
try {
const lastRow = sheet.getLastRow();
const newId = lastRow;

sheet.appendRow([
newId,
data.nombre,
data.numero,
data.etiqueta || '',
data.alias || '',
data.descripcion || ''
]);

return createResponse(true, 'Proveedor creado correctamente');
} catch (error) {
return createResponse(false, error.toString());
}
}

// ============================================
// ACTUALIZAR PROVEEDOR
// ============================================
function updateProvider(sheet, data) {
try {
const id = data.id;
const allData = sheet.getDataRange().getValues();

for (let i = 1; i < allData.length; i++) {
if (allData[i][0] === id) {
const row = i + 1;
sheet.getRange(row, 2).setValue(data.nombre);
sheet.getRange(row, 3).setValue(data.numero);
sheet.getRange(row, 4).setValue(data.etiqueta || '');
sheet.getRange(row, 5).setValue(data.alias || '');
sheet.getRange(row, 6).setValue(data.descripcion || '');
return createResponse(true, 'Proveedor actualizado correctamente');
}
}

return createResponse(false, 'Proveedor no encontrado');
} catch (error) {
return createResponse(false, error.toString());
}
}

// ============================================
// ELIMINAR PROVEEDOR
// ============================================
function deleteProvider(sheet, data) {
try {
const id = data.id;
const allData = sheet.getDataRange().getValues();

for (let i = 1; i < allData.length; i++) {
if (allData[i][0] === id) {
sheet.deleteRow(i + 1);
return createResponse(true, 'Proveedor eliminado correctamente');
}
}

return createResponse(false, 'Proveedor no encontrado');
} catch (error) {
return createResponse(false, error.toString());
}
}

// ============================================
// HELPER - CREAR RESPUESTA
// ============================================
function createResponse(success, message) {
return ContentService.createTextOutput(JSON.stringify({ 
success: success, 
message: message 
})).setMimeType(ContentService.MimeType.JSON);
}`;

// ============================================
// VARIABLES GLOBALES
// ============================================
let GOOGLE_SCRIPT_URL = localStorage.getItem('googleScriptUrl') || '';
let providers = [];
let editingId = null;
let deletingId = null;

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
checkConnection();
checkTheme();
if (GOOGLE_SCRIPT_URL) {
loadProviders();
}
});

// ============================================
// VERIFICAR CONEXIÓN
// ============================================
function checkConnection() {
const connBar = document.getElementById('connection-bar');
const connStatus = document.getElementById('connection-status');
const toolbar = document.getElementById('toolbar');

if (GOOGLE_SCRIPT_URL) {
connBar.classList.add('connected');
connStatus.textContent = '✅ Conectado a Google Sheets';
toolbar.style.display = 'flex';
} else {
connBar.classList.remove('connected');
connStatus.textContent = '⚠️ No conectado a Google Sheets';
toolbar.style.display = 'none';
}
}

// ============================================
// MODAL DE CONFIGURACIÓN
// ============================================
function showSetupModal() {
document.getElementById('script-url').value = GOOGLE_SCRIPT_URL;
document.getElementById('script-code').textContent = GOOGLE_SCRIPT_CODE;
document.getElementById('modal-setup').classList.add('active');
}

function closeSetupModal() {
document.getElementById('modal-setup').classList.remove('active');
}

function saveScriptUrl() {
const url = document.getElementById('script-url').value.trim();
if (!url) {
showNotification('Por favor ingresa la URL del script', 'error');
return;
}

GOOGLE_SCRIPT_URL = url;
localStorage.setItem('googleScriptUrl', url);
closeSetupModal();
checkConnection();
loadProviders();
showNotification('✅ Conectado exitosamente', 'success');
}

function copyScriptCode() {
navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE).then(() => {
showNotification('📋 Código copiado al portapapeles', 'success');
}).catch(() => {
// Fallback para navegadores antiguos
const textArea = document.createElement('textarea');
textArea.value = GOOGLE_SCRIPT_CODE;
document.body.appendChild(textArea);
textArea.select();
document.execCommand('copy');
document.body.removeChild(textArea);
showNotification('📋 Código copiado al portapapeles', 'success');
});
}

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
<span class="info-label"> Descripción:</span>
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
document.getElementById('modal-title').textContent = '️ Editar Proveedor';
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
