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
                <div class="contact-buttons">
                    <button class="btn-whatsapp" onclick="openWhatsApp('${escapeHtml(p.numero)}', '${escapeHtml(p.nombre)}')" title="Enviar WhatsApp">
                        💬 WhatsApp
                    </button>
                    <button class="btn-phone" onclick="openPhone('${escapeHtml(p.numero)}')" title="Llamar">
                        📞 Llamar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// ABRIR WHATSAPP
// ============================================
function openWhatsApp(numero, nombre) {
    // Limpiar el número (quitar espacios, guiones, paréntesis)
    const numeroLimpio = numero.replace(/[\s\-\(\)]/g, '');
    
    // Mensaje predefinido opcional
    const mensaje = `Hola ${nombre}, te contacto desde el Portal de Proveedores. Me gustaría obtener más información sobre tus productos/servicios.`;
    
    // URL de WhatsApp
    const url = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
    
    // Abrir en nueva pestaña
    window.open(url, '_blank');
}

// ============================================
// ABRIR TELÉFONO (LLAMADA)
// ============================================
function openPhone(numero) {
    // Limpiar el número
    const numeroLimpio = numero.replace(/[\s\-\(\)]/g, '');
    
    // Abrir marcador telefónico
    window.location.href = `tel:${numeroLimpio}`;
}
