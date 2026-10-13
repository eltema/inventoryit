// ============================================================
// API - Comunicación con Google Apps Script
// ============================================================

const API_URL = 'https://script.google.com/macros/s/AKfycbyoP1ESdMFe2GM2uHoWLE63bXmjafu9S5rxsp1rO0baMTfhUC7t6MCVsreSiMHJGA8l/exec';
const TOKEN_KEY = 'inventario_token';
const USER_KEY = 'inventario_user';

// ---------- GESTIÓN DE SESIÓN ----------
function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

function getUser() {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
}

function setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// ---------- LLAMADA GENÉRICA A LA API ----------
async function apiCall(accion, datos = {}) {
    const payload = { accion, ...datos };

    let response;
    try {
        response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });
    } catch (err) {
        console.error('Fetch error:', err);
        throw new Error('No se pudo conectar con el servidor');
    }

    if (!response.ok) {
        throw new Error(`Error del servidor (${response.status})`);
    }

    let result;
    try {
        result = await response.json();
    } catch (err) {
        console.error('JSON parse error:', err);
        throw new Error('Respuesta inválida del servidor');
    }

    if (!result.success) {
        // Si el token expiró, limpiar sesión y redirigir
        if (result.mensaje && /sesi[oó]n/i.test(result.mensaje)) {
            console.warn('Sesión expirada, redirigiendo a login...');
            clearSession();
            // Solo redirigir si NO estamos ya en login
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = 'login.html';
            }
        }
        throw new Error(result.mensaje || 'Error desconocido');
    }

    return result.data;
}

// ---------- ENDPOINTS ----------
const API = {
    // Autenticación
    async login(usuario, password) {
        const data = await apiCall('login', { usuario, password });
        setToken(data.token);
        setUser({
            usuario: data.usuario,
            nombre: data.nombre,
            rol: data.rol
        });
        return data;
    },

    async logout() {
        const token = getToken();
        if (token) {
            try { await apiCall('logout', { token }); } catch (e) { /* ignorar */ }
        }
        clearSession();
    },

    // Inventario
    async obtenerInventario() {
        return await apiCall('obtenerInventario', { token: getToken() });
    },

    async crear(dispositivo) {
        return await apiCall('crear', { token: getToken(), dispositivo });
    },

    async actualizar(id, dispositivo) {
        return await apiCall('actualizar', { token: getToken(), id, dispositivo });
    },

    async eliminar(id) {
        return await apiCall('eliminar', { token: getToken(), id });
    },

    async importarMasivo(dispositivos) {
        return await apiCall('importarMasivo', {
            token: getToken(),
            dispositivos
        });
    },

    // Historial
    async obtenerHistorial(limite = 100) {
        return await apiCall('obtenerHistorial', {
            token: getToken(),
            limite
        });
    },

    // Usuarios (solo admin)
    async obtenerUsuarios() {
        return await apiCall('obtenerUsuarios', { token: getToken() });
    },

    async crearUsuario(usuario) {
        return await apiCall('crearUsuario', { token: getToken(), usuario });
    },

    async eliminarUsuario(id) {
        return await apiCall('eliminarUsuario', { token: getToken(), id });
    }
}

// ============================================================
// VERIFICAR SESIÓN (opcional, para validar antes de cargar)
// ============================================================
async function verificarSesion() {
    const token = getToken();
    if (!token) return false;

    try {
        // Hacemos una llamada ligera al backend
        await apiCall('obtenerInventario', { token });
        return true;
    } catch (error) {
        console.warn('Sesión inválida:', error.message);
        return false;
    }
};