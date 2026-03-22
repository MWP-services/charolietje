import type { GoalType } from '@/types/profile';

export const formatCalories = (value: number | null) => (value === null ? 'Onbekend' : `${Math.round(value)} kcal`);

export const formatGrams = (value: number | null) => (value === null ? 'Onbekend' : `${Math.round(value)} g`);

export const formatMilligrams = (value: number | null) => (value === null ? 'Onbekend' : `${Math.round(value)} mg`);

export const formatNutrientValue = (label: string, value: number | null) => {
  if (label.toLowerCase() === 'sodium') {
    return formatMilligrams(value);
  }

  if (label.toLowerCase() === 'calories') {
    return formatCalories(value);
  }

  return formatGrams(value);
};

export const formatMealType = (mealType: string) => {
  switch (mealType) {
    case 'breakfast':
      return 'Ontbijt';
    case 'lunch':
      return 'Lunch';
    case 'dinner':
      return 'Avondeten';
    case 'snack':
      return 'Snack';
    default:
      return 'Onbekend';
  }
};

export const formatGoal = (goal: GoalType) => {
  switch (goal) {
    case 'lose_weight':
      return 'Afvallen';
    case 'build_muscle':
      return 'Spieren opbouwen';
    default:
      return 'Gewicht behouden';
  }
};

export const formatFoodName = (name: string) => {
  switch (name.toLowerCase()) {
    case 'bread':
      return 'Brood';
    case 'peanut butter':
      return 'Pindakaas';
    case 'semi-skimmed milk':
      return 'Halfvolle melk';
    case 'chicken sandwich':
      return 'Kipsandwich';
    case 'apple':
      return 'Appel';
    case 'banana':
      return 'Banaan';
    case 'rice':
      return 'Rijst';
    case 'salmon':
      return 'Zalm';
    case 'vegetables':
      return 'Groenten';
    case 'protein yogurt':
      return 'Proteineyoghurt';
    case 'oats':
      return 'Havermout';
    case 'egg':
      return 'Ei';
    case 'avocado':
      return 'Avocado';
    case 'pasta':
      return 'Pasta';
    case 'olive oil':
      return 'Olijfolie';
    case 'liverwurst':
      return 'Leverworst';
    case 'stroopwafel':
      return 'Stroopwafel';
    default:
      return name;
  }
};

export const formatUnit = (unit: string) => {
  switch (unit.toLowerCase()) {
    case 'slice':
    case 'slices':
      return 'sneetjes';
    case 'piece':
      return 'stuk';
    case 'gram':
      return 'gram';
    case 'ml':
      return 'ml';
    case 'serving':
      return 'portie';
    default:
      return unit;
  }
};
