// Central API helper — all calls go through here
// BASE URL can be overridden via VITE_API_URL env variable (create frontend/.env.local)
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

function getToken() { return localStorage.getItem('mb_token'); }

async function request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (networkErr) {
        throw new Error('Cannot reach the MedBlock server. Is the backend running?');
    }

    let data;
    try { data = await res.json(); }
    catch { throw new Error('Server returned an invalid response.'); }

    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
}

export const api = {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    patch: (path, body) => request('PATCH', path, body),
    delete: (path) => request('DELETE', path),
};

export function saveSession(token, user) {
    localStorage.setItem('mb_token', token);
    localStorage.setItem('mb_user', JSON.stringify(user));
}

export function getSession() {
    const user = localStorage.getItem('mb_user');
    return { token: getToken(), user: user ? JSON.parse(user) : null };
}

export function clearSession() {
    localStorage.removeItem('mb_token');
    localStorage.removeItem('mb_user');
}
