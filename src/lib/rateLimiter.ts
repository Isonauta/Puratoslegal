// Rate limiter en memoria para el endpoint de login.
// Bloquea una IP tras MAX_ATTEMPTS intentos fallidos en WINDOW_MS milisegundos.
// En Vercel cada instancia tiene su propio Map, pero con el volumen de Puratos
// (pocos usuarios, misma región) esto es suficiente y no requiere Redis.

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

interface Entry {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const store = new Map<string, Entry>();

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSecs?: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (entry?.blockedUntil) {
    if (now < entry.blockedUntil) {
      return { allowed: false, retryAfterSecs: Math.ceil((entry.blockedUntil - now) / 1000) };
    }
    // Bloqueo expirado — resetear
    store.delete(ip);
  }

  if (!entry || now - entry.firstAttempt > WINDOW_MS) {
    store.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  entry.count++;

  if (entry.count > MAX_ATTEMPTS) {
    entry.blockedUntil = now + WINDOW_MS;
    return { allowed: false, retryAfterSecs: Math.ceil(WINDOW_MS / 1000) };
  }

  return { allowed: true };
}

export function resetRateLimit(ip: string) {
  store.delete(ip);
}
