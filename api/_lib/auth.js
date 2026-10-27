import jwt from 'jsonwebtoken';
import cookie from 'cookie';
const SECRET = process.env.JWT_SECRET;

export const signToken = (u) =>
  jwt.sign({ id: u.id, username: u.username, email: u.email, role: u.role }, SECRET, { expiresIn: '7d' });

export function getSession(req) {
  try {
    const c = cookie.parse(req.headers.cookie || '');
    return c.token ? jwt.verify(c.token, SECRET) : null;
  } catch { return null; }
}

export function setAuthCookie(res, token) {
  res.setHeader('Set-Cookie', cookie.serialize('token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7,
  }));
}

export function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', cookie.serialize('token', '', { httpOnly: true, path: '/', maxAge: 0 }));
}