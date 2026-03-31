import type { ClarificationType, HiddenCalorieKey, MealPreparationMethod, MealSizeKey } from '@/types/meal';

export type MealTemplateItemConfig = {
  key: string;
  name: string;
  aliases: string[];
  defaultQuantity: number;
  unit: string;
  estimatedGrams: number;
  clarificationTypes: ClarificationType[];
  portionPresets?: Array<{ id: string; label: string; grams: number }>;
  quantityPresets?: Array<{ id: string; label: string; quantity: number; unit: string }>;
  possiblePreparationMethods?: MealPreparationMethod[];
  possibleHiddenCalories?: HiddenCalorieKey[];
};

export type MealTemplate = {
  key: string;
  label: string;
  transcriptPatterns: RegExp[];
  clarificationTypes: ClarificationType[];
  likelyHiddenCalories: HiddenCalorieKey[];
  mealSizePresets?: Array<{ id: MealSizeKey; label: string; multiplier: number }>;
  items: MealTemplateItemConfig[];
};

export const mealTemplates: MealTemplate[] = [
  {
    key: 'rice_chicken_vegetables',
    label: 'Rijst, kip en groente',
    transcriptPatterns: [/rijst.*kip.*groent/i, /rice.*chicken.*vegetable/i],
    clarificationTypes: ['meal_size', 'preparation_method', 'hidden_calories'],
    likelyHiddenCalories: ['oil', 'sauce'],
    mealSizePresets: [
      { id: 'small', label: 'Klein bord', multiplier: 0.82 },
      { id: 'normal', label: 'Normaal bord', multiplier: 1 },
      { id: 'large', label: 'Groot bord', multiplier: 1.22 },
    ],
    items: [
      {
        key: 'rice',
        name: 'rice',
        aliases: ['rice', 'rijst', 'brown rice', 'zilvervliesrijst'],
        defaultQuantity: 175,
        unit: 'gram',
        estimatedGrams: 175,
        clarificationTypes: ['portion_size'],
        portionPresets: [
          { id: 'small', label: 'Klein', grams: 100 },
          { id: 'normal', label: 'Normaal', grams: 175 },
          { id: 'large', label: 'Groot', grams: 250 },
        ],
      },
      {
        key: 'chicken',
        name: 'chicken breast',
        aliases: ['chicken breast', 'kip', 'kipfilet'],
        defaultQuantity: 160,
        unit: 'gram',
        estimatedGrams: 160,
        clarificationTypes: ['preparation_method'],
        possiblePreparationMethods: ['grilled', 'pan_fried', 'sauce', 'fried', 'oven_baked'],
        possibleHiddenCalories: ['oil', 'sauce'],
      },
      {
        key: 'vegetables',
        name: 'vegetables',
        aliases: ['vegetables', 'groente', 'groenten', 'broccoli', 'spinach'],
        defaultQuantity: 150,
        unit: 'gram',
        estimatedGrams: 150,
        clarificationTypes: [],
        portionPresets: [
          { id: 'small', label: 'Klein', grams: 100 },
          { id: 'normal', label: 'Normaal', grams: 150 },
          { id: 'large', label: 'Groot', grams: 220 },
        ],
      },
    ],
  },
  {
    key: 'pasta_pesto',
    label: 'Pasta pesto',
    transcriptPatterns: [/pasta.*pesto/i, /spaghetti.*pesto/i],
    clarificationTypes: ['meal_size', 'hidden_calories'],
    likelyHiddenCalories: ['sauce', 'cheese'],
    mealSizePresets: [
      { id: 'small', label: 'Klein bord', multiplier: 0.8 },
      { id: 'normal', label: 'Normaal bord', multiplier: 1 },
      { id: 'large', label: 'Groot bord', multiplier: 1.25 },
    ],
    items: [
      {
        key: 'pasta',
        name: 'pasta',
        aliases: ['pasta', 'spaghetti', 'penne', 'macaroni'],
        defaultQuantity: 220,
        unit: 'gram',
        estimatedGrams: 220,
        clarificationTypes: ['portion_size'],
        portionPresets: [
          { id: 'small', label: 'Klein', grams: 160 },
          { id: 'normal', label: 'Normaal', grams: 220 },
          { id: 'large', label: 'Groot', grams: 300 },
        ],
      },
      {
        key: 'pesto',
        name: 'pesto',
        aliases: ['pesto'],
        defaultQuantity: 35,
        unit: 'gram',
        estimatedGrams: 35,
        clarificationTypes: ['hidden_calories'],
        possibleHiddenCalories: ['cheese'],
      },
    ],
  },
  {
    key: 'pasta_bolognese',
    label: 'Pasta bolognese',
    transcriptPatterns: [/pasta.*bolognese/i, /spaghetti.*bolognese/i],
    clarificationTypes: ['meal_size', 'hidden_calories'],
    likelyHiddenCalories: ['sauce', 'cheese'],
    mealSizePresets: [
      { id: 'small', label: 'Klein bord', multiplier: 0.8 },
      { id: 'normal', label: 'Normaal bord', multiplier: 1 },
      { id: 'large', label: 'Groot bord', multiplier: 1.25 },
    ],
    items: [
      {
        key: 'pasta',
        name: 'pasta',
        aliases: ['pasta', 'spaghetti', 'penne', 'macaroni'],
        defaultQuantity: 220,
        unit: 'gram',
        estimatedGrams: 220,
        clarificationTypes: ['portion_size'],
        portionPresets: [
          { id: 'small', label: 'Klein', grams: 160 },
          { id: 'normal', label: 'Normaal', grams: 220 },
          { id: 'large', label: 'Groot', grams: 300 },
        ],
      },
      {
        key: 'sauce',
        name: 'pasta sauce',
        aliases: ['bolognese', 'saus', 'pastasaus'],
        defaultQuantity: 120,
        unit: 'gram',
        estimatedGrams: 120,
        clarificationTypes: ['hidden_calories'],
        possibleHiddenCalories: ['cheese'],
      },
      {
        key: 'meat',
        name: 'beef mince',
        aliases: ['gehakt', 'beef mince', 'rundergehakt'],
        defaultQuantity: 110,
        unit: 'gram',
        estimatedGrams: 110,
        clarificationTypes: [],
      },
    ],
  },
  {
    key: 'bread_toppings',
    label: 'Brood met beleg',
    transcriptPatterns: [/brood/i, /boterham/i, /sandwich/i],
    clarificationTypes: ['quantity', 'hidden_calories'],
    likelyHiddenCalories: ['butter', 'cheese'],
    items: [
      {
        key: 'bread',
        name: 'bread',
        aliases: ['bread', 'brood', 'boterham'],
        defaultQuantity: 2,
        unit: 'slice',
        estimatedGrams: 70,
        clarificationTypes: ['quantity'],
        quantityPresets: [
          { id: '2-slices', label: '2 sneetjes', quantity: 2, unit: 'slice' },
          { id: '3-slices', label: '3 sneetjes', quantity: 3, unit: 'slice' },
          { id: '4-slices', label: '4 sneetjes', quantity: 4, unit: 'slice' },
        ],
      },
    ],
  },
  {
    key: 'yogurt_toppings',
    label: 'Yoghurt of kwark met toppings',
    transcriptPatterns: [/yoghurt/i, /yogurt/i, /kwark/i, /quark/i],
    clarificationTypes: ['portion_size', 'hidden_calories'],
    likelyHiddenCalories: ['cheese'],
    items: [
      {
        key: 'base',
        name: 'yogurt',
        aliases: ['yogurt', 'yoghurt', 'kwark', 'quark', 'greek yogurt', 'protein yogurt'],
        defaultQuantity: 200,
        unit: 'gram',
        estimatedGrams: 200,
        clarificationTypes: ['portion_size'],
        portionPresets: [
          { id: 'small', label: 'Klein', grams: 150 },
          { id: 'normal', label: 'Normaal', grams: 200 },
          { id: 'large', label: 'Groot', grams: 300 },
        ],
      },
    ],
  },
  {
    key: 'salad',
    label: 'Salade',
    transcriptPatterns: [/salade/i, /salad/i],
    clarificationTypes: ['hidden_calories', 'source_context', 'portion_size'],
    likelyHiddenCalories: ['dressing', 'cheese'],
    items: [
      {
        key: 'salad',
        name: 'vegetables',
        aliases: ['salad', 'salade', 'lettuce', 'sla', 'vegetables'],
        defaultQuantity: 250,
        unit: 'gram',
        estimatedGrams: 250,
        clarificationTypes: ['hidden_calories', 'source_context'],
        possibleHiddenCalories: ['dressing', 'cheese'],
      },
    ],
  },
  {
    key: 'poke_bowl',
    label: 'Pokebowl',
    transcriptPatterns: [/pok[eé]\s?bowl/i, /poke bowl/i],
    clarificationTypes: ['meal_size', 'hidden_calories', 'source_context'],
    likelyHiddenCalories: ['sauce'],
    mealSizePresets: [
      { id: 'small', label: 'Kleine bowl', multiplier: 0.82 },
      { id: 'normal', label: 'Normale bowl', multiplier: 1 },
      { id: 'large', label: 'Grote bowl', multiplier: 1.22 },
    ],
    items: [
      {
        key: 'base',
        name: 'rice',
        aliases: ['rice', 'rijst'],
        defaultQuantity: 180,
        unit: 'gram',
        estimatedGrams: 180,
        clarificationTypes: ['portion_size'],
        portionPresets: [
          { id: 'small', label: 'Klein', grams: 130 },
          { id: 'normal', label: 'Normaal', grams: 180 },
          { id: 'large', label: 'Groot', grams: 260 },
        ],
      },
    ],
  },
  {
    key: 'chicken_wrap',
    label: 'Wrap kip',
    transcriptPatterns: [/wrap.*kip/i, /chicken wrap/i],
    clarificationTypes: ['quantity', 'hidden_calories', 'preparation_method'],
    likelyHiddenCalories: ['sauce', 'cheese'],
    items: [
      {
        key: 'wrap',
        name: 'wrap',
        aliases: ['wrap', 'tortilla'],
        defaultQuantity: 1,
        unit: 'piece',
        estimatedGrams: 70,
        clarificationTypes: ['quantity'],
        quantityPresets: [
          { id: '1-wrap', label: '1 wrap', quantity: 1, unit: 'piece' },
          { id: '2-wraps', label: '2 wraps', quantity: 2, unit: 'piece' },
        ],
      },
      {
        key: 'chicken',
        name: 'chicken breast',
        aliases: ['chicken breast', 'kip'],
        defaultQuantity: 130,
        unit: 'gram',
        estimatedGrams: 130,
        clarificationTypes: ['preparation_method'],
        possiblePreparationMethods: ['grilled', 'pan_fried', 'sauce', 'fried'],
        possibleHiddenCalories: ['sauce', 'cheese'],
      },
    ],
  },
  {
    key: 'nasi_bami',
    label: 'Nasi of bami',
    transcriptPatterns: [/nasi/i, /bami/i],
    clarificationTypes: ['meal_size', 'source_context', 'hidden_calories'],
    likelyHiddenCalories: ['oil', 'sauce'],
    mealSizePresets: [
      { id: 'small', label: 'Kleine portie', multiplier: 0.82 },
      { id: 'normal', label: 'Normale portie', multiplier: 1 },
      { id: 'large', label: 'Grote portie', multiplier: 1.24 },
    ],
    items: [
      {
        key: 'main',
        name: 'rice',
        aliases: ['nasi', 'bami', 'rice', 'rijst', 'noodles'],
        defaultQuantity: 250,
        unit: 'gram',
        estimatedGrams: 250,
        clarificationTypes: ['portion_size', 'source_context'],
        portionPresets: [
          { id: 'small', label: 'Klein', grams: 180 },
          { id: 'normal', label: 'Normaal', grams: 250 },
          { id: 'large', label: 'Groot', grams: 340 },
        ],
      },
    ],
  },
  {
    key: 'avg_meal',
    label: 'AVG maaltijd',
    transcriptPatterns: [/aardappel.*groent.*(kip|vlees|zalm)/i, /avg/i],
    clarificationTypes: ['meal_size', 'preparation_method'],
    likelyHiddenCalories: ['butter', 'oil'],
    mealSizePresets: [
      { id: 'small', label: 'Klein bord', multiplier: 0.84 },
      { id: 'normal', label: 'Normaal bord', multiplier: 1 },
      { id: 'large', label: 'Groot bord', multiplier: 1.2 },
    ],
    items: [
      {
        key: 'potatoes',
        name: 'potatoes',
        aliases: ['potatoes', 'aardappel', 'aardappelen'],
        defaultQuantity: 220,
        unit: 'gram',
        estimatedGrams: 220,
        clarificationTypes: ['portion_size'],
        portionPresets: [
          { id: 'small', label: 'Klein', grams: 160 },
          { id: 'normal', label: 'Normaal', grams: 220 },
          { id: 'large', label: 'Groot', grams: 300 },
        ],
      },
      {
        key: 'vegetables',
        name: 'vegetables',
        aliases: ['vegetables', 'groente', 'groenten'],
        defaultQuantity: 160,
        unit: 'gram',
        estimatedGrams: 160,
        clarificationTypes: [],
      },
    ],
  },
];
