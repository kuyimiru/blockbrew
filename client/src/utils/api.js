/**
 * api.js - HTTP 请求工具
 *
 * 封装 fetch 请求，自动附加 JWT Token。
 */

const API_BASE = '/api';

/**
 * 发送 API 请求
 * @param {string} endpoint - 如 '/auth/login'
 * @param {object} options - fetch 选项
 * @returns {Promise<{ok: boolean, data: any, error?: string}>}
 */
export async function api(endpoint, options = {}) {
  const token = localStorage.getItem('blockbrew_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await res.json();
    return { ok: res.ok, data, error: res.ok ? null : data.error };
  } catch (err) {
    return { ok: false, data: null, error: err.message };
  }
}

/**
 * GET 请求
 */
export async function get(endpoint) {
  return api(endpoint, { method: 'GET' });
}

/**
 * POST 请求
 */
export async function post(endpoint, body) {
  return api(endpoint, { method: 'POST', body: JSON.stringify(body) });
}

/**
 * PUT 请求
 */
export async function put(endpoint, body) {
  return api(endpoint, { method: 'PUT', body: JSON.stringify(body) });
}

/**
 * DELETE 请求
 */
export async function del(endpoint) {
  return api(endpoint, { method: 'DELETE' });
}
