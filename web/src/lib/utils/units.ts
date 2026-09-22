import { WeightUnit } from '@/types/database';

export const LBS_PER_KG = 2.20462262;
export const KG_PER_LB = 0.45359237;

/**
 * Convierte un peso almacenado en KG a la unidad de visualización (KG o LBS).
 */
export function toDisplayWeight(weightKg: number, targetUnit: WeightUnit): number {
  if (targetUnit === 'lbs') {
    return Math.round(weightKg * LBS_PER_KG * 100) / 100;
  }
  return Math.round(weightKg * 100) / 100;
}

/**
 * Convierte un peso ingresado por el usuario en cualquier unidad a KG estándar.
 */
export function toStandardKg(weight: number, currentUnit: WeightUnit): number {
  if (currentUnit === 'lbs') {
    return Math.round(weight * KG_PER_LB * 100) / 100;
  }
  return Math.round(weight * 100) / 100;
}

/**
 * Formatea un valor en KG a cadena legible con sufijo de unidad.
 */
export function formatWeight(
  weightKg: number | null | undefined,
  targetUnit: WeightUnit = 'kg',
  decimals = 1
): string {
  if (weightKg === null || weightKg === undefined) return `- ${targetUnit}`;
  const converted = toDisplayWeight(weightKg, targetUnit);
  return `${converted.toFixed(decimals)} ${targetUnit}`;
}
