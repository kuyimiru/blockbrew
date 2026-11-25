/**
 * skins.js - 皮肤 CRUD 路由
 *
 * GET    /api/skins       - 获取用户的所有皮肤
 * GET    /api/skins/:id   - 获取单个皮肤详情
 * POST   /api/skins       - 创建新皮肤
 * PUT    /api/skins/:id   - 更新皮肤
 * DELETE /api/skins/:id   - 删除皮肤
 * GET    /api/gallery     - 公开皮肤画廊
 */

import { Router } from 'express';
import db from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/skins
 * 获取当前用户的所有皮肤（摘要，不含像素数据）
 */
router.get('/', requireAuth, (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const skins = db.prepare(
      'SELECT id, name, model_type, is_public, preview_url, created_at, updated_at FROM skins WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    ).all(req.user.userId, limit, offset);

    const total = db.prepare(
      'SELECT COUNT(*) as count FROM skins WHERE user_id = ?'
    ).get(req.user.userId).count;

    res.json({ skins, total, page });
  } catch (err) {
    console.error('Get skins error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/skins/:id
 * 获取单个皮肤完整数据（含像素数据）
 */
router.get('/:id', requireAuth, (req, res) => {
  try {
    const skin = db.prepare(
      'SELECT * FROM skins WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.userId);

    if (!skin) {
      return res.status(404).json({ error: '皮肤不存在或无权访问' });
    }

    res.json({
      skin: {
        id: skin.id,
        name: skin.name,
        modelType: skin.model_type,
        innerData: skin.inner_data,
        outerData: skin.outer_data,
        isPublic: !!skin.is_public,
        previewUrl: skin.preview_url,
        createdAt: skin.created_at,
        updatedAt: skin.updated_at,
      },
    });
  } catch (err) {
    console.error('Get skin error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * POST /api/skins
 * 创建新皮肤
 */
router.post('/', requireAuth, (req, res) => {
  try {
    const { name, modelType, innerData, outerData, isPublic } = req.body;

    if (!innerData) {
      return res.status(400).json({ error: '皮肤数据不能为空' });
    }

    const result = db.prepare(
      `INSERT INTO skins (user_id, name, model_type, inner_data, outer_data, is_public)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      req.user.userId,
      name || '未命名皮肤',
      modelType || 'steve',
      innerData,
      outerData,
      isPublic ? 1 : 0
    );

    res.status(201).json({
      skin: {
        id: result.lastInsertRowid,
        name: name || '未命名皮肤',
        modelType: modelType || 'steve',
        isPublic: !!isPublic,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Create skin error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * PUT /api/skins/:id
 * 更新皮肤
 */
router.put('/:id', requireAuth, (req, res) => {
  try {
    // 检查所有权
    const existing = db.prepare(
      'SELECT id FROM skins WHERE id = ? AND user_id = ?'
    ).get(req.params.id, req.user.userId);

    if (!existing) {
      return res.status(404).json({ error: '皮肤不存在或无权修改' });
    }

    const { name, modelType, innerData, outerData, isPublic } = req.body;

    // 构建动态更新语句
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (modelType !== undefined) { updates.push('model_type = ?'); values.push(modelType); }
    if (innerData !== undefined) { updates.push('inner_data = ?'); values.push(innerData); }
    if (outerData !== undefined) { updates.push('outer_data = ?'); values.push(outerData); }
    if (isPublic !== undefined) { updates.push('is_public = ?'); values.push(isPublic ? 1 : 0); }

    if (updates.length === 0) {
      return res.status(400).json({ error: '没有需要更新的字段' });
    }

    updates.push("updated_at = datetime('now')");
    values.push(req.params.id);

    db.prepare(
      `UPDATE skins SET ${updates.join(', ')} WHERE id = ?`
    ).run(...values);

    res.json({ success: true });
  } catch (err) {
    console.error('Update skin error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * DELETE /api/skins/:id
 * 删除皮肤
 */
router.delete('/:id', requireAuth, (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM skins WHERE id = ? AND user_id = ?'
    ).run(req.params.id, req.user.userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: '皮肤不存在或无权删除' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete skin error:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

/**
 * GET /api/gallery
 * 公开皮肤画廊（无需认证）
 */
router.get('/gallery', optionalAuth, (req, res) => {
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

export default router;
