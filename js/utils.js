// ============================================================
// UTILS - Variables globales, estadísticas, exportar/importar
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