import bcrypt from 'bcryptjs';
import sql from './_lib/db.js';
import { signToken, setAuthCookie, clearAuthCookie, getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  const a = req.query.action;
  try {
    if (a === 'me' && req.method === 'GET') {
      const s = getSession(req);
      if (!s) return res.status(401).json({ error: 'Tidak login' });
      return res.json({ user: s });
    }
    if (a === 'login' && req.method === 'POST') {
      const { username, password } = req.body || {};
      const [u] = await sql`SELECT * FROM users WHERE username = ${username}`;
      if (!u || !(await bcrypt.compare(password, u.password)))
        return res.status(401).json({ error: 'Username atau password salah' });
      setAuthCookie(res, signToken(u));
      return res.json({ user: { id: u.id, username: u.username, email: u.email, role: u.role } });
    }
    if (a === 'register' && req.method === 'POST') {
      const { email, username, password } = req.body || {};
      if (!email || !username || !password) return res.status(400).json({ error: 'Lengkapi data' });
      const dup = await sql`SELECT id FROM users WHERE email = ${email} OR username = ${username} LIMIT 1`;
      if (dup.length) return res.status(409).json({ error: 'Email atau username sudah dipakai' });
      const hash = await bcrypt.hash(password, 10);
      await sql`INSERT INTO users (email, username, password) VALUES (${email}, ${username}, ${hash})`;
      return res.json({ ok: true });
    }
    if (a === 'logout' && req.method === 'POST') {
      clearAuthCookie(res);
      return res.json({ ok: true });
    }
    res.status(404).json({ error: 'Not found' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}