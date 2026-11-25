/**
 * auth.js - JWT 认证中间件
 *
 * 验证请求头中的 Bearer Token，解码用户信息并附加到 req.user。
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'blockbrew-secret-key-dev-only';

/**
 * JWT 认证中间件（必需）
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: '认证令牌无效或已过期' });
  }
}

/**
 * JWT 认证中间件（可选，不强制要求登录）
 */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const token = header.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      // 忽略无效 token
    }
  }
  next();
}

/**
 * 签发 JWT Token
 * @param {object} user - { id, username, email }
 * @returns {string}
 */
export function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export { JWT_SECRET };
