import bcrypt from 'bcryptjs';
import sql from './_lib/db.js';
import { getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const s = getSession(req);
  if (!s || s.role !== 'ADMIN') return res.status(403).json({ error: 'Akses ditolak' });
  try {
    const { email, username, password } = req.body || {};
    if (!email || !username || !password) return res.status(400).json({ error: 'Lengkapi data' });
    const dup = await sql`SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1`;
    if (dup.length) return res.status(409).json({ error: 'Email atau username sudah dipakai' });
    const hash = await bcrypt.hash(password, 10);
    await sql`INSERT INTO users (email, username, password, role)
      VALUES (${email}, ${username}, ${hash}, 'ADMIN')`;
    return res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}