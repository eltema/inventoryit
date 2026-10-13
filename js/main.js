// ============================================================
// MAIN - Punto de entrada
// ============================================================

async function init() {
    // 1. Verificar autenticación
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
        clearSession();
        window.location.href = 'login.html';
        return;
    }

    // 2. Renderizar info del usuario (ANTES de cargar datos)
    //    así el usuario ve el header aunque la API tarde
    renderizarInfoUsuario();

    // 3. Mostrar loading
    DOM.tablaBody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #6366f1;"></i>
                <p style="margin-top: 12px; color: #64748b;">Cargando inventario...</p>
            </td>
        </tr>
    `;

    try {
        // 4. Cargar inventario desde Google Sheets
        inventario = await API.obtenerInventario();

        // 5. Renderizar tabla
        aplicarFiltros();

        console.log('✅ Inventario cargado:', inventario.length, 'items');
        console.log('📊 Estadísticas:', obtenerEstadisticas());

    } catch (error) {
        console.error('Error al iniciar:', error);

        // Si el token expiró, redirigir a login
        if (/sesi[oó]n/i.test(error.message)) {
            clearSession();
            window.location.href = 'login.html';
            return;
        }

        // Otros errores: mostrar en la tabla
        DOM.tablaBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; display: block; margin-bottom: 12px;"></i>
                    <p style="font-weight: 600; margin-bottom: 4px;">Error al cargar los datos</p>
                    <p style="font-size: 0.9rem; color: #64748b;">${error.message}</p>
                    <button class="btn btn-primary" style="margin-top: 16px;" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                </td>
            </tr>
        `;

        mostrarToast('Error al cargar: ' + error.message, 'error');
    }
}

// ============================================================
// Info del usuario en el header + botón de cerrar sesión
// ============================================================

function renderizarInfoUsuario() {
    const user = getUser();
    if (!user) return;

    const headerRight = document.querySelector('.header-right');
    if (!headerRight) {
        console.warn('⚠️ No se encontró .header-right');
        return;
    }

    // Eliminar badge anterior si existe (para evitar duplicados)
    const existente = document.getElementById('userBadge');
    if (existente) existente.remove();

    const userBadge = document.createElement('div');
    userBadge.id = 'userBadge';
    userBadge.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        background: rgba(255, 255, 255, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.9);
        border-radius: 10px;
        margin-right: 8px;
        backdrop-filter: blur(12px);
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    `;

    const inicial = (user.nombre || user.usuario || '?').charAt(0).toUpperCase();

    userBadge.innerHTML = `
        <div style="
            width: 36px; height: 36px; border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #06b6d4);
            color: white; font-weight: 700; font-size: 1rem;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 10px rgba(99, 102, 241, 0.35);
        ">${inicial}</div>
        <div style="line-height: 1.2; min-width: 0;">
            <div style="font-weight: 600; font-size: 0.9rem; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${user.nombre || user.usuario}
            </div>
            <div style="font-size: 0.72rem; color: #64748b; text-transform: capitalize;">
                ${user.rol}
            </div>
        </div>
        <button id="btnLogout" title="Cerrar sesión" style="
            background: rgba(239, 68, 68, 0.1);
            border: none;
            cursor: pointer;
            color: #ef4444;
            font-size: 1rem;
            padding: 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        ">
            <i class="fas fa-sign-out-alt"></i>
        </button>
    `;

    // Insertar al inicio del header-right
    headerRight.insertBefore(userBadge, headerRight.firstChild);

    // Hover effect del botón logout
    const btnLogout = document.getElementById('btnLogout');
    btnLogout.addEventListener('mouseenter', () => {
        btnLogout.style.background = 'rgba(239, 68, 68, 0.2)';
        btnLogout.style.transform = 'scale(1.05)';
    });
    btnLogout.addEventListener('mouseleave', () => {
        btnLogout.style.background = 'rgba(239, 68, 68, 0.1)';
        btnLogout.style.transform = 'scale(1)';
    });

    // Click para cerrar sesión
    btnLogout.addEventListener('click', async () => {
        if (confirm('¿Cerrar sesión?')) {
            try {
                await API.logout();
            } catch (e) {
                console.warn('Error al cerrar sesión en servidor:', e);
            }
            clearSession();
            window.location.href = 'login.html';
        }
    });
}

// ============================================================
// Arranque
// ============================================================
document.addEventListener('DOMContentLoaded', init);