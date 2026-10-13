// ============================================================
// UI - DOM, renderizado, eventos, modales, toast
// ============================================================

// ---------- REFERENCIAS DOM ----------
const DOM = {
    tablaBody: document.getElementById('tablaBody'),
    totalItems: document.getElementById('totalItems'),
    totalStats: document.getElementById('totalStats'),
    disponiblesStats: document.getElementById('disponiblesStats'),
    asignadosStats: document.getElementById('asignadosStats'),
    reparacionStats: document.getElementById('reparacionStats'),
    searchInput: document.getElementById('searchInput'),
    filterTipo: document.getElementById('filterTipo'),
    filterEstado: document.getElementById('filterEstado'),
    btnLimpiarFiltros: document.getElementById('btnLimpiarFiltros'),
    itemsMostrados: document.getElementById('itemsMostrados'),
    modalForm: document.getElementById('modalForm'),
    modalConfirmar: document.getElementById('modalConfirmar'),
    modalTitle: document.getElementById('modalTitle'),
    editId: document.getElementById('editId'),
    formTipo: document.getElementById('formTipo'),
    formMarca: document.getElementById('formMarca'),
    formModelo: document.getElementById('formModelo'),
    formSerial: document.getElementById('formSerial'),
    formUbicacion: document.getElementById('formUbicacion'),
    formEstado: document.getElementById('formEstado'),
    btnAgregar: document.getElementById('btnAgregar'),
    btnGuardar: document.getElementById('btnGuardar'),
    btnCancelar: document.getElementById('btnCancelar'),
    btnCerrarModal: document.getElementById('btnCerrarModal'),
    confirmarSerial: document.getElementById('confirmarSerial'),
    btnConfirmarEliminar: document.getElementById('btnConfirmarEliminar'),
    btnCancelarEliminar: document.getElementById('btnCancelarEliminar'),
    btnCerrarConfirmar: document.getElementById('btnCerrarConfirmar'),
    toastContainer: document.getElementById('toastContainer'),
    deviceForm: document.getElementById('deviceForm')
};

// ============================================================
// CONSULTA AL FABRICANTE (Colombia)
// ============================================================

function consultarFabricante(marca, serial) {
    const marcaNorm = (marca || '').toLowerCase().trim();
    const s = encodeURIComponent((serial || '').trim());

    if (!s) {
        mostrarToast('Este dispositivo no tiene serial registrado', 'warning');
        return;
    }

    const urls = {
        'apple':   `https://checkcoverage.apple.com/co/es/?sn=${s}`,
        'macbook': `https://checkcoverage.apple.com/co/es/?sn=${s}`,
        'mac':     `https://checkcoverage.apple.com/co/es/?sn=${s}`,
        'hp':      `https://support.hp.com/co-es/warrantycheck?serialNumber=${s}`,
        'dell':    `https://www.dell.com/support/home/es-co/product-support/servicetag/${s}`,
        'lenovo':  `https://pcsupport.lenovo.com/co/es/warrantylookup?serialNumber=${s}`,
        'acer':    `https://www.acer.com/co-es/support/warranty`
    };

    let url = null;
    let marcaEncontrada = null;

    for (const key in urls) {
        if (marcaNorm.includes(key)) {
            url = urls[key];
            marcaEncontrada = key;
            break;
        }
    }

    if (!url) {
        mostrarToast(`Marca "${marca}" no soportada para consulta automática`, 'warning');
        return;
    }

    // Copiar serial al portapapeles (útil para HP, Lenovo, Acer)
    try {
        navigator.clipboard.writeText(serial);
    } catch (e) { /* ignorar */ }

    // Abrir en nueva pestaña
    window.open(url, '_blank', 'noopener,noreferrer');

    // Mensaje según el fabricante
    if (['hp', 'lenovo', 'acer'].includes(marcaEncontrada)) {
        mostrarToast(`Serial copiado. Pégalo (Ctrl+V) en la página de ${marca}`, 'info');
    } else if (marcaEncontrada === 'apple' || marcaEncontrada === 'dell') {
        mostrarToast(`Abriendo información de ${marca}...`, 'success');
    }
}

// ============================================================
// RENDERIZADO
// ============================================================

function renderizarInventario(items) {
    const datos = items || inventario;

    actualizarEstadisticas(datos);

    if (datos.length === 0) {
        DOM.tablaBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-light);">
                    <i class="fas fa-box-open" style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                    No hay dispositivos registrados
                </td>
            </tr>
        `;
        DOM.itemsMostrados.textContent = 'Mostrando 0 items';
        DOM.totalItems.textContent = '0';
        return;
    }

    let html = '';
    datos.forEach(item => {
        html += `
            <tr>
                <td data-label="ID"><strong>#${item.id}</strong></td>
                <td data-label="Tipo">${item.tipo}</td>
                <td data-label="Marca">${item.marca}</td>
                <td data-label="Modelo">${item.modelo}</td>
                <td data-label="Serial"><code style="background: var(--background); padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">${item.serial}</code></td>
                <td data-label="Ubicación">${item.ubicacion || 'N/A'}</td>
                <td data-label="Estado"><span class="estado-badge estado-${item.estado}">${item.estado}</span></td>
                <td data-label="Acciones">
                    <div class="acciones-btns">
                        <button class="btn-icon btn-info" onclick="consultarFabricante('${(item.marca || '').replace(/'/g, "\\'")}', '${(item.serial || '').replace(/'/g, "\\'")}')" title="Ver info oficial">
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        <button class="btn-icon btn-edit" onclick="editarDispositivo(${item.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon btn-delete" onclick="confirmarEliminar(${item.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    DOM.tablaBody.innerHTML = html;
    DOM.totalItems.textContent = datos.length;
    DOM.itemsMostrados.textContent = `Mostrando ${datos.length} items`;
}

function actualizarEstadisticas(datos) {
    const total = datos.length;
    const disponibles = datos.filter(d => d.estado === 'Disponible').length;
    const asignados = datos.filter(d => d.estado === 'Asignado').length;
    const reparacion = datos.filter(d => d.estado === 'Reparación').length;

    DOM.totalStats.textContent = total;
    DOM.disponiblesStats.textContent = disponibles;
    DOM.asignadosStats.textContent = asignados;
    DOM.reparacionStats.textContent = reparacion;
}

// ============================================================
// FILTROS
// ============================================================

function aplicarFiltros() {
    const searchTerm = DOM.searchInput.value.toLowerCase().trim();
    const tipoFiltro = DOM.filterTipo.value;
    const estadoFiltro = DOM.filterEstado.value;

    let filtrados = [...inventario];

    if (searchTerm) {
        filtrados = filtrados.filter(item =>
            (item.serial || '').toLowerCase().includes(searchTerm) ||
            (item.modelo || '').toLowerCase().includes(searchTerm) ||
            (item.marca || '').toLowerCase().includes(searchTerm) ||
            (item.tipo || '').toLowerCase().includes(searchTerm) ||
            (item.ubicacion || '').toLowerCase().includes(searchTerm)
        );
    }

    if (tipoFiltro) {
        filtrados = filtrados.filter(item => item.tipo === tipoFiltro);
    }

    if (estadoFiltro) {
        filtrados = filtrados.filter(item => item.estado === estadoFiltro);
    }

    renderizarInventario(filtrados);
}

// ============================================================
// CRUD (con API)
// ============================================================

async function agregarDispositivo(dispositivo) {
    try {
        const nuevo = await API.crear(dispositivo);
        inventario.push(nuevo);
        aplicarFiltros();
        mostrarToast('Dispositivo agregado correctamente', 'success');
    } catch (error) {
        mostrarToast(error.message, 'error');
    }
}

function editarDispositivo(id) {
    const item = inventario.find(i => parseInt(i.id) === parseInt(id));
    if (!item) {
        mostrarToast('Dispositivo no encontrado', 'error');
        return;
    }

    DOM.modalTitle.textContent = 'Editar Dispositivo';
    DOM.editId.value = id;
    DOM.formTipo.value = item.tipo;
    DOM.formMarca.value = item.marca;
    DOM.formModelo.value = item.modelo;
    DOM.formSerial.value = item.serial;
    DOM.formUbicacion.value = item.ubicacion || '';
    DOM.formEstado.value = item.estado;

    abrirModal(DOM.modalForm);
}

async function actualizarDispositivo(id, datos) {
    try {
        const actualizado = await API.actualizar(id, datos);
        const index = inventario.findIndex(i => parseInt(i.id) === parseInt(id));
        if (index !== -1) {
            inventario[index] = { ...inventario[index], ...actualizado };
        }
        aplicarFiltros();
        mostrarToast('Dispositivo actualizado correctamente', 'success');
    } catch (error) {
        mostrarToast(error.message, 'error');
    }
}

function confirmarEliminar(id) {
    const item = inventario.find(i => parseInt(i.id) === parseInt(id));
    if (!item) {
        mostrarToast('Dispositivo no encontrado', 'error');
        return;
    }

    DOM.confirmarSerial.textContent = `${item.marca} ${item.modelo} (${item.serial})`;
    DOM.btnConfirmarEliminar.dataset.id = id;
    abrirModal(DOM.modalConfirmar);
}

async function eliminarDispositivo(id) {
    try {
        await API.eliminar(id);
        inventario = inventario.filter(i => parseInt(i.id) !== parseInt(id));
        aplicarFiltros();
        mostrarToast('Dispositivo eliminado correctamente', 'warning');
        cerrarModal(DOM.modalConfirmar);
    } catch (error) {
        mostrarToast(error.message, 'error');
    }
}

// ============================================================
// MODALES
// ============================================================

function abrirModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';

    if (modal === DOM.modalForm) {
        DOM.deviceForm.reset();
        DOM.editId.value = '';
        DOM.modalTitle.textContent = 'Agregar Dispositivo';
    }
}

// ============================================================
// TOAST
// ============================================================

function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;

    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
        <i class="fas ${iconos[tipo] || iconos.info}"></i>
        <span>${mensaje}</span>
    `;

    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// EVENTOS
// ============================================================

DOM.btnAgregar.addEventListener('click', () => {
    DOM.modalTitle.textContent = 'Agregar Dispositivo';
    DOM.editId.value = '';
    DOM.deviceForm.reset();
    abrirModal(DOM.modalForm);
});

DOM.deviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = parseInt(DOM.editId.value);
    const datos = {
        tipo: DOM.formTipo.value,
        marca: DOM.formMarca.value.trim(),
        modelo: DOM.formModelo.value.trim(),
        serial: DOM.formSerial.value.trim(),
        ubicacion: DOM.formUbicacion.value.trim(),
        estado: DOM.formEstado.value
    };

    if (!datos.tipo || !datos.marca || !datos.modelo || !datos.serial) {
        mostrarToast('Todos los campos obligatorios deben estar llenos', 'error');
        return;
    }

    DOM.btnGuardar.disabled = true;
    DOM.btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';

    if (id) {
        await actualizarDispositivo(id, datos);
    } else {
        await agregarDispositivo(datos);
    }

    DOM.btnGuardar.disabled = false;
    DOM.btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar';

    cerrarModal(DOM.modalForm);
});

DOM.btnCancelar.addEventListener('click', () => cerrarModal(DOM.modalForm));
DOM.btnCerrarModal.addEventListener('click', () => cerrarModal(DOM.modalForm));

DOM.btnConfirmarEliminar.addEventListener('click', async () => {
    const id = parseInt(DOM.btnConfirmarEliminar.dataset.id);
    await eliminarDispositivo(id);
});

DOM.btnCancelarEliminar.addEventListener('click', () => cerrarModal(DOM.modalConfirmar));
DOM.btnCerrarConfirmar.addEventListener('click', () => cerrarModal(DOM.modalConfirmar));

DOM.btnLimpiarFiltros.addEventListener('click', () => {
    DOM.searchInput.value = '';
    DOM.filterTipo.value = '';
    DOM.filterEstado.value = '';
    aplicarFiltros();
});

let timeoutBusqueda;
DOM.searchInput.addEventListener('input', () => {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(aplicarFiltros, 300);
});

DOM.filterTipo.addEventListener('change', aplicarFiltros);
DOM.filterEstado.addEventListener('change', aplicarFiltros);

// ============================================================
// BOTONES EXPORTAR (dropdown)
// ============================================================

const btnExportarDropdown = document.getElementById('btnExportarDropdown');
const dropdownExportar = document.getElementById('dropdownExportar');

if (btnExportarDropdown && dropdownExportar) {
    btnExportarDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownExportar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-group')) {
            dropdownExportar.classList.remove('active');
        }
    });
}

const btnExportarJSON = document.getElementById('btnExportarJSON');
if (btnExportarJSON) {
    btnExportarJSON.addEventListener('click', () => {
        exportarDatos();
        dropdownExportar.classList.remove('active');
    });
}

const btnExportarCSV = document.getElementById('btnExportarCSV');
if (btnExportarCSV) {
    btnExportarCSV.addEventListener('click', () => {
        exportarCSV();
        dropdownExportar.classList.remove('active');
    });
}

const btnExportarExcel = document.getElementById('btnExportarExcel');
if (btnExportarExcel) {
    btnExportarExcel.addEventListener('click', () => {
        exportarExcel();
        dropdownExportar.classList.remove('active');
    });
}

// ============================================================
// IMPORTAR JSON
// ============================================================

const btnImportar = document.getElementById('btnImportar');
if (btnImportar) {
    btnImportar.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const dispositivos = await leerArchivoJSON(file);
                await procesarImportacion(dispositivos, 'JSON');
            } catch (error) {
                mostrarToast(error.message, 'error');
            }
        };
        input.click();
    });
}

// ============================================================
// IMPORTAR EXCEL
// ============================================================

const btnImportarExcel = document.getElementById('btnImportarExcel');
if (btnImportarExcel) {
    btnImportarExcel.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xlsx,.xls';

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const dispositivos = await leerArchivoExcel(file);
                await procesarImportacion(dispositivos, 'Excel');
            } catch (error) {
                mostrarToast(error.message, 'error');
            }
        };
        input.click();
    });
}

// ============================================================
// PROCESO COMÚN DE IMPORTACIÓN
// ============================================================

async function procesarImportacion(dispositivos, origen) {
    if (!dispositivos || dispositivos.length === 0) {
        mostrarToast('No hay dispositivos para importar', 'warning');
        return;
    }

    const confirmar = confirm(
        `📊 Se encontraron ${dispositivos.length} dispositivos en el archivo ${origen}.\n\n` +
        `¿Deseas importarlos al inventario?\n\n` +
        `(Los seriales duplicados serán ignorados automáticamente)`
    );

    if (!confirmar) return;

    try {
        mostrarToast('Importando dispositivos...', 'info');
        const resultado = await API.importarMasivo(dispositivos);

        inventario = await API.obtenerInventario();
        aplicarFiltros();

        mostrarToast(
            `✅ Importados: ${resultado.importados} | Duplicados omitidos: ${resultado.duplicados}`,
            'success'
        );
    } catch (error) {
        mostrarToast('Error al importar: ' + error.message, 'error');
    }
}

// ============================================================
// ESCÁNER DE CÓDIGOS
// ============================================================

const btnEscanearSerial = document.getElementById('btnEscanearSerial');
const btnCerrarScanner = document.getElementById('btnCerrarScanner');
const btnCambiarCamara = document.getElementById('btnCambiarCamara');
const btnLinterna = document.getElementById('btnLinterna');
const btnEnfocar = document.getElementById('btnEnfocar');
const modalScanner = document.getElementById('modalScanner');

if (btnEscanearSerial) {
    btnEscanearSerial.addEventListener('click', () => {
        Scanner.abrir((codigo) => {
            DOM.formSerial.value = codigo;
            mostrarToast('Serial capturado: ' + codigo, 'success');
        });
    });
}

if (btnCerrarScanner) {
    btnCerrarScanner.addEventListener('click', () => Scanner.cerrar());
}

if (btnCambiarCamara) {
    btnCambiarCamara.addEventListener('click', () => Scanner.cambiarCamara());
}

if (btnLinterna) {
    btnLinterna.addEventListener('click', () => Scanner.toggleLinterna());
}

if (btnEnfocar) {
    btnEnfocar.addEventListener('click', () => Scanner.forzarEnfoque());
}

if (modalScanner) {
    modalScanner.addEventListener('click', (e) => {
        if (e.target === modalScanner) Scanner.cerrar();
    });
}

// ============================================================
// FIN
// ============================================================

console.log('✅ UI cargada correctamente');