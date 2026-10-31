import { Router, Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { cfg } from './config';
import { pool } from './db';

const google = new OAuth2Client(cfg.google.id, cfg.google.secret, `${cfg.backendUrl}/auth/google/callback`);
export interface AuthedRequest extends Request { userId?: string }

export const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  try { req.userId = (jwt.verify(req.cookies.session, cfg.jwtSecret) as any).uid; next(); }
  catch { res.status(401).json({ error: 'Not signed in' }); }
};

export const authRouter = Router();
authRouter.get('/google', (_req, res) =>
  res.redirect(google.generateAuthUrl({ scope: ['openid', 'email', 'profile'], prompt: 'select_account' })));

authRouter.get('/google/callback', async (req, res) => {
  try {
    const { tokens } = await google.getToken(String(req.query.code));
    const ticket = await google.verifyIdToken({ idToken: tokens.id_token!, audience: cfg.google.id });
    const p = ticket.getPayload()!;
    await pool.query(
      `INSERT INTO users(id,email,name,avatar) VALUES($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET name=$3, avatar=$4`, [p.sub, p.email, p.name, p.picture]);
    res.cookie('session', jwt.sign({ uid: p.sub }, cfg.jwtSecret, { expiresIn: '7d' }), { httpOnly: true, sameSite: 'lax', maxAge: 7 * 864e5 });
    res.redirect(`${cfg.frontendUrl}/dashboard`);
  } catch (e) { res.redirect(`${cfg.frontendUrl}/?error=login_failed`); }
});
authRouter.post('/logout', (_req, res) => { res.clearCookie('session'); res.json({ ok: true }); });
