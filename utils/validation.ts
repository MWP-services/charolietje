import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Vul je volledige naam in'),
    email: z.email('Vul een geldig e-mailadres in'),
    password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens hebben'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Wachtwoorden komen niet overeen',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens hebben'),
});

export const forgotPasswordSchema = z.object({
  email: z.email('Vul een geldig e-mailadres in'),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens hebben'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Wachtwoorden komen niet overeen',
    path: ['confirmPassword'],
  });

export const goalsSchema = z.object({
  goal: z.enum(['lose_weight', 'maintain', 'build_muscle']),
  calorieTarget: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 1000 && Number(value) <= 6000), {
      message: 'Caloriedoel moet tussen 1000 en 6000 liggen',
    }),
  proteinTarget: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 30 && Number(value) <= 350), {
      message: 'Eiwitdoel moet tussen 30 en 350 liggen',
    }),
  age: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 13 && Number(value) <= 100), {
      message: 'Leeftijd moet tussen 13 en 100 liggen',
    }),
  weight: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 30 && Number(value) <= 300), {
      message: 'Gewicht moet tussen 30 en 300 kg liggen',
    }),
  height: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 100 && Number(value) <= 250), {
      message: 'Lengte moet tussen 100 en 250 cm liggen',
    }),
});

export const settingsSchema = z.object({
  fullName: z.string().min(2, 'Vul je naam in'),
  goal: z.enum(['lose_weight', 'maintain', 'build_muscle']),
  calorieTarget: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 1000 && Number(value) <= 6000), {
      message: 'Caloriedoel moet tussen 1000 en 6000 liggen',
    }),
  proteinTarget: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 30 && Number(value) <= 350), {
      message: 'Eiwitdoel moet tussen 30 en 350 liggen',
    }),
});

const clarificationTypeSchema = z.enum(['meal_size', 'portion_size', 'quantity', 'preparation_method', 'hidden_calories', 'source_context']);
const mealPreparationMethodSchema = z.enum(['grilled', 'pan_fried', 'sauce', 'fried', 'oven_baked', 'boiled', 'raw']);
const hiddenCalorieSchema = z.enum(['oil', 'butter', 'sauce', 'dressing', 'cheese', 'not_sure']);
const mealSourceContextSchema = z.enum(['home_made', 'restaurant', 'takeaway']);
const mealSizeSchema = z.enum(['small', 'normal', 'large']);

export const clarificationOptionSchema = z.object({
  id: z.string().optional(),
  label: z.string(),
  description: z.string().optional(),
  grams: z.number().nullable().optional(),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  prep: mealPreparationMethodSchema.nullable().optional(),
  hiddenCalorie: hiddenCalorieSchema.nullable().optional(),
  sourceContext: mealSourceContextSchema.nullable().optional(),
  multiplier: z.number().nullable().optional(),
  mealSizeKey: mealSizeSchema.nullable().optional(),
});

export const mealClarificationQuestionSchema = z.object({
  id: z.string().optional(),
  itemIndex: z.number().int().optional(),
  itemName: z.string().optional(),
  type: clarificationTypeSchema,
  question: z.string(),
  selectionMode: z.enum(['single', 'multiple']).optional(),
  options: z.array(clarificationOptionSchema).default([]),
  priority: z.number().optional(),
  skippable: z.boolean().optional(),
  rationale: z.string().optional(),
  answered: z.boolean().optional(),
  skipped: z.boolean().optional(),
});

export const parsedMealItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number(),
  unit: z.string().min(1),
  confidence: z.number().min(0).max(1).nullable().optional(),
  confidenceFood: z.number().min(0).max(1).nullable().optional(),
  confidenceAmount: z.number().min(0).max(1).nullable().optional(),
  estimatedGrams: z.number().nullable().optional(),
  searchAliases: z.array(z.string()).optional(),
  needsClarification: z.boolean().optional(),
  clarificationType: clarificationTypeSchema.nullable().optional(),
  clarificationQuestion: z.string().nullable().optional(),
  clarificationOptions: z.array(clarificationOptionSchema).default([]),
  possiblePreparationMethods: z.array(mealPreparationMethodSchema).default([]),
  possibleHiddenCalories: z.array(hiddenCalorieSchema).default([]),
  selectedPreparationMethod: mealPreparationMethodSchema.nullable().optional(),
  selectedHiddenCalories: z.array(hiddenCalorieSchema).default([]),
  sourceContext: mealSourceContextSchema.nullable().optional(),
  selectedMealSize: mealSizeSchema.nullable().optional(),
  derivedFromClarification: z.boolean().optional(),
  parentItemName: z.string().nullable().optional(),
  templateKey: z.string().nullable().optional(),
});

export const parsedMealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'unknown']),
  originalText: z.string(),
  overallConfidence: z.number().min(0).max(1).optional(),
  needsClarification: z.boolean().optional(),
  clarificationPriority: z.array(clarificationTypeSchema).default([]),
  clarifications: z.array(mealClarificationQuestionSchema).default([]),
  templateKey: z.string().nullable().optional(),
  items: z.array(parsedMealItemSchema).min(1),
});
