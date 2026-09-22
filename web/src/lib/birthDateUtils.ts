/**
 * Utilidades para cálculo de edad, validación y felicitaciones de cumpleaños
 */

export function calculateAgeFromBirthDate(birthDateStr?: string | null): number {
  if (!birthDateStr) return 28;
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return 28;
  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const birthDay = parseInt(parts[2], 10);

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return 28;

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const monthDiff = today.getMonth() - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return Math.max(10, Math.min(100, age));
}

export function isBirthdayToday(birthDateStr?: string | null): boolean {
  if (!birthDateStr) return false;
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return false;
  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);

  if (isNaN(birthMonth) || isNaN(birthDay)) return false;

  const today = new Date();
  return today.getMonth() + 1 === birthMonth && today.getDate() === birthDay;
}

export function formatBirthDateFull(birthDateStr?: string | null, lang: 'es' | 'en' = 'es'): string {
  if (!birthDateStr) return '';
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return birthDateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (monthIdx < 0 || monthIdx > 11) return birthDateStr;

  const monthName = lang === 'en' ? monthNamesEn[monthIdx] : monthNamesEs[monthIdx];
  return lang === 'en' ? `${monthName} ${day}, ${year}` : `${day} de ${monthName} de ${year}`;
}

export function formatBirthDateShort(birthDateStr?: string | null, lang: 'es' | 'en' = 'es'): string {
  if (!birthDateStr) return '';
  const parts = birthDateStr.split('-');
  if (parts.length !== 3) return birthDateStr;
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthNamesEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const monthNamesEn = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  if (monthIdx < 0 || monthIdx > 11) return birthDateStr;

  const monthName = lang === 'en' ? monthNamesEn[monthIdx] : monthNamesEs[monthIdx];
  return lang === 'en' ? `${monthName} ${day}` : `${day} de ${monthName}`;
}

export function buildBirthDateString(day: string, month: string, year: string): string | null {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  if (y < 1920 || y > new Date().getFullYear() - 10) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${y}-${pad(m)}-${pad(d)}`;
}
