/**
 * hash.js - 密码哈希工具（bcrypt）
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 对密码进行哈希
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @param {string} hash - 数据库中存储的哈希
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
