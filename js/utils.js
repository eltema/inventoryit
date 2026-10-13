// ============================================================
// UTILS - Variables globales, estadísticas, exportar/importar, escáner
// ============================================================

// ---------- VARIABLES GLOBALES ----------
let inventario = [];  // Se llena desde la API

// ---------- ESTADÍSTICAS ----------
function obtenerEstadisticas() {
    const total = inventario.length;
    const disponibles = inventario.filter(d => d.estado === 'Disponible').length;
    const asignados = inventario.filter(d => d.estado === 'Asignado').length;
    const reparacion = inventario.filter(d => d.estado === 'Reparación').length;
    const baja = inventario.filter(d => d.estado === 'Baja').length;

    const porTipo = {};
    inventario.forEach(item => {
        porTipo[item.tipo] = (porTipo[item.tipo] || 0) + 1;
    });

    return { total, disponibles, asignados, reparacion, baja, porTipo };
}

// ============================================================
// EXPORTAR
// ============================================================

function exportarDatos() {
    if (inventario.length === 0) {
        mostrarToast('No hay datos para exportar', 'warning');
        return false;
    }
    const data = JSON.stringify(inventario, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarToast(`Exportados ${inventario.length} dispositivos a JSON`, 'success');
    return true;
}

function exportarCSV() {
    if (inventario.length === 0) {
        mostrarToast('No hay datos para exportar', 'warning');
        return false;
    }
    const columnas = ['ID', 'Tipo', 'Marca', 'Modelo', 'Serial', 'Ubicación', 'Estado', 'Fecha Creación'];
    const filas = inventario.map(item => [
        item.id, item.tipo, item.marca, item.modelo, item.serial,
        item.ubicacion || 'N/A',
        item.estado,
        item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : 'N/A'
    ]);

    let csv = columnas.join(',') + '\n';
    filas.forEach(fila => {
        const filaEscapada = fila.map(campo => {
            if (typeof campo === 'string' &&
                (campo.includes(',') || campo.includes('"') || campo.includes('\n'))) {
                return `"${campo.replace(/"/g, '""')}"`;
            }
            return campo;
        });
        csv += filaEscapada.join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarToast(`Exportados ${inventario.length} dispositivos a CSV`, 'success');
    return true;
}

function exportarExcel() {
    if (inventario.length === 0) {
        mostrarToast('No hay datos para exportar', 'warning');
        return false;
    }

    let tablaHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="UTF-8">
            <style>
                table { border-collapse: collapse; font-family: Arial, sans-serif; }
                th { background-color: #2563eb; color: white; padding: 8px; border: 1px solid #ddd; }
                td { padding: 6px 8px; border: 1px solid #ddd; }
                tr:nth-child(even) { background-color: #f9fafb; }
            </style>
        </head>
        <body>
            <h2>Inventario de Dispositivos TI</h2>
            <p>Fecha de exportación: ${new Date().toLocaleString()}</p>
            <p>Total de dispositivos: ${inventario.length}</p>
            <table>
                <thead>
                    <tr>
                        <th>ID</th><th>Tipo</th><th>Marca</th><th>Modelo</th>
                        <th>Serial</th><th>Ubicación</th><th>Estado</th><th>Fecha Creación</th>
                    </tr>
                </thead>
                <tbody>`;

    inventario.forEach(item => {
        tablaHTML += `
            <tr>
                <td>${item.id}</td>
                <td>${item.tipo}</td>
                <td>${item.marca}</td>
                <td>${item.modelo}</td>
                <td>${item.serial}</td>
                <td>${item.ubicacion || 'N/A'}</td>
                <td>${item.estado}</td>
                <td>${item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : 'N/A'}</td>
            </tr>`;
    });

    tablaHTML += `</tbody></table>
        <p><em>Exportado desde Sistema de Inventario TI</em></p>
        </body></html>`;

    const blob = new Blob([tablaHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventario_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarToast(`Exportados ${inventario.length} dispositivos a Excel`, 'success');
    return true;
}

// ============================================================
// IMPORTAR - Lectura local de archivos
// ============================================================

function leerArchivoJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!Array.isArray(data)) {
                    reject(new Error('El archivo debe contener un array de dispositivos'));
                    return;
                }
                const validos = data.filter(d =>
                    d.tipo && d.marca && d.modelo && d.serial
                );
                if (validos.length === 0) {
                    reject(new Error('No hay dispositivos válidos en el archivo'));
                    return;
                }
                resolve(validos);
            } catch (err) {
                reject(new Error('El archivo JSON tiene formato inválido'));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsText(file);
    });
}

function leerArchivoExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (typeof XLSX === 'undefined') {
                    reject(new Error('Librería XLSX no cargada'));
                    return;
                }

                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const primeraHoja = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(primeraHoja);

                if (!jsonData || jsonData.length === 0) {
                    reject(new Error('El archivo Excel está vacío'));
                    return;
                }

                const columnas = Object.keys(jsonData[0]);
                const mapeo = {
                    tipo: columnas.find(c => /tipo|categoria|categoría/i.test(c)),
                    marca: columnas.find(c => /marca|fabricante/i.test(c)),
                    modelo: columnas.find(c => /modelo|referencia/i.test(c)),
                    serial: columnas.find(c => /serial|serie|número serie/i.test(c)),
                    ubicacion: columnas.find(c => /ubicacion|ubicación|localizacion|localización|area|área/i.test(c)),
                    estado: columnas.find(c => /estado|condicion|condición|status/i.test(c))
                };

                if (!mapeo.tipo || !mapeo.marca || !mapeo.modelo || !mapeo.serial) {
                    reject(new Error('El Excel debe tener las columnas: Tipo, Marca, Modelo y Serial'));
                    return;
                }

                const estadosValidos = ['Disponible', 'Asignado', 'Reparación', 'Baja'];
                const dispositivos = jsonData.map(fila => {
                    const estado = mapeo.estado
                        ? (fila[mapeo.estado]?.toString().trim() || 'Disponible')
                        : 'Disponible';
                    const estadoNormalizado = estadosValidos.find(e =>
                        e.toLowerCase() === estado.toLowerCase()
                    ) || 'Disponible';

                    return {
                        tipo: fila[mapeo.tipo]?.toString().trim() || '',
                        marca: fila[mapeo.marca]?.toString().trim() || '',
                        modelo: fila[mapeo.modelo]?.toString().trim() || '',
                        serial: fila[mapeo.serial]?.toString().trim() || '',
                        ubicacion: mapeo.ubicacion
                            ? (fila[mapeo.ubicacion]?.toString().trim() || '')
                            : '',
                        estado: estadoNormalizado
                    };
                }).filter(d => d.tipo && d.marca && d.modelo && d.serial);

                if (dispositivos.length === 0) {
                    reject(new Error('No se encontraron datos válidos en el Excel'));
                    return;
                }

                resolve(dispositivos);
            } catch (err) {
                reject(new Error('Error al procesar el archivo Excel: ' + err.message));
            }
        };
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsArrayBuffer(file);
    });
}

// ============================================================
// ESCÁNER DE CÓDIGOS CON CÁMARA
// ============================================================

const Scanner = {
    codeReader: null,
    videoElement: null,
    devices: [],
    currentDeviceIndex: 0,
    callback: null,
    isScanning: false,
    stream: null,
    _linterna: false,

    async abrir(onDetected) {
        if (typeof ZXing === 'undefined') {
            mostrarToast('Librería de escaneo no cargada. Revisa tu conexión.', 'error');
            return;
        }

        this.callback = onDetected;
        this.videoElement = document.getElementById('scannerVideo');

        abrirModal(document.getElementById('modalScanner'));
        this.actualizarStatus('Iniciando cámara...', 'info');

        try {
            this.codeReader = new ZXing.BrowserMultiFormatReader();
            this.devices = await this.codeReader.listVideoInputDevices();

            if (this.devices.length === 0) {
                this.actualizarStatus('No se encontraron cámaras disponibles', 'error');
                return;
            }

            // Preferir cámara trasera
            this.currentDeviceIndex = this.devices.findIndex(d =>
                /back|rear|environment|trasera/i.test(d.label)
            );
            if (this.currentDeviceIndex === -1) this.currentDeviceIndex = 0;

            await this.iniciarLectura();

        } catch (err) {
            console.error('Error al iniciar escáner:', err);
            this.actualizarStatus('Error al acceder a la cámara: ' + err.message, 'error');
        }
    },

    async iniciarLectura() {
        const deviceId = this.devices[this.currentDeviceIndex].deviceId;
        this.isScanning = true;
        this.actualizarStatus('Apunta la cámara al código...', 'info');

        try {
            this.codeReader.decodeFromVideoDevice(
                deviceId,
                this.videoElement,
                (result, error) => {
                    if (result && this.isScanning) {
                        this.onDetectado(result.getText());
                    }
                }
            );

            // Guardar stream para linterna
            setTimeout(() => {
                if (this.videoElement.srcObject) {
                    this.stream = this.videoElement.srcObject;
                }
            }, 500);

        } catch (err) {
            console.error('Error al leer:', err);
            this.actualizarStatus('Error: ' + err.message, 'error');
        }
    },

    onDetectado(texto) {
        if (!this.isScanning) return;
        this.isScanning = false;

        const wrap = document.querySelector('.scanner-video-wrap');
        wrap?.classList.add('detected');

        if (navigator.vibrate) {
            navigator.vibrate([80, 40, 80]);
        }
        this.reproducirBeep();

        this.actualizarStatus('¡Detectado! ' + texto, 'success');

        if (this.callback) this.callback(texto.trim());

        setTimeout(() => this.cerrar(), 600);
    },

    async cambiarCamara() {
        if (this.devices.length <= 1) {
            mostrarToast('Solo hay una cámara disponible', 'warning');
            return;
        }

        this.detener();
        this.currentDeviceIndex = (this.currentDeviceIndex + 1) % this.devices.length;
        this.codeReader = new ZXing.BrowserMultiFormatReader();

        await new Promise(r => setTimeout(r, 250));
        await this.iniciarLectura();
    },

    async toggleLinterna() {
        try {
            if (!this.stream && this.videoElement.srcObject) {
                this.stream = this.videoElement.srcObject;
            }
            if (!this.stream) {
                mostrarToast('No se puede acceder a la cámara', 'warning');
                return;
            }

            const track = this.stream.getVideoTracks()[0];
            const caps = track.getCapabilities ? track.getCapabilities() : {};

            if (!caps.torch) {
                mostrarToast('Esta cámara no soporta linterna', 'warning');
                return;
            }

            this._linterna = !this._linterna;
            await track.applyConstraints({ advanced: [{ torch: this._linterna }] });
            document.getElementById('btnLinterna').classList.toggle('active', this._linterna);

        } catch (err) {
            console.error('Error linterna:', err);
            mostrarToast('No se pudo activar la linterna', 'error');
        }
    },

    reproducirBeep() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;

            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, ctx.currentTime);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);

            setTimeout(() => ctx.close(), 300);
        } catch (e) { /* ignorar */ }
    },

    actualizarStatus(mensaje, tipo = 'info') {
        const el = document.getElementById('scannerStatus');
        if (!el) return;

        const iconos = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle'
        };

        el.className = tipo;
        el.innerHTML = `<i class="fas ${iconos[tipo]}"></i> ${mensaje}`;
    },

    detener() {
        if (this.codeReader) {
            try { this.codeReader.reset(); } catch (e) { /* ignorar */ }
        }
        this.isScanning = false;
    },

    cerrar() {
        this.detener();

        document.querySelector('.scanner-video-wrap')?.classList.remove('detected');

        if (this.videoElement && this.videoElement.srcObject) {
            this.videoElement.srcObject.getTracks().forEach(t => t.stop());
            this.videoElement.srcObject = null;
        }

        this.stream = null;
        this._linterna = false;

        cerrarModal(document.getElementById('modalScanner'));
    }
};