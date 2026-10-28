import bcrypt from 'bcryptjs';
import sql from './_lib/db.js';
import { getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  const s = getSession(req);
  if (!s || s.role !== 'ADMIN') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    // FITUR BARU: Ambil list semua user biasa (bukan admin)
    if (req.method === 'GET') {
      const users = await sql`SELECT id, email, username, created_at FROM users WHERE role = 'USER' ORDER BY created_at DESC`;
      return res.json(users);
    }
    if (req.method === 'POST') {
      const { email, username, password } = req.body || {};
      if (!email || !username || !password) return res.status(400).json({ error: 'Lengkapi data' });
      const dup = await sql`SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1`;
      if (dup.length) return res.status(409).json({ error: 'Email atau username sudah dipakai' });
      const hash = await bcrypt.hash(password, 10);
      await sql`INSERT INTO users (email, username, password, role) VALUES (${email}, ${username}, ${hash}, 'ADMIN')`;
      return res.json({ ok: true });
    }
    // FITUR BARU: Hapus User (Hanya bisa hapus role USER, admin tidak bisa dihapus)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM users WHERE id = ${id} AND role = 'USER'`;
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}