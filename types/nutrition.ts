export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
};

export type NutritionReference = Nutrients & {
  name: string;
  baseQuantity: number;
  baseUnit: string;
};
