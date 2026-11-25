/**
 * useUserStore.js — 认证状态管理（含试用/访客模式）
 */
import { create } from 'zustand';

const TOKEN_KEY = 'blockbrew_token';
const USER_KEY = 'blockbrew_user';

function loadAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    return { token, user, isAuthenticated: !!token && !!user, isGuest: false };
  } catch { return { token: null, user: null, isAuthenticated: false, isGuest: false }; }
}

const persisted = loadAuth();

export const useUserStore = create((set, get) => ({
  token: persisted.token,
  user: persisted.user,
  isAuthenticated: persisted.isAuthenticated,
  isGuest: false,  // 试用模式标志
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '登录失败');

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isAuthenticated: true, isGuest: false, loading: false });
      return true;
    } catch (err) {
      set({ loading: false, error: err.message });
      return false;
    }
  },

  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '注册失败');

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      set({ token: data.token, user: data.user, isAuthenticated: true, isGuest: false, loading: false });
      return true;
    } catch (err) {
      set({ loading: false, error: err.message });
      return false;
    }
  },

  /** 进入试用模式 */
  enterGuest: () => {
    set({
      isAuthenticated: false, isGuest: true,
      user: { username: '访客', email: '' }, token: null,
    });
  },

  /** 登出 */
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false, isGuest: false });
  },

  getAuthHeaders: () => {
    const { token } = get();
    return token
      ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' };
  },

  clearError: () => set({ error: null }),
}));
