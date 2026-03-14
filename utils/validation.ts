import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Please enter your full name'),
    email: z.email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const goalsSchema = z.object({
  goal: z.enum(['lose_weight', 'maintain', 'build_muscle']),
  calorieTarget: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 1000 && Number(value) <= 6000), {
      message: 'Calorie target should be between 1000 and 6000',
    }),
  proteinTarget: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 30 && Number(value) <= 350), {
      message: 'Protein target should be between 30 and 350',
    }),
  age: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 13 && Number(value) <= 100), {
      message: 'Age should be between 13 and 100',
    }),
  weight: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 30 && Number(value) <= 300), {
      message: 'Weight should be between 30 and 300 kg',
    }),
  height: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 100 && Number(value) <= 250), {
      message: 'Height should be between 100 and 250 cm',
    }),
});

export const settingsSchema = z.object({
  fullName: z.string().min(2, 'Please enter your name'),
  calorieTarget: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 1000 && Number(value) <= 6000), {
      message: 'Calorie target should be between 1000 and 6000',
    }),
  proteinTarget: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? '')
    .refine((value) => !value || (Number(value) >= 30 && Number(value) <= 350), {
      message: 'Protein target should be between 30 and 350',
    }),
});
