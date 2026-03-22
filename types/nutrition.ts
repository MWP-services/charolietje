export type NutrientKey = 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar' | 'sodium';

export type Nutrients = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
};

export type OptionalNutrients = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
};

export type NutritionReference = Nutrients & {
  name: string;
  baseQuantity: number;
  baseUnit: string;
};

export type NutritionReferenceRecord = Nutrients & {
  name: string;
  id: string;
  user_id: string;
  normalized_name: string;
  base_quantity: number;
  base_unit: string;
  created_at: string;
  updated_at: string;
};
