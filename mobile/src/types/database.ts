export type UserRole = 'admin' | 'client';
export type WeightUnit = 'kg' | 'lbs';
export type SessionStatus = 'completed' | 'partial' | 'missed';
export type StandardMuscleGroup =
  | 'Pecho'
  | 'Espalda'
  | 'Cuádriceps'
  | 'Glúteos'
  | 'Isquiosurales'
  | 'Hombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Core'
  | 'Pantorrillas'
  | 'Cuerpo Completo';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  weight_unit_preference: WeightUnit;
  birth_date?: string | null;
  is_active?: boolean;
  client_code?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  description: string | null;
  video_url: string | null;
  gif_url: string | null;
  image_urls: string[];
  created_by?: string | null;
  is_custom?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Routine {
  id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  is_active: boolean;
  is_template: boolean;
  created_at: string;
  updated_at?: string;
}

export interface RoutineDay {
  id: string;
  routine_id: string;
  day_number: number;
  name: string;
  order_index: number;
  muscle_group?: StandardMuscleGroup | string | null;
  completion_count?: number;
  last_completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  routine_exercises?: RoutineExercise[];
}

export interface RoutineExercise {
  id: string;
  routine_day_id: string;
  exercise_id: string;
  order_index: number;
  notes: string | null;
  exercise?: Exercise;
  routine_exercise_sets?: RoutineExerciseSet[];
}

export interface RoutineExerciseSet {
  id: string;
  routine_exercise_id: string;
  set_number: number;
  target_reps: number;
  target_weight_kg: number | null;
  target_rpe: number | null;
  rest_seconds: number;
}

export interface WorkoutSession {
  id: string;
  client_id: string;
  routine_day_id: string | null;
  muscle_group?: StandardMuscleGroup | string | null;
  scheduled_date: string;
  completed_at: string | null;
  status: SessionStatus;
  duration_minutes: number;
  completion_rate: number;
  notes: string | null;
  created_at: string;
  workout_log_sets?: WorkoutLogSet[];
}

export interface WorkoutLogSet {
  id: string;
  session_id: string;
  routine_exercise_set_id: string | null;
  set_number: number;
  reps_completed: number;
  weight_logged: number;
  unit_logged: WeightUnit;
  weight_kg: number;
  is_completed: boolean;
  rpe: number | null;
  created_at: string;
}

export interface NutritionMacros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export interface NutritionPlan {
  id: string;
  client_id: string;
  title: string;
  pdf_url: string | null;
  macros_json: NutritionMacros;
  active: boolean;
  notes: string | null;
  created_at: string;
}

export interface ClientMetric {
  id: string;
  client_id: string;
  date: string;
  weight_logged: number;
  unit_logged: WeightUnit;
  weight_kg: number;
  body_fat: number | null;
  photos_urls: string[];
  notes: string | null;
  created_at: string;
}

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type CardioType = 'treadmill' | 'stairmaster' | 'elliptical' | 'bike';

export interface UserBiometrics {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  unitPreference: WeightUnit;
}

export interface CardioActivityItem {
  id: string;
  type: CardioType;
  title: string;
  durationMinutes: number;
  inclineDegrees?: number;
  speedKmH?: number;
  resistanceLevel?: number;
  caloriesBurned: number;
  completed: boolean;
  createdAt: string;
}

