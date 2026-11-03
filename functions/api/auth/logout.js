import { json, sessionCookie } from '../_lib.js';

export const onRequestPost = async () => json({ ok: true }, 200, { 'set-cookie': sessionCookie(null) });
