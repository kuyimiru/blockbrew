/**
 * BlockBrew 服务器入口
 *
 * Express 后端，提供：
 * - 用户认证（注册/登录/JWT）
 * - 皮肤 CRUD（保存/加载/删除）
 * - 公开皮肤画廊
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { optionalAuth } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import skinRoutes from './routes/skins.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '5mb' })); // 允许较大的 base64 皮肤数据

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/skins', skinRoutes);

// 公开皮肤画廊（无需认证）
app.get('/api/gallery', optionalAuth, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const skins = db.prepare(
      `SELECT s.id, s.name, s.model_type, s.preview_url, s.created_at, s.updated_at,
              u.username as author
       FROM skins s JOIN users u ON s.user_id = u.id
       WHERE s.is_public = 1
       ORDER BY s.updated_at DESC
       LIMIT ? OFFSET ?`
    ).all(limit, offset);

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM skins WHERE is_public = 1'
    ).get().count;

    res.json({ skins, total, page });
  } catch (err) {
    console.error('Gallery error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 生产环境下提供静态文件
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// 错误处理
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🧊 BlockBrew server running on http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});
