import { WorkoutLogSet, WorkoutSession } from '@/types/database';

/**
 * Calcula el 1RM estimado (Repetición Máxima) utilizando la fórmula de Epley.
 * Para 1 repetición exacta, devuelve el mismo peso.
 * 1RM = peso * (1 + reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30.0) * 10) / 10;
}

/**
 * Calcula el tonelaje total de una lista de series (reps * peso).
 */
export function calculateTotalTonnage(sets: WorkoutLogSet[]): number {
  return sets
    .filter((s) => s.is_completed)
    .reduce((acc, current) => {
      return acc + (current.reps_completed * (current.weight_kg || 0));
    }, 0);
}

/**
 * Calcula la tasa de cumplimiento de un conjunto de sesiones.
 */
export function calculateComplianceRate(sessions: WorkoutSession[]): {
  total: number;
  completed: number;
  partial: number;
  missed: number;
  percentage: number;
} {
  const total = sessions.length;
  if (total === 0) {
    return { total: 0, completed: 0, partial: 0, missed: 0, percentage: 0 };
  }

  const completed = sessions.filter((s) => s.status === 'completed').length;
  const partial = sessions.filter((s) => s.status === 'partial').length;
  const missed = sessions.filter((s) => s.status === 'missed').length;

  const percentage = Math.round(((completed + partial * 0.5) / total) * 100);

  return { total, completed, partial, missed, percentage };
}
