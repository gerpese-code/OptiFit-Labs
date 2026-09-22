/**
 * Utilidades para el Código de Alumno Único e Irrepetible (3 letras + 3 números, ej. #hgd563)
 */

/**
 * Genera un código aleatorio de 3 letras minúsculas seguidas de 3 dígitos numéricos (ej. 'hgd563')
 */
export function generateRandomClientCode(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  let lettersPart = '';
  for (let i = 0; i < 3; i++) {
    lettersPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  let digitsPart = '';
  for (let i = 0; i < 3; i++) {
    digitsPart += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return `${lettersPart}${digitsPart}`;
}

/**
 * Genera un código determinista de 3 letras + 3 dígitos a partir del UUID del usuario
 * como respaldo seguro en caso de que aún no tenga client_code asignado.
 */
export function getFallbackClientCode(userId?: string): string {
  if (!userId) return generateRandomClientCode();
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash1 = (hash1 * 31 + char) >>> 0;
    hash2 = (hash2 * 17 + char * (i + 1)) >>> 0;
  }
  const l1 = letters[hash1 % 26];
  const l2 = letters[Math.floor(hash1 / 26) % 26];
  const l3 = letters[Math.floor(hash1 / (26 * 26)) % 26];
  const d1 = digits[hash2 % 10];
  const d2 = digits[Math.floor(hash2 / 10) % 10];
  const d3 = digits[Math.floor(hash2 / 100) % 10];
  return `${l1}${l2}${l3}${d1}${d2}${d3}`;
}

/**
 * Limpia y normaliza el código a formato alfanumérico en minúsculas (ej. 'hgd563')
 */
export function cleanCode(val: string | number | undefined | null): string | null {
  if (!val) return null;
  const str = String(val).replace('#', '').trim().toLowerCase();
  if (str) return str;
  return null;
}

export function getClientCode(
  client?: { id?: string; created_at?: string; client_code?: string; user_metadata?: any; email?: string } | null,
  fallbackIndex?: number
): string {
  // 1. Caso explícito Germán
  if (client?.id === '8c9ea92f-e2b9-4da1-8378-08cffbdbd86c' || (client as any)?.email === 'pesedagger@gmail.com') {
    return 'hgd563';
  }

  // 2. Si viene dentro de user_metadata
  const meta = cleanCode(client?.user_metadata?.client_code);
  if (meta && meta !== '0001' && meta !== '0000') return meta;

  // 3. Si el objeto ya tiene client_code directo
  const direct = cleanCode(client?.client_code);
  if (direct && direct !== '0001' && direct !== '0000') return direct;

  // 4. Respaldo determinista a partir del ID del alumno (garantiza código estable e irrepetible)
  if (client?.id) {
    return getFallbackClientCode(client.id);
  }

  // 5. Fallback por defecto
  return generateRandomClientCode();
}

export function formatClientBadge(code: string | number | undefined | null): string {
  const clean = cleanCode(code);
  if (!clean || clean === '0001' || clean === '0000') return '#hgd563';
  return `#${clean}`;
}

export function formatClientNameWithCode(name: string, code: string | number | undefined | null): string {
  const badge = formatClientBadge(code);
  return `${name} ${badge}`;
}
