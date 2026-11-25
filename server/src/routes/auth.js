/**
 * auth.js - 认证路由
 *
 * POST /api/auth/register - 注册
 * POST /api/auth/login    - 登录
 * GET  /api/auth/me       - 获取当前用户信息
 */

import { Router } from 'express';
import db from '../db.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ error: '用户名、邮箱和密码为必填项' });
    }
    if (username.length < 2) {
      return res.status(400).json({ error: '用户名长度至少为2位' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少为6位' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '邮箱格式不正确' });
    }

    // 检查用户名和邮箱唯一性
    const existing = db.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).get(username, email);
    if (existing) {
      return res.status(409).json({ error: '用户名或邮箱已被使用' });
    }

    // 创建用户
    const passwordHash = await hashPassword(password);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, passwordHash);

    const user = {
      id: result.lastInsertRowid,
      username,
      email,
    };

    const token = signToken(user);

    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * 支持邮箱或用户名登录
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱/用户名和密码为必填项' });
    }

    // 查找用户（支持邮箱或用户名）
    const user = db.prepare(
      'SELECT id, username, email, password_hash FROM users WHERE email = ? OR username = ?'
    ).get(email, email);

    if (!user) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '账号或密码错误' });
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/auth/me
 * 获取当前登录用户信息
 */
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare(
    'SELECT id, username, email, created_at FROM users WHERE id = ?'
  ).get(req.user.userId);

  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json({ user });
});

export default router;
