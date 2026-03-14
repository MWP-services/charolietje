import type { GoalType } from '@/types/profile';

export const goalOptions: {
  value: GoalType;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: 'lose_weight',
    label: 'Lose weight',
    shortLabel: 'Fat loss',
    description: 'Focus on satiety, protein, fiber, and smarter calorie density.',
  },
  {
    value: 'maintain',
    label: 'Maintain weight',
    shortLabel: 'Maintain',
    description: 'Build consistency, balanced meals, and steady daily habits.',
  },
  {
    value: 'build_muscle',
    label: 'Build muscle',
    shortLabel: 'Muscle gain',
    description: 'Prioritize protein timing, calorie sufficiency, and recovery.',
  },
];

export const mealTypeOptions = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'unknown', label: 'Unknown' },
] as const;
