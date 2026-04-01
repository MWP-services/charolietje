export type GoalType = 'lose_weight' | 'maintain' | 'build_muscle';
export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

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
  has_received_demo?: boolean;
  notifications_enabled?: boolean;
  meal_reminders_enabled?: boolean;
  consistency_reminders_enabled?: boolean;
  progress_nudges_enabled?: boolean;
  notification_permission_status?: NotificationPermissionStatus | null;
  created_at: string;
  updated_at: string;
};
