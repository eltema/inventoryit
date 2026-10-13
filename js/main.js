// ============================================================
// MAIN - Punto de entrada
// ============================================================

async function init() {
    // 1. Verificar autenticación
    if (!getToken()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // 2. Mostrar loading
        DOM.tablaBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #2563eb;"></i>
                    <p style="margin-top: 12px;">Cargando inventario...</p>
                </td>
            </tr>
        `;

        // 3. Cargar inventario desde Google Sheets
        inventario = await API.obtenerInventario();

        // 4. Renderizar datos del usuario en el header
        renderizarInfoUsuario();

        // 5. Renderizar tabla
        aplicarFiltros();

        console.log('✅ Inventario cargado:', inventario.length, 'items');
        console.log('📊 Estadísticas:', obtenerEstadisticas());

    } catch (error) {
        console.error('Error al iniciar:', error);
        mostrarToast('Error al cargar los datos: ' + error.message, 'error');
    }
}

// ---------- Info del usuario en el header ----------
function renderizarInfoUsuario() {
    const user = getUser();
    if (!user) return;

    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    // Evitar duplicados
    if (document.getElementById('userBadge')) return;

    const userBadge = document.createElement('div');
    userBadge.id = 'userBadge';
    userBadge.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        background: #f3f4f6;
        border-radius: 8px;
        margin-right: 8px;
    `;
    userBadge.innerHTML = `
        <i class="fas fa-user-circle" style="color: #2563eb; font-size: 1.4rem;"></i>
        <div style="line-height: 1.2;">
            <div style="font-weight: 600; font-size: 0.9rem;">${user.nombre || user.usuario}</div>
            <div style="font-size: 0.75rem; color: #6b7280; text-transform: capitalize;">${user.rol}</div>
        </div>
        <button id="btnLogout" title="Cerrar sesión" style="
            background: none;
            border: none;
            cursor: pointer;
            color: #ef4444;
            font-size: 1.1rem;
            margin-left: 6px;
            padding: 4px;
        ">
            <i class="fas fa-sign-out-alt"></i>
        </button>
    `;

    headerRight.insertBefore(userBadge, headerRight.firstChild);

    document.getElementById('btnLogout').addEventListener('click', async () => {
        if (confirm('¿Cerrar sesión?')) {
            await API.logout();
            window.location.href = 'login.html';
        }
    });
}

// ---------- Arranque ----------
document.addEventListener('DOMContentLoaded', init);