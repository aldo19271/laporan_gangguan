import sql from './_lib/db.js';
import { getSession } from './_lib/auth.js';

export default async function handler(req, res) {
  const s = getSession(req);
  if (!s) return res.status(401).json({ error: 'Tidak login' });
  try {
    if (req.method === 'GET') {
      const { id, all } = req.query;
      if (id) {
        const [r] = await sql`SELECT * FROM reports WHERE id = ${id}`;
        if (!r) return res.status(404).json({ error: 'Tidak ditemukan' });
        if (s.role !== 'ADMIN' && r.user_id !== s.id) return res.status(403).json({ error: 'Akses ditolak' });
        return res.json(r);
      }
      const rows = (s.role === 'ADMIN' && all)
        ? await sql`SELECT * FROM reports ORDER BY created_at DESC`
        : await sql`SELECT * FROM reports WHERE user_id = ${s.id} ORDER BY created_at DESC`;
      return res.json(rows);
    }
    if (req.method === 'POST') {
      const { reporterName, location, description } = req.body || {};
      if (!reporterName || !location || !description) return res.status(400).json({ error: 'Lengkapi data' });
      const [r] = await sql`
        INSERT INTO reports (user_id, reporter_name, location, description)
        VALUES (${s.id}, ${reporterName}, ${location}, ${description}) RETURNING *`;
      return res.json(r);
    }
    if (req.method === 'PATCH') {
      if (s.role !== 'ADMIN') return res.status(403).json({ error: 'Akses ditolak' });
      const { id, status } = req.body || {};
      await sql`UPDATE reports SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
      return res.json({ ok: true });
    }
    // FITUR BARU: Hapus Laporan
    if (req.method === 'DELETE') {
      const { id } = req.query;
      const [r] = await sql`SELECT user_id FROM reports WHERE id = ${id}`;
      if (!r) return res.status(404).json({ error: 'Tidak ditemukan' });
      if (s.role !== 'ADMIN' && r.user_id !== s.id) return res.status(403).json({ error: 'Akses ditolak' });
      await sql`DELETE FROM reports WHERE id = ${id}`;
      return res.json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
}