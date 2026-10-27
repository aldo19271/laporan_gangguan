import sql from './_lib/db.js';
import { getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { reportId, content, guestUsername, type } = req.body || {};

      if (type === 'forgot') {
        if (!guestUsername || !content) return res.status(400).json({ error: 'Lengkapi data' });
        const [admin] = await sql`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1`;
        if (!admin) return res.status(500).json({ error: 'Admin tidak ditemukan' });
        const [u] = await sql`SELECT id FROM users WHERE username = ${guestUsername}`;
        await sql`INSERT INTO messages (sender_id, receiver_id, content)
          VALUES (${u?.id || admin.id}, ${admin.id}, ${'[LUPA] ' + guestUsername + ': ' + content})`;
        return res.json({ ok: true });
      }

      const s = getSession(req);
      if (!s) return res.status(401).json({ error: 'Tidak login' });
      if (!reportId || !content) return res.status(400).json({ error: 'Lengkapi data' });
      const [r] = await sql`SELECT user_id FROM reports WHERE id = ${reportId}`;
      if (!r) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
      const receiver = s.role === 'ADMIN'
        ? r.user_id
        : (await sql`SELECT id FROM users WHERE role='ADMIN' LIMIT 1`)[0].id;
      await sql`INSERT INTO messages (sender_id, receiver_id, report_id, content)
        VALUES (${s.id}, ${receiver}, ${reportId}, ${content})`;
      return res.json({ ok: true });
    }

    if (req.method === 'GET') {
      const s = getSession(req);
      if (!s) return res.status(401).json({ error: 'Tidak login' });
      const { reportId, inbox } = req.query;
      if (inbox === 'forgot') {
        if (s.role !== 'ADMIN') return res.status(403).json({ error: 'Akses ditolak' });
        const rows = await sql`
          SELECT m.*, u.username AS sender_username FROM messages m
          LEFT JOIN users u ON u.id = m.sender_id
          WHERE m.report_id IS NULL ORDER BY m.created_at DESC`;
        return res.json(rows);
      }
      if (!reportId) return res.status(400).json({ error: 'reportId required' });
      const rows = await sql`SELECT * FROM messages WHERE report_id = ${reportId} ORDER BY created_at ASC`;
      return res.json(rows);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}