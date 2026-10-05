// Rate limiter en memoria, en namespaces separados por uso (login, near-miss, etc.).
// En Vercel cada instancia tiene su propio Map, pero con el volumen de Puratos
// (pocos usuarios, misma región) esto es suficiente y no requiere Redis.

interface Entry {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}

const stores = new Map<string, Map<string, Entry>>();

function getStore(namespace: string): Map<string, Entry> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return store;
}

function check(
  namespace: string,
  ip: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSecs?: number } {
  const store = getStore(namespace);
  const now = Date.now();
  const entry = store.get(ip);

  if (entry?.blockedUntil) {
    if (now < entry.blockedUntil) {
      return { allowed: false, retryAfterSecs: Math.ceil((entry.blockedUntil - now) / 1000) };
    }
    store.delete(ip);
  }

  if (!entry || now - entry.firstAttempt > windowMs) {
    store.set(ip, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  entry.count++;

  if (entry.count > maxAttempts) {
    entry.blockedUntil = now + windowMs;
    return { allowed: false, retryAfterSecs: Math.ceil(windowMs / 1000) };
  }

  return { allowed: true };
}

// Login: 5 intentos / 15 min.
export function checkRateLimit(ip: string): { allowed: boolean; retryAfterSecs?: number } {
  return check("login", ip, 5, 15 * 60 * 1000);
}

export function resetRateLimit(ip: string) {
  getStore("login").delete(ip);
}

// Near Miss público (QR, sin sesión): más laxo — un turno completo puede
// reportar varias veces desde la misma IP/NAT de planta.
export function checkNearMissRateLimit(ip: string): { allowed: boolean; retryAfterSecs?: number } {
  return check("near-miss", ip, 20, 60 * 60 * 1000);
}
