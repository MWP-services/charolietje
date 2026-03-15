import type { GoalType } from '@/types/profile';

export const goalOptions: {
  value: GoalType;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: 'lose_weight',
    label: 'Afvallen',
    shortLabel: 'Vetverlies',
    description: 'Focus op verzadiging, eiwitten, vezels en slimmere caloriedichtheid.',
  },
  {
    value: 'maintain',
    label: 'Gewicht behouden',
    shortLabel: 'Behoud',
    description: 'Werk aan regelmaat, uitgebalanceerde maaltijden en stabiele dagelijkse gewoontes.',
  },
  {
    value: 'build_muscle',
    label: 'Spieren opbouwen',
    shortLabel: 'Spiergroei',
    description: 'Geef prioriteit aan eiwitverdeling, voldoende calorieen en herstel.',
  },
];

export const mealTypeOptions = [
  { value: 'breakfast', label: 'Ontbijt' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Avondeten' },
  { value: 'snack', label: 'Snack' },
  { value: 'unknown', label: 'Onbekend' },
] as const;
