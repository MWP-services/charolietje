import { createId, createUuid } from '@/utils/id';
import { isSupabaseConfigured } from '@/lib/supabase';
import { mealCorrectionRepository } from '@/repositories/mealCorrectionRepository';
import type {
  AnalyzedMeal,
  HiddenCalorieKey,
  MealCorrectionSignalRecord,
  MealPersonalizationHint,
  MealPersonalizationProfile,
  MealPreparationMethod,
  MealSizeKey,
  MealSourceContext,
} from '@/types/meal';

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');

const toTokenSet = (value: string) =>
  new Set(
    normalize(value)
      .split(' ')
      .filter((token) => token.length >= 3),
  );

const getTokenOverlap = (left: string, right: string) => {
  const leftTokens = toTokenSet(left);
  const rightTokens = toTokenSet(right);

  if (!leftTokens.size || !rightTokens.size) {
    return 0;
  }

  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  });

  return overlap;
};

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

const getMostCommon = <T extends string>(values: T[]) => {
  const counts = new Map<T, number>();

  values.forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
};

const getMostCommonMany = <T extends string>(values: T[][]) => {
  const counts = new Map<T, number>();

  values.flat().forEach((value) => {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([value]) => value);
};

const toSignalRecord = (userId: string, mealId: string | null | undefined, analysis: AnalyzedMeal): MealCorrectionSignalRecord => {
  const now = new Date().toISOString();

  return {
    id: isSupabaseConfigured ? createUuid() : createId('meal-correction'),
    user_id: userId,
    meal_id: mealId ?? null,
    original_transcript: analysis.originalText,
    parsed_estimate: analysis.initialParsedMeal,
    clarification_answers: analysis.clarificationAnswers,
    final_items: analysis.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      estimatedGrams: item.estimatedGrams ?? null,
      selectedPreparationMethod: item.selectedPreparationMethod ?? null,
      selectedHiddenCalories: item.selectedHiddenCalories ?? [],
      sourceContext: item.sourceContext ?? null,
    })),
    template_key: analysis.templateKey ?? analysis.initialParsedMeal.templateKey ?? null,
    created_at: now,
    updated_at: now,
  };
};

const buildHintsFromSignals = (
  signals: MealCorrectionSignalRecord[],
  templateKey?: string | null,
  itemNames?: string[],
): MealPersonalizationProfile => {
  const normalizedItemNames = new Set((itemNames ?? []).map((name) => normalize(name)));
  const relevantSignals = templateKey ? signals.filter((signal) => signal.template_key === templateKey) : signals;

  const byItem = new Map<
    string,
    Array<{
      quantity: number;
      unit: string;
      estimatedGrams?: number | null;
      prep?: MealPreparationMethod | null;
      hidden: HiddenCalorieKey[];
      source?: MealSourceContext | null;
    }>
  >();
  const mealSizeAnswers = relevantSignals
    .flatMap((signal) => signal.clarification_answers)
    .filter((answer) => answer.type === 'meal_size' && Boolean(answer.mealSizeKey));

  relevantSignals.forEach((signal) => {
    signal.final_items.forEach((item) => {
      const normalizedName = normalize(item.name);
      if (normalizedItemNames.size && !normalizedItemNames.has(normalizedName)) {
        return;
      }

      const current = byItem.get(normalizedName) ?? [];
      current.push({
        quantity: item.quantity,
        unit: item.unit,
        estimatedGrams: item.estimatedGrams ?? null,
        prep: item.selectedPreparationMethod ?? null,
        hidden: item.selectedHiddenCalories ?? [],
        source: item.sourceContext ?? null,
      });
      byItem.set(normalizedName, current);
    });
  });

  const hints = [...byItem.entries()]
    .map(([normalizedName, entries]) => {
      if (!entries.length) {
        return null;
      }

      const unit = getMostCommon(entries.map((entry) => entry.unit)) ?? entries[0].unit;
      const preferredPreparationMethod = getMostCommon(entries.map((entry) => entry.prep).filter((entry): entry is MealPreparationMethod => Boolean(entry)));
      const preferredSourceContext = getMostCommon(entries.map((entry) => entry.source).filter((entry): entry is MealSourceContext => Boolean(entry)));
      const commonHiddenCalories = getMostCommonMany(entries.map((entry) => entry.hidden)).filter((entry): entry is HiddenCalorieKey => Boolean(entry));
      const grams = entries.map((entry) => entry.estimatedGrams).filter((entry): entry is number => typeof entry === 'number' && Number.isFinite(entry));
      const quantities = entries.filter((entry) => entry.unit === unit).map((entry) => entry.quantity);

      return {
        itemName: normalizedName,
        averageQuantity: Math.round(average(quantities.length ? quantities : entries.map((entry) => entry.quantity)) * 10) / 10,
        unit,
        averageEstimatedGrams: grams.length ? Math.round(average(grams)) : null,
        preferredPreparationMethod,
        commonHiddenCalories,
        preferredSourceContext,
        sampleSize: entries.length,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => right.sampleSize - left.sampleSize);

  return {
    templateKey: templateKey ?? null,
    hints,
    preferredMealSize:
      getMostCommon(mealSizeAnswers.map((answer) => answer.mealSizeKey).filter((entry): entry is MealSizeKey => Boolean(entry))) ?? null,
    preferredMealSizeMultiplier:
      mealSizeAnswers.length > 0
        ? Math.round((average(mealSizeAnswers.map((answer) => answer.mealSizeMultiplier ?? 1)) + Number.EPSILON) * 100) / 100
        : null,
    mealSizeSampleSize: mealSizeAnswers.length,
  };
};

export const mealCorrectionService = {
  async recordCorrectionSignal(userId: string | null | undefined, mealId: string | null | undefined, analysis: AnalyzedMeal) {
    if (!userId) {
      return null;
    }

    return mealCorrectionRepository.insertSignal(toSignalRecord(userId, mealId, analysis));
  },

  async getPromptHintText(userId: string | null | undefined, transcript: string) {
    if (!userId) {
      return null;
    }

    const signals = await mealCorrectionRepository.listSignals(userId, 20);
    const similarSignals = signals
      .map((signal) => ({
        signal,
        score: getTokenOverlap(signal.original_transcript, transcript) + (signal.template_key ? 1 : 0),
      }))
      .filter((entry) => entry.score >= 2)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3)
      .map((entry) => entry.signal);

    if (!similarSignals.length) {
      return null;
    }

    return similarSignals
      .map((signal) => {
        const mealSize = signal.clarification_answers.find((answer) => answer.type === 'meal_size' && answer.mealSizeKey);
        const summary = signal.final_items
          .slice(0, 4)
          .map((item) => `${item.name} ${Math.round(item.estimatedGrams ?? item.quantity)}${item.estimatedGrams ? 'g' : ` ${item.unit}`}`)
          .join(', ');
        return `${signal.original_transcript}: ${summary}${mealSize?.mealSizeKey ? `, maaltijdgrootte ${mealSize.mealSizeKey}` : ''}`;
      })
      .join(' | ');
  },

  async getPersonalizationProfile(userId: string | null | undefined, transcript: string, templateKey?: string | null, itemNames?: string[]) {
    if (!userId) {
      return { templateKey: templateKey ?? null, hints: [], preferredMealSize: null, preferredMealSizeMultiplier: null, mealSizeSampleSize: 0 } satisfies MealPersonalizationProfile;
    }

    const signals = await mealCorrectionRepository.listSignals(userId, 30);
    const filteredSignals = templateKey
      ? signals.filter((signal) => signal.template_key === templateKey)
      : signals.filter((signal) => getTokenOverlap(signal.original_transcript, transcript) >= 2);

    if (!filteredSignals.length) {
      return { templateKey: templateKey ?? null, hints: [], preferredMealSize: null, preferredMealSizeMultiplier: null, mealSizeSampleSize: 0 };
    }

    return buildHintsFromSignals(filteredSignals, templateKey, itemNames);
  },

  async clearLocalSignals(userId: string) {
    await mealCorrectionRepository.clearLocalSignals(userId);
  },
};
