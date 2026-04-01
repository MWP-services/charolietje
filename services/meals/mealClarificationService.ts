import { mealTemplates, type MealTemplate, type MealTemplateItemConfig } from '@/constants/mealTemplates';
import type {
  AnalyzedMeal,
  AnalyzedMealItem,
  ClarificationAnswer,
  ClarificationOption,
  ClarificationType,
  HiddenCalorieKey,
  MealClarificationQuestion,
  MealPersonalizationProfile,
  MealPreparationMethod,
  MealSizeKey,
  MealSourceContext,
  ParsedMeal,
  ParsedMealItem,
} from '@/types/meal';
import { calculateMealTotals } from '@/utils/nutrition';

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');

const vaguePortionPattern = /\b(bord|bakje|kom|schaal|portie|beetje|wat|handje|schep|bowl|plate|some)\b/i;
const plateLikePattern = /\b(bord|plate|kom|bowl|schaal)\b/i;
const explicitAmountPattern = /\b\d+[.,]?\d*\s*(g|gram|gr|kg|ml|l|stuk|stuks|sneetje|sneetjes|plak|plakken|kop|kopje|glaz|wrap|wraps|ei|eieren|serving|portie)\b/i;
const restaurantPattern = /\b(restaurant|resto|afhaal|takeaway|bezorgd|besteld)\b/i;
const homeMadePattern = /\b(zelfgemaakt|thuisgemaakt|homemade)\b/i;
const preparationKeywords: Array<{ pattern: RegExp; prep: MealPreparationMethod }> = [
  { pattern: /\b(gegrild|grilled)\b/i, prep: 'grilled' },
  { pattern: /\b(gebakken|bakken|fried in pan|pan fried)\b/i, prep: 'pan_fried' },
  { pattern: /\b(in saus|met saus|sauce|saus)\b/i, prep: 'sauce' },
  { pattern: /\b(gefrituurd|frituur|fried)\b/i, prep: 'fried' },
  { pattern: /\b(oven|ovengebakken|oven baked)\b/i, prep: 'oven_baked' },
  { pattern: /\b(gekookt|boiled)\b/i, prep: 'boiled' },
  { pattern: /\b(rauw|raw)\b/i, prep: 'raw' },
];

const hiddenCalorieLabels: Record<HiddenCalorieKey, string> = {
  oil: 'Olie',
  butter: 'Boter',
  sauce: 'Saus',
  dressing: 'Dressing',
  cheese: 'Kaas',
  not_sure: 'Niet zeker',
};

const hiddenCalorieItems: Record<
  Exclude<HiddenCalorieKey, 'not_sure'>,
  { name: string; quantity: number; unit: string; estimatedGrams: number; searchAliases: string[] }
> = {
  oil: { name: 'extra oil', quantity: 10, unit: 'ml', estimatedGrams: 10, searchAliases: ['oil', 'olive oil', 'extra oil', 'bakolie'] },
  butter: { name: 'extra butter', quantity: 10, unit: 'gram', estimatedGrams: 10, searchAliases: ['butter', 'boter', 'extra butter'] },
  sauce: { name: 'extra sauce', quantity: 40, unit: 'gram', estimatedGrams: 40, searchAliases: ['sauce', 'saus', 'extra sauce', 'generic sauce'] },
  dressing: { name: 'extra dressing', quantity: 25, unit: 'ml', estimatedGrams: 25, searchAliases: ['dressing', 'extra dressing', 'salad dressing'] },
  cheese: { name: 'extra cheese', quantity: 20, unit: 'gram', estimatedGrams: 20, searchAliases: ['cheese', 'kaas', 'extra cheese'] },
};

const normalizeUnit = (unit: string) => {
  const normalized = unit.trim().toLowerCase();

  switch (normalized) {
    case 'g':
    case 'gram':
    case 'grams':
    case 'gr':
      return 'gram';
    case 'ml':
      return 'ml';
    case 'slice':
    case 'slices':
    case 'sneetje':
    case 'sneetjes':
      return 'slice';
    case 'piece':
    case 'pieces':
    case 'stuk':
    case 'stuks':
      return 'piece';
    default:
      return normalized;
  }
};

const unique = <T,>(values: T[]) => values.filter((value, index) => values.indexOf(value) === index);
const round = (value: number) => Math.round(value * 10) / 10;

const buildClarificationId = (itemIndex: number, type: ClarificationType, itemName?: string) =>
  `${type}:${itemIndex}:${normalize(itemName ?? 'meal')}`;

const getEstimatedGrams = (quantity: number, unit: string) => {
  const normalizedUnit = normalizeUnit(unit);
  if (normalizedUnit === 'gram' || normalizedUnit === 'ml') {
    return quantity;
  }

  if (normalizedUnit === 'slice') {
    return quantity * 35;
  }

  if (normalizedUnit === 'piece') {
    return quantity * 70;
  }

  return null;
};

const drinkLikeNames = ['water', 'tea', 'black coffee', 'coffee with milk', 'orange juice', 'cola', 'cola zero', 'chocolate milk'];

const isScalableMealItem = (item: ParsedMealItem) => {
  if (item.derivedFromClarification) {
    return false;
  }

  return !drinkLikeNames.includes(normalize(item.name));
};

const getTemplateItemForParsedItem = (item: ParsedMealItem, template?: MealTemplate | null) => {
  if (!template) {
    return null;
  }

  const normalizedName = normalize(item.name);
  return (
    template.items.find((config) => config.aliases.some((alias) => normalizedName.includes(normalize(alias)) || normalize(alias).includes(normalizedName))) ?? null
  );
};

const buildPortionOptions = (config?: MealTemplateItemConfig | null): ClarificationOption[] => {
  if (config?.portionPresets?.length) {
    return config.portionPresets.map((option) => ({
      id: option.id,
      label: option.label,
      grams: option.grams,
      quantity: option.grams,
      unit: 'gram',
    }));
  }

  return [
    { id: 'small', label: 'Klein', grams: 100, quantity: 100, unit: 'gram' },
    { id: 'normal', label: 'Normaal', grams: 150, quantity: 150, unit: 'gram' },
    { id: 'large', label: 'Groot', grams: 220, quantity: 220, unit: 'gram' },
  ];
};

const buildQuantityOptions = (item: ParsedMealItem, config?: MealTemplateItemConfig | null): ClarificationOption[] => {
  if (config?.quantityPresets?.length) {
    return config.quantityPresets.map((option) => ({
      id: option.id,
      label: option.label,
      quantity: option.quantity,
      unit: option.unit,
      grams: option.unit === 'gram' ? option.quantity : undefined,
    }));
  }

  if (normalizeUnit(item.unit) === 'piece' || normalizeUnit(item.unit) === 'slice') {
    return [
      { id: '1', label: `1 ${item.unit}`, quantity: 1, unit: item.unit },
      { id: '2', label: `2 ${item.unit}`, quantity: 2, unit: item.unit },
      { id: '3', label: `3 ${item.unit}`, quantity: 3, unit: item.unit },
    ];
  }

  return [
    { id: '100g', label: '100 g', quantity: 100, unit: 'gram', grams: 100 },
    { id: '150g', label: '150 g', quantity: 150, unit: 'gram', grams: 150 },
    { id: '200g', label: '200 g', quantity: 200, unit: 'gram', grams: 200 },
  ];
};

const buildPreparationOptions = (config?: MealTemplateItemConfig | null): ClarificationOption[] => {
  const preparationMethods = config?.possiblePreparationMethods ?? ['grilled', 'pan_fried', 'sauce', 'fried', 'oven_baked'];

  const labelMap: Record<MealPreparationMethod, string> = {
    grilled: 'Gegrild',
    pan_fried: 'Gebakken',
    sauce: 'In saus',
    fried: 'Gefrituurd',
    oven_baked: 'Uit de oven',
    boiled: 'Gekookt',
    raw: 'Rauw',
  };

  return preparationMethods.map((prep) => ({
    id: prep,
    label: labelMap[prep],
    prep,
  }));
};

const buildHiddenCalorieOptions = (config?: MealTemplateItemConfig | null, template?: MealTemplate | null): ClarificationOption[] => {
  const keys = unique([...(config?.possibleHiddenCalories ?? []), ...(template?.likelyHiddenCalories ?? []), 'not_sure' as const]);
  return keys.map((hiddenCalorie) => ({
    id: hiddenCalorie,
    label: hiddenCalorieLabels[hiddenCalorie],
    hiddenCalorie,
  }));
};

const buildSourceOptions = (): ClarificationOption[] => [
  { id: 'home_made', label: 'Zelfgemaakt', sourceContext: 'home_made' },
  { id: 'restaurant', label: 'Restaurant', sourceContext: 'restaurant' },
  { id: 'takeaway', label: 'Afhaal', sourceContext: 'takeaway' },
];

const buildMealSizeOptions = (template?: MealTemplate | null): ClarificationOption[] => {
  if (template?.mealSizePresets?.length) {
    return template.mealSizePresets.map((preset) => ({
      id: preset.id,
      label: preset.label,
      multiplier: preset.multiplier,
      mealSizeKey: preset.id,
    }));
  }

  return [
    { id: 'small', label: 'Klein bord', multiplier: 0.82, mealSizeKey: 'small' },
    { id: 'normal', label: 'Normaal bord', multiplier: 1, mealSizeKey: 'normal' },
    { id: 'large', label: 'Groot bord', multiplier: 1.22, mealSizeKey: 'large' },
  ];
};

const getFoodConfidence = (item: ParsedMealItem) => {
  if (typeof item.confidenceFood === 'number') {
    return item.confidenceFood;
  }

  if (typeof item.confidence === 'number') {
    return item.confidence;
  }

  return 0.88;
};

const getAmountConfidence = (item: ParsedMealItem, transcript: string) => {
  if (typeof item.confidenceAmount === 'number') {
    return item.confidenceAmount;
  }

  const explicit = explicitAmountPattern.test(transcript);
  const vague = vaguePortionPattern.test(transcript);

  if (explicit && !vague) {
    return 0.86;
  }

  if (vague) {
    return 0.38;
  }

  return typeof item.confidence === 'number' ? Math.max(0.45, item.confidence - 0.18) : 0.58;
};

const matchMealTemplate = (transcript: string, items: ParsedMealItem[]) => {
  const normalizedTranscript = normalize(transcript);
  const normalizedNames = items.map((item) => normalize(item.name));

  const scored = mealTemplates
    .map((template) => {
      let score = 0;

      template.transcriptPatterns.forEach((pattern) => {
        if (pattern.test(transcript)) {
          score += 3;
        }
      });

      template.items.forEach((config) => {
        if (
          config.aliases.some(
            (alias) => normalizedTranscript.includes(normalize(alias)) || normalizedNames.some((name) => name.includes(normalize(alias)) || normalize(alias).includes(name)),
          )
        ) {
          score += 1;
        }
      });

      return { template, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  return scored[0]?.template ?? null;
};

const isCompositeMealSizeCandidate = (items: ParsedMealItem[], transcript: string, template?: MealTemplate | null) => {
  const scalableItems = items.filter((item) => isScalableMealItem(item));
  if (scalableItems.length < 2) {
    return false;
  }

  if (template?.mealSizePresets?.length) {
    return true;
  }

  return plateLikePattern.test(transcript) || vaguePortionPattern.test(transcript);
};

const ensureTemplateItems = (items: ParsedMealItem[], template: MealTemplate | null, transcript: string) => {
  if (!template) {
    return items;
  }

  const normalizedTranscript = normalize(transcript);
  const nextItems = [...items];

  template.items.forEach((config) => {
    const alreadyPresent = nextItems.some((item) =>
      config.aliases.some((alias) => normalize(item.name).includes(normalize(alias)) || normalize(alias).includes(normalize(item.name))),
    );

    if (alreadyPresent) {
      return;
    }

    const aliasMentioned = config.aliases.some((alias) => normalizedTranscript.includes(normalize(alias)));
    const templateStronglyMatched = template.transcriptPatterns.some((pattern) => pattern.test(transcript));

    if (!aliasMentioned && !templateStronglyMatched) {
      return;
    }

    nextItems.push({
      name: config.name,
      quantity: config.defaultQuantity,
      unit: config.unit,
      estimatedGrams: config.estimatedGrams,
      confidence: 0.55,
      confidenceFood: 0.74,
      confidenceAmount: 0.32,
      needsClarification: false,
      clarificationOptions: [],
      possiblePreparationMethods: config.possiblePreparationMethods ?? [],
      possibleHiddenCalories: config.possibleHiddenCalories ?? [],
      searchAliases: config.aliases,
      templateKey: template.key,
    });
  });

  return nextItems;
};

const applyPersonalizationHints = (items: ParsedMealItem[], profile?: MealPersonalizationProfile | null) => {
  if (!profile?.hints.length) {
    return items;
  }

  const withItemHints = items.map((item) => {
    const hint = profile.hints.find((entry) => normalize(entry.itemName) === normalize(item.name));
    if (!hint || hint.sampleSize < 2) {
      return item;
    }

    const hasExplicitAmount = typeof item.confidenceAmount === 'number' ? item.confidenceAmount >= 0.8 : false;
    if (hasExplicitAmount) {
      return item;
    }

    return {
      ...item,
      quantity: hint.averageQuantity,
      unit: hint.unit,
      estimatedGrams: hint.averageEstimatedGrams ?? item.estimatedGrams ?? getEstimatedGrams(hint.averageQuantity, hint.unit),
      selectedPreparationMethod: hint.preferredPreparationMethod ?? item.selectedPreparationMethod,
      selectedHiddenCalories: hint.commonHiddenCalories?.length ? hint.commonHiddenCalories : item.selectedHiddenCalories,
      sourceContext: hint.preferredSourceContext ?? item.sourceContext,
      confidenceAmount: Math.max(item.confidenceAmount ?? 0.45, 0.62),
    };
  });

  if ((profile.mealSizeSampleSize ?? 0) < 2 || !profile.preferredMealSizeMultiplier) {
    return withItemHints;
  }

  return withItemHints.map((item) => {
    if (!isScalableMealItem(item)) {
      return item;
    }

    const hasExplicitAmount = typeof item.confidenceAmount === 'number' ? item.confidenceAmount >= 0.8 : false;
    if (hasExplicitAmount) {
      return item;
    }

    const nextQuantity = normalizeUnit(item.unit) === 'piece' || normalizeUnit(item.unit) === 'slice' ? item.quantity : round(item.quantity * profile.preferredMealSizeMultiplier!);
    const nextEstimatedGrams =
      item.estimatedGrams && normalizeUnit(item.unit) !== 'piece' && normalizeUnit(item.unit) !== 'slice'
        ? round(item.estimatedGrams * profile.preferredMealSizeMultiplier!)
        : item.estimatedGrams;

    return {
      ...item,
      quantity: nextQuantity,
      estimatedGrams: nextEstimatedGrams,
      selectedMealSize: profile.preferredMealSize ?? item.selectedMealSize ?? null,
      confidenceAmount: Math.max(item.confidenceAmount ?? 0.45, 0.66),
    };
  });
};

const createQuestion = (
  item: ParsedMealItem,
  itemIndex: number,
  type: ClarificationType,
  options: ClarificationOption[],
  priority: number,
): MealClarificationQuestion => {
  const label = item.name.toLowerCase();

  const questionMap: Record<ClarificationType, string> = {
    meal_size: 'Hoe groot was de hele maaltijd ongeveer?',
    portion_size: `Hoe groot was de portie ${label} ongeveer?`,
    quantity: `Welke hoeveelheid ${label} komt het meest in de buurt?`,
    preparation_method: `Hoe was de ${label} bereid?`,
    hidden_calories: `Zat hier nog iets extra's bij?`,
    source_context: `Waar kwam deze ${label} vandaan?`,
  };

  return {
    id: buildClarificationId(itemIndex, type, item.name),
    itemIndex,
    itemName: item.name,
    type,
    question: questionMap[type],
    selectionMode: type === 'hidden_calories' ? 'multiple' : 'single',
    options,
    priority,
    skippable: true,
  };
};

const createMealSizeQuestion = (items: ParsedMealItem[], transcript: string, template?: MealTemplate | null) => {
  const question = plateLikePattern.test(transcript) ? 'Hoe groot was het bord ongeveer?' : 'Hoe groot was de hele maaltijd ongeveer?';

  return {
    id: buildClarificationId(-1, 'meal_size', template?.key ?? 'hele maaltijd'),
    itemIndex: -1,
    itemName: 'hele maaltijd',
    type: 'meal_size' as const,
    question,
    selectionMode: 'single' as const,
    options: buildMealSizeOptions(template),
    priority: 96,
    skippable: true,
    rationale: `${items.length} onderdelen lijken samen één maaltijd te vormen`,
  };
};

const getClarificationCandidates = (item: ParsedMealItem, itemIndex: number, transcript: string, template: MealTemplate | null) => {
  const config = getTemplateItemForParsedItem(item, template);
  const candidates: MealClarificationQuestion[] = [];
  const normalizedTranscript = normalize(transcript);
  const normalizedItemName = normalize(item.name);
  const hasExplicitAmount = explicitAmountPattern.test(transcript);
  const amountConfidence = item.confidenceAmount ?? getAmountConfidence(item, transcript);
  const containsPreparationKeyword = preparationKeywords.some(({ pattern }) => pattern.test(transcript));
  const containsSourceKeyword = restaurantPattern.test(transcript) || homeMadePattern.test(transcript);
  const hiddenKeywordsMentioned = /\b(olie|oil|boter|butter|saus|sauce|dressing|kaas|cheese)\b/i.test(transcript);
  const pestoMentioned = /\bpesto\b/i.test(transcript);
  const likelyPreparationImpact =
    (config?.possiblePreparationMethods?.length ?? 0) > 0 || /\b(kip|chicken|zalm|salmon|aardappel|potato|gehakt|beef mince)\b/i.test(normalizedItemName);
  const likelyHiddenCalories =
    (config?.possibleHiddenCalories?.length ?? 0) > 0 || /\b(salade|salad|wrap|pokebowl|poke bowl|pasta|kip|chicken)\b/i.test(normalizedTranscript);

  if ((vaguePortionPattern.test(transcript) || amountConfidence < 0.64 || !hasExplicitAmount) && normalizeUnit(item.unit) !== 'piece') {
    candidates.push(createQuestion(item, itemIndex, 'portion_size', buildPortionOptions(config), 100 - Math.round(amountConfidence * 100)));
  }

  if ((normalizeUnit(item.unit) === 'piece' || normalizeUnit(item.unit) === 'slice') && amountConfidence < 0.72) {
    candidates.push(createQuestion(item, itemIndex, 'quantity', buildQuantityOptions(item, config), 92 - Math.round(amountConfidence * 100)));
  }

  if (!containsPreparationKeyword && likelyPreparationImpact) {
    candidates.push(createQuestion(item, itemIndex, 'preparation_method', buildPreparationOptions(config), 78));
  }

  if (((!hiddenKeywordsMentioned && likelyHiddenCalories) || (pestoMentioned && amountConfidence < 0.82)) && likelyHiddenCalories) {
    candidates.push(createQuestion(item, itemIndex, 'hidden_calories', buildHiddenCalorieOptions(config, template), 74));
  }

  if (!containsSourceKeyword && template?.clarificationTypes.includes('source_context')) {
    candidates.push(createQuestion(item, itemIndex, 'source_context', buildSourceOptions(), 66));
  }

  return candidates;
};

const finalizeParsedMeal = (meal: ParsedMeal, answers: ClarificationAnswer[] = []): ParsedMeal => {
  const unansweredClarifications = meal.clarifications.filter((question) => !question.answered && !question.skipped);

  return {
    ...meal,
    needsClarification: unansweredClarifications.length > 0,
    clarificationPriority: unique(unansweredClarifications.map((question) => question.type)),
    overallConfidence:
      Math.round(
        Math.max(
          0.32,
          Math.min(
            0.98,
            meal.items.reduce((sum, item) => sum + Math.min(item.confidenceFood ?? 0.75, item.confidenceAmount ?? 0.55), 0) / Math.max(1, meal.items.length) -
              unansweredClarifications.length * 0.04 +
              answers.length * 0.02,
          ),
        ) * 100,
      ) / 100,
  };
};

const dedupeAliases = (aliases: string[]) => unique(aliases.filter((alias) => alias.trim().length >= 2).map((alias) => alias.trim()));

const withItemClarificationState = (items: ParsedMealItem[], clarifications: MealClarificationQuestion[]) =>
  items.map((item, index) => {
    const question = clarifications.find((entry) => entry.itemIndex === index && !entry.answered && !entry.skipped) ?? null;
    return {
      ...item,
      needsClarification: Boolean(question),
      clarificationType: question?.type ?? null,
      clarificationQuestion: question?.question ?? null,
      clarificationOptions: question?.options ?? item.clarificationOptions ?? [],
    };
  });

export const mealClarificationService = {
  enrichParsedMeal(rawMeal: ParsedMeal, transcript: string, personalizationProfile?: MealPersonalizationProfile | null) {
    const template = matchMealTemplate(transcript, rawMeal.items);
    const templateItems = ensureTemplateItems(rawMeal.items, template, transcript);
    const personalizedItems = applyPersonalizationHints(templateItems, personalizationProfile).map((item) => {
      const config = getTemplateItemForParsedItem(item, template);
      const confidenceFood = getFoodConfidence(item);
      const confidenceAmount = getAmountConfidence(item, transcript);
      const selectedPreparationMethod =
        item.selectedPreparationMethod ?? preparationKeywords.find(({ pattern }) => pattern.test(transcript))?.prep ?? null;
      const sourceContext: MealSourceContext | null = item.sourceContext ?? (restaurantPattern.test(transcript) ? 'restaurant' : homeMadePattern.test(transcript) ? 'home_made' : null);

      return {
        ...item,
        unit: normalizeUnit(item.unit),
        estimatedGrams: item.estimatedGrams ?? getEstimatedGrams(item.quantity, item.unit) ?? config?.estimatedGrams ?? null,
        confidence: Math.round(((confidenceFood + confidenceAmount) / 2) * 100) / 100,
        confidenceFood,
        confidenceAmount,
        selectedPreparationMethod,
        possiblePreparationMethods: unique([...(item.possiblePreparationMethods ?? []), ...(config?.possiblePreparationMethods ?? [])]),
        possibleHiddenCalories: unique([...(item.possibleHiddenCalories ?? []), ...(config?.possibleHiddenCalories ?? []), ...(template?.likelyHiddenCalories ?? [])]),
        sourceContext,
        searchAliases: dedupeAliases([
          item.name,
          ...(item.searchAliases ?? []),
          ...(config?.aliases ?? []),
          ...(selectedPreparationMethod ? [selectedPreparationMethod.replace('_', ' ')] : []),
        ]),
        templateKey: template?.key ?? item.templateKey ?? null,
        clarificationOptions: item.clarificationOptions ?? [],
      } satisfies ParsedMealItem;
    });

    const shouldAskMealSize = isCompositeMealSizeCandidate(personalizedItems, transcript, template);
    const clarificationCandidates = personalizedItems
      .flatMap((item, index) => {
        const candidates = getClarificationCandidates(item, index, transcript, template);
        return shouldAskMealSize ? candidates.filter((candidate) => candidate.type !== 'portion_size' && candidate.type !== 'quantity') : candidates;
      })
      .sort((left, right) => right.priority - left.priority);

    const selectedClarifications = [
      ...(shouldAskMealSize ? [createMealSizeQuestion(personalizedItems, transcript, template)] : []),
      ...clarificationCandidates,
    ]
      .slice(0, 3)
      .map((question, index) => ({
      ...question,
      priority: 100 - index,
      }));

    const meal: ParsedMeal = {
      mealType: rawMeal.mealType,
      originalText: transcript,
      items: withItemClarificationState(personalizedItems, selectedClarifications),
      overallConfidence: rawMeal.overallConfidence ?? 0.65,
      needsClarification: selectedClarifications.length > 0,
      clarificationPriority: unique(selectedClarifications.map((question) => question.type)),
      clarifications: selectedClarifications,
      templateKey: template?.key ?? rawMeal.templateKey ?? null,
    };

    return finalizeParsedMeal(meal);
  },

  toAnalyzedMeal(parsedMeal: ParsedMeal, nutritionItems: AnalyzedMealItem[], initialParsedMeal?: ParsedMeal, clarificationAnswers: ClarificationAnswer[] = []): AnalyzedMeal {
    const items = nutritionItems.map((item, index) => ({
      ...parsedMeal.items[index],
      ...item,
      quantity: item.quantity,
      unit: normalizeUnit(item.unit),
      estimatedGrams: parsedMeal.items[index]?.estimatedGrams ?? getEstimatedGrams(item.quantity, item.unit),
    }));

    const finalizedParsedMeal = finalizeParsedMeal(
      {
        ...parsedMeal,
        items: withItemClarificationState(items, parsedMeal.clarifications),
      },
      clarificationAnswers,
    );

    return {
      mealType: finalizedParsedMeal.mealType,
      originalText: finalizedParsedMeal.originalText,
      items,
      totals: calculateMealTotals(items),
      overallConfidence: finalizedParsedMeal.overallConfidence,
      needsClarification: finalizedParsedMeal.needsClarification,
      clarificationPriority: finalizedParsedMeal.clarificationPriority,
      clarifications: finalizedParsedMeal.clarifications,
      clarificationAnswers,
      initialParsedMeal: initialParsedMeal ?? finalizedParsedMeal,
      templateKey: finalizedParsedMeal.templateKey ?? null,
    };
  },

  toParsedMealFromAnalysis(analysis: AnalyzedMeal): ParsedMeal {
    return {
      mealType: analysis.mealType,
      originalText: analysis.originalText,
      items: analysis.items.map(({ calories, protein, carbs, fat, fiber, sugar, sodium, nutritionSource, ...item }) => ({ ...item })),
      overallConfidence: analysis.overallConfidence,
      needsClarification: analysis.needsClarification,
      clarificationPriority: analysis.clarificationPriority,
      clarifications: analysis.clarifications,
      templateKey: analysis.templateKey ?? null,
    };
  },

  applyClarificationAnswer(parsedMeal: ParsedMeal, selectedQuestionId: string, selectedOptionIds: string[]) {
    const question = parsedMeal.clarifications.find((entry) => entry.id === selectedQuestionId);
    if (!question) {
      throw new Error('Deze verduidelijkingsvraag bestaat niet meer.');
    }

    const selectedOptions = question.options.filter((option) => selectedOptionIds.includes(option.id));
    const items = parsedMeal.items.map((item) => ({ ...item }));
    const scopedItem = question.itemIndex >= 0 ? { ...items[question.itemIndex] } : null;

    if (!selectedOptions.length) {
      throw new Error('Kies minimaal een optie of sla de vraag over.');
    }

    if (question.type === 'portion_size' || question.type === 'quantity') {
      if (!scopedItem) {
        throw new Error('Deze portievraag kon niet meer aan een item worden gekoppeld.');
      }
      const selected = selectedOptions[0];
      const nextQuantity = selected.quantity ?? selected.grams ?? scopedItem.quantity;
      const nextUnit = selected.unit ?? (selected.grams ? 'gram' : scopedItem.unit);
      scopedItem.quantity = nextQuantity;
      scopedItem.unit = normalizeUnit(nextUnit);
      scopedItem.estimatedGrams = selected.grams ?? getEstimatedGrams(nextQuantity, nextUnit) ?? scopedItem.estimatedGrams ?? null;
      scopedItem.confidenceAmount = 0.92;
    }

    if (question.type === 'meal_size') {
      const selected = selectedOptions[0];
      const multiplier = selected.multiplier ?? 1;

      items.forEach((entry, index) => {
        if (!isScalableMealItem(entry)) {
          return;
        }

        const normalizedUnit = normalizeUnit(entry.unit);
        if (normalizedUnit === 'piece' || normalizedUnit === 'slice') {
          items[index] = {
            ...entry,
            selectedMealSize: selected.mealSizeKey ?? null,
            confidenceAmount: Math.max(entry.confidenceAmount ?? 0.55, 0.84),
          };
          return;
        }

        items[index] = {
          ...entry,
          quantity: round(entry.quantity * multiplier),
          estimatedGrams: entry.estimatedGrams ? round(entry.estimatedGrams * multiplier) : entry.estimatedGrams,
          selectedMealSize: selected.mealSizeKey ?? null,
          confidenceAmount: Math.max(entry.confidenceAmount ?? 0.55, 0.9),
        };
      });
    }

    if (question.type === 'preparation_method') {
      if (!scopedItem) {
        throw new Error('Deze bereidingsvraag kon niet meer aan een item worden gekoppeld.');
      }
      const selected = selectedOptions[0];
      scopedItem.selectedPreparationMethod = selected.prep ?? null;
      scopedItem.searchAliases = dedupeAliases([
        ...(scopedItem.searchAliases ?? []),
        ...(selected.prep ? [selected.prep.replace('_', ' ')] : []),
        `${selected.label} ${scopedItem.name}`,
      ]);
      scopedItem.confidenceAmount = Math.max(scopedItem.confidenceAmount ?? 0.55, 0.78);
    }

    if (question.type === 'hidden_calories') {
      const hiddenCalories = selectedOptions.map((option) => option.hiddenCalorie).filter((value): value is HiddenCalorieKey => Boolean(value));
      if (scopedItem) {
        scopedItem.selectedHiddenCalories = hiddenCalories.filter((value) => value !== 'not_sure');
      }
    }

    if (question.type === 'source_context') {
      if (!scopedItem) {
        throw new Error('Deze contextvraag kon niet meer aan een item worden gekoppeld.');
      }
      const selected = selectedOptions[0];
      scopedItem.sourceContext = selected.sourceContext ?? null;
      if (scopedItem.sourceContext && normalizeUnit(scopedItem.unit) === 'gram' && (scopedItem.confidenceAmount ?? 0) < 0.84) {
        const multiplier = scopedItem.sourceContext === 'restaurant' ? 1.1 : scopedItem.sourceContext === 'takeaway' ? 1.15 : 1;
        scopedItem.quantity = Math.round(scopedItem.quantity * multiplier);
        scopedItem.estimatedGrams = scopedItem.estimatedGrams ? Math.round(scopedItem.estimatedGrams * multiplier) : scopedItem.estimatedGrams;
      }
      scopedItem.confidenceAmount = Math.max(scopedItem.confidenceAmount ?? 0.55, 0.72);
    }

    if (scopedItem && question.itemIndex >= 0) {
      items[question.itemIndex] = scopedItem;
    }

    const withoutDerivedChildren = items.filter(
      (entry, index) => !(index !== question.itemIndex && entry.derivedFromClarification && entry.parentItemName === question.itemName),
    );

    const nextItems =
      question.type === 'hidden_calories'
        ? [
            ...withoutDerivedChildren,
            ...selectedOptions
              .map((option) => option.hiddenCalorie)
              .filter((value): value is Exclude<HiddenCalorieKey, 'not_sure'> => Boolean(value) && value !== 'not_sure')
              .map((hiddenCalorie) => {
                const hiddenItem = hiddenCalorieItems[hiddenCalorie];

                return {
                  name: hiddenItem.name,
                  quantity: hiddenItem.quantity,
                  unit: hiddenItem.unit,
                  estimatedGrams: hiddenItem.estimatedGrams,
                  confidence: 0.82,
                  confidenceFood: 0.86,
                  confidenceAmount: 0.8,
                  needsClarification: false,
                  clarificationType: null,
                  clarificationQuestion: null,
                  clarificationOptions: [],
                  possiblePreparationMethods: [],
                  possibleHiddenCalories: [],
                  selectedHiddenCalories: [],
                  sourceContext: scopedItem?.sourceContext ?? null,
                  derivedFromClarification: true,
                  parentItemName: question.itemName,
                  templateKey: parsedMeal.templateKey ?? null,
                  searchAliases: hiddenItem.searchAliases,
                } satisfies ParsedMealItem;
              }),
          ]
        : withoutDerivedChildren;

    const clarifications = parsedMeal.clarifications.map((entry) =>
      entry.id === selectedQuestionId ? { ...entry, answered: true, skipped: false } : entry,
    );

    const answer: ClarificationAnswer = {
      questionId: question.id,
      itemIndex: question.itemIndex,
      itemName: question.itemName,
      type: question.type,
      selectedOptionIds,
      selectedLabels: selectedOptions.map((option) => option.label),
      appliedGrams: question.type === 'meal_size' ? null : scopedItem?.estimatedGrams ?? null,
      appliedQuantity: question.type === 'meal_size' ? null : scopedItem?.quantity ?? null,
      appliedUnit: question.type === 'meal_size' ? null : scopedItem?.unit ?? null,
      preparationMethod: scopedItem?.selectedPreparationMethod ?? null,
      hiddenCalories: scopedItem?.selectedHiddenCalories ?? [],
      sourceContext: scopedItem?.sourceContext ?? null,
      mealSizeKey: question.type === 'meal_size' ? selectedOptions[0]?.mealSizeKey ?? null : scopedItem?.selectedMealSize ?? null,
      mealSizeMultiplier: question.type === 'meal_size' ? selectedOptions[0]?.multiplier ?? null : null,
      answeredAt: new Date().toISOString(),
    };

    const nextMeal = finalizeParsedMeal(
      {
        ...parsedMeal,
        items: withItemClarificationState(nextItems, clarifications),
        clarifications,
      },
      [answer],
    );

    return {
      parsedMeal: nextMeal,
      answer,
    };
  },

  skipClarification(parsedMeal: ParsedMeal, selectedQuestionId: string) {
    const clarifications = parsedMeal.clarifications.map((entry) =>
      entry.id === selectedQuestionId ? { ...entry, answered: false, skipped: true } : entry,
    );

    return finalizeParsedMeal(
      {
        ...parsedMeal,
        items: withItemClarificationState(parsedMeal.items, clarifications),
        clarifications,
      },
      [],
    );
  },
};
