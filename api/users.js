import bcrypt from 'bcryptjs';
import sql from './_lib/db.js';
import { getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  const s = getSession(req);
  if (!s || s.role !== 'ADMIN') return res.status(403).json({ error: 'Akses ditolak' });

  try {
    // Ambil SEMUA user (Admin & User biasa)
    if (req.method === 'GET') {
      const users = await sql`SELECT id, email, username, role, created_at FROM users ORDER BY created_at DESC`;
      return res.json(users);
    }
    
    // Buat Admin Baru
    if (req.method === 'POST') {
      const { email, username, password } = req.body || {};
      if (!email || !username || !password) return res.status(400).json({ error: 'Lengkapi data' });
      const dup = await sql`SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1`;
      if (dup.length) return res.status(409).json({ error: 'Email atau username sudah dipakai' });
      const hash = await bcrypt.hash(password, 10);
      await sql`INSERT INTO users (email, username, password, role) VALUES (${email}, ${username}, ${hash}, 'ADMIN')`;
      return res.json({ ok: true });
    }
    
    // Edit User / Admin
    if (req.method === 'PATCH') {
      const { id, email, username, password } = req.body || {};
      if (!id || !email || !username) return res.status(400).json({ error: 'Lengkapi data' });
      
      // Cek duplikat email/username, kecuali milik user itu sendiri
      const dup = await sql`SELECT id FROM users WHERE (email = ${email} OR username = ${username}) AND id != ${id} LIMIT 1`;
      if (dup.length) return res.status(409).json({ error: 'Email atau username sudah dipakai akun lain' });

      if (password && password.trim() !== '') {
        const hash = await bcrypt.hash(password, 10);
        await sql`UPDATE users SET email = ${email}, username = ${username}, password = ${hash} WHERE id = ${id}`;
      } else {
        await sql`UPDATE users SET email = ${email}, username = ${username} WHERE id = ${id}`;
      }
      return res.json({ ok: true });
    }
    
    // Hapus User (Hanya role USER yang bisa dihapus)
    if (req.method === 'DELETE') {
      const { id } = req.query;
      await sql`DELETE FROM users WHERE id = ${id} AND role = 'USER'`;
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}