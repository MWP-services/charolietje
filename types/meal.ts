import type { Nutrients, OptionalNutrients } from '@/types/nutrition';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'unknown';
export type MealNutritionSource = 'matched' | 'manual' | 'unresolved' | 'estimated';
export type ClarificationType = 'meal_size' | 'portion_size' | 'quantity' | 'preparation_method' | 'hidden_calories' | 'source_context';
export type ClarificationSelectionMode = 'single' | 'multiple';
export type MealPreparationMethod = 'grilled' | 'pan_fried' | 'sauce' | 'fried' | 'oven_baked' | 'boiled' | 'raw';
export type HiddenCalorieKey = 'oil' | 'butter' | 'sauce' | 'dressing' | 'cheese' | 'not_sure';
export type MealSourceContext = 'home_made' | 'restaurant' | 'takeaway';
export type MealSizeKey = 'small' | 'normal' | 'large';

export type ClarificationOption = {
  id: string;
  label: string;
  description?: string;
  grams?: number;
  quantity?: number;
  unit?: string;
  prep?: MealPreparationMethod;
  hiddenCalorie?: HiddenCalorieKey;
  sourceContext?: MealSourceContext;
  multiplier?: number;
  mealSizeKey?: MealSizeKey;
};

export type MealClarificationQuestion = {
  id: string;
  itemIndex: number;
  itemName: string;
  type: ClarificationType;
  question: string;
  selectionMode: ClarificationSelectionMode;
  options: ClarificationOption[];
  priority: number;
  skippable: boolean;
  rationale?: string;
  answered?: boolean;
  skipped?: boolean;
};

export type ClarificationAnswer = {
  questionId: string;
  itemIndex: number;
  itemName: string;
  type: ClarificationType;
  selectedOptionIds: string[];
  selectedLabels: string[];
  appliedGrams?: number | null;
  appliedQuantity?: number | null;
  appliedUnit?: string | null;
  preparationMethod?: MealPreparationMethod | null;
  hiddenCalories?: HiddenCalorieKey[];
  sourceContext?: MealSourceContext | null;
  mealSizeKey?: MealSizeKey | null;
  mealSizeMultiplier?: number | null;
  skipped?: boolean;
  answeredAt: string;
};

export type Meal = {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  original_text: string;
  transcription_text: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  total_sodium: number;
  created_at: string;
  updated_at: string;
};

export type MealItemMetadata = {
  estimatedGrams?: number | null;
  confidence?: number | null;
  confidenceFood?: number | null;
  confidenceAmount?: number | null;
  needsClarification?: boolean;
  clarificationType?: ClarificationType | null;
  clarificationQuestion?: string | null;
  clarificationOptions?: ClarificationOption[];
  possiblePreparationMethods?: MealPreparationMethod[];
  possibleHiddenCalories?: HiddenCalorieKey[];
  selectedPreparationMethod?: MealPreparationMethod | null;
  selectedHiddenCalories?: HiddenCalorieKey[];
  sourceContext?: MealSourceContext | null;
  selectedMealSize?: MealSizeKey | null;
  derivedFromClarification?: boolean;
  parentItemName?: string | null;
  templateKey?: string | null;
  searchAliases?: string[];
};

export type MealItem = {
  id: string;
  meal_id: string;
  name: string;
  quantity: number;
  unit: string;
  nutritionSource?: MealNutritionSource;
} & MealItemMetadata &
  OptionalNutrients;

export type MealWithItems = Meal & {
  items: MealItem[];
};

export type DailyTotals = Nutrients & {
  date: string;
};

export type ParsedMealItem = {
  name: string;
  quantity: number;
  unit: string;
} & MealItemMetadata;

export type ParsedMeal = {
  mealType: MealType;
  items: ParsedMealItem[];
  originalText: string;
  overallConfidence: number;
  needsClarification: boolean;
  clarificationPriority: ClarificationType[];
  clarifications: MealClarificationQuestion[];
  templateKey?: string | null;
};

export type AnalyzedMealItem = ParsedMealItem &
  OptionalNutrients & {
    nutritionSource?: MealNutritionSource;
  };

export type AnalyzedMeal = {
  mealType: MealType;
  originalText: string;
  items: AnalyzedMealItem[];
  totals: Nutrients;
  overallConfidence: number;
  needsClarification: boolean;
  clarificationPriority: ClarificationType[];
  clarifications: MealClarificationQuestion[];
  clarificationAnswers: ClarificationAnswer[];
  initialParsedMeal: ParsedMeal;
  templateKey?: string | null;
};

export type MealCorrectionSignalRecord = {
  id: string;
  user_id: string;
  meal_id?: string | null;
  original_transcript: string;
  parsed_estimate: ParsedMeal;
  clarification_answers: ClarificationAnswer[];
  final_items: Array<{
    name: string;
    quantity: number;
    unit: string;
    estimatedGrams?: number | null;
    selectedPreparationMethod?: MealPreparationMethod | null;
    selectedHiddenCalories?: HiddenCalorieKey[];
    sourceContext?: MealSourceContext | null;
  }>;
  template_key?: string | null;
  created_at: string;
  updated_at: string;
};

export type MealPersonalizationHint = {
  itemName: string;
  averageQuantity: number;
  unit: string;
  averageEstimatedGrams?: number | null;
  preferredPreparationMethod?: MealPreparationMethod | null;
  commonHiddenCalories?: HiddenCalorieKey[];
  preferredSourceContext?: MealSourceContext | null;
  sampleSize: number;
};

export type MealPersonalizationProfile = {
  templateKey?: string | null;
  hints: MealPersonalizationHint[];
  preferredMealSize?: MealSizeKey | null;
  preferredMealSizeMultiplier?: number | null;
  mealSizeSampleSize?: number;
};

export type DayHistoryEntry = {
  date: string;
  totals: DailyTotals;
  meals: MealWithItems[];
};
