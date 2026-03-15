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
