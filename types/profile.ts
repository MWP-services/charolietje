export type GoalType = 'lose_weight' | 'maintain' | 'build_muscle';

export type UserProfile = {
  id: string;
  full_name: string;
  email?: string;
  goal: GoalType;
  calorie_target: number | null;
  protein_target: number | null;
  is_premium: boolean;
  age?: number | null;
  weight_kg?: number | null;
  height_cm?: number | null;
  has_completed_onboarding?: boolean;
  created_at: string;
  updated_at: string;
};
