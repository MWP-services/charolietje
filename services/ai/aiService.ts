import type { AnalyzedMeal, ClarificationAnswer, MealType, ParsedMeal, ParsedMealItem } from '@/types/meal';
import { isSupabaseConfigured } from '@/lib/supabase';

import { parseMealTextWithOpenAI } from '@/services/ai/mealParsingService';
import { mealClarificationService } from '@/services/meals/mealClarificationService';
import { mealCorrectionService } from '@/services/meals/mealCorrectionService';
import { nutritionService } from '@/services/nutrition/nutritionService';
import { transcribeAudioWithOpenAI } from '@/services/ai/transcriptionService';

type ClarificationAction =
  | {
      kind: 'answer';
      questionId: string;
      selectedOptionIds: string[];
    }
  | {
      kind: 'skip';
      questionId: string;
    };

const sampleTranscriptions = [
  'Als ontbijt heb ik 2 boterhammen met pindakaas gegeten en een glas halfvolle melk.',
  'Voor lunch at ik een kipsandwich en een appel.',
  'Vanavond heb ik rijst met zalm en groenten gegeten.',
];

const detectMealType = (text: string): MealType => {
  const normalized = text.toLowerCase();
  if (/(ontbijt|breakfast|ochtend)/.test(normalized)) return 'breakfast';
  if (/(lunch|middag)/.test(normalized)) return 'lunch';
  if (/(diner|avond|dinner)/.test(normalized)) return 'dinner';
  if (/(snack|tussendoor|yogurt|yoghurt)/.test(normalized)) return 'snack';
  return 'unknown';
};

const extractQuantity = (text: string, expression: RegExp, fallback: number) => {
  const match = text.match(expression);
  return match ? Number(match[1]) : fallback;
};

const parseKnownItems = (text: string): ParsedMealItem[] => {
  const normalized = text.toLowerCase();
  const items: ParsedMealItem[] = [];

  if (/(boterham|boterhammen|bread)/.test(normalized)) {
    items.push({
      name: 'bread',
      quantity: extractQuantity(normalized, /(\d+)\s*(boterham|boterhammen|slice|slices)/, 2),
      unit: 'slices',
      confidence: 0.92,
    });
  }

  if (/(pindakaas|peanut butter)/.test(normalized)) {
    items.push({
      name: 'peanut butter',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(pindakaas|peanut butter)/, 30),
      unit: 'gram',
      confidence: 0.88,
    });
  }

  if (/(halfvolle melk|melk|milk)/.test(normalized)) {
    items.push({
      name: 'semi-skimmed milk',
      quantity: /(glas|glass)/.test(normalized)
        ? 250
        : extractQuantity(normalized, /(\d+)\s*(ml)\s*(melk|milk)/, 200),
      unit: 'ml',
      confidence: 0.9,
    });
  }

  if (/(zwarte koffie|black coffee|koffie|coffee)/.test(normalized)) {
    const cups = extractQuantity(normalized, /(\d+)\s*(kop|koppen|kopje|kopjes|cup|cups|mug|mugs|mok|mokken)\s*(zwarte koffie|black coffee|koffie|coffee)?/, 1);
    items.push({
      name: 'black coffee',
      quantity: cups * 240,
      unit: 'ml',
      confidence: 0.92,
    });
  }

  if (/(thee|tea)/.test(normalized)) {
    const cups = extractQuantity(normalized, /(\d+)\s*(kop|koppen|kopje|kopjes|cup|cups|mug|mugs|mok|mokken)\s*(thee|tea)?/, 1);
    items.push({
      name: 'tea',
      quantity: cups * 240,
      unit: 'ml',
      confidence: 0.9,
    });
  }

  if (/(water)/.test(normalized)) {
    items.push({
      name: 'water',
      quantity: /(glas|glazen|glass|glasses)/.test(normalized)
        ? extractQuantity(normalized, /(\d+)\s*(glas|glazen|glass|glasses)\s*(water)?/, 1) * 250
        : extractQuantity(normalized, /(\d+)\s*(ml)\s*(water)?/, 250),
      unit: 'ml',
      confidence: 0.91,
    });
  }

  if (/(sinaasappelsap|orange juice|jus)/.test(normalized)) {
    items.push({
      name: 'orange juice',
      quantity: /(glas|glazen|glass|glasses)/.test(normalized)
        ? extractQuantity(normalized, /(\d+)\s*(glas|glazen|glass|glasses)\s*(sinaasappelsap|orange juice|jus)?/, 1) * 250
        : extractQuantity(normalized, /(\d+)\s*(ml)\s*(sinaasappelsap|orange juice|jus)?/, 250),
      unit: 'ml',
      confidence: 0.9,
    });
  }

  if (/(cola zero|cola light|coca cola zero)/.test(normalized)) {
    items.push({
      name: 'cola zero',
      quantity: /(blik|blikken|can|cans)/.test(normalized)
        ? extractQuantity(normalized, /(\d+)\s*(blik|blikken|can|cans)\s*(cola zero|cola light|coca cola zero)?/, 1) * 330
        : extractQuantity(normalized, /(\d+)\s*(ml)\s*(cola zero|cola light|coca cola zero)?/, 330),
      unit: 'ml',
      confidence: 0.88,
    });
  }

  if (/(cola|frisdrank)/.test(normalized) && !/(cola zero|cola light|coca cola zero)/.test(normalized)) {
    items.push({
      name: 'cola',
      quantity: /(blik|blikken|can|cans|glas|glazen|glass|glasses)/.test(normalized)
        ? extractQuantity(normalized, /(\d+)\s*(blik|blikken|can|cans|glas|glazen|glass|glasses)\s*(cola|frisdrank)?/, 1) * 330
        : extractQuantity(normalized, /(\d+)\s*(ml)\s*(cola|frisdrank)?/, 330),
      unit: 'ml',
      confidence: 0.86,
    });
  }

  if (/(chocomel|chocolademelk|chocolate milk)/.test(normalized)) {
    items.push({
      name: 'chocolate milk',
      quantity: extractQuantity(normalized, /(\d+)\s*(ml)\s*(chocomel|chocolademelk|chocolate milk)/, 250),
      unit: 'ml',
      confidence: 0.87,
    });
  }

  if (/(chicken sandwich|kip sandwich|sandwich met kip|broodje kip)/.test(normalized)) {
    items.push({
      name: 'chicken sandwich',
      quantity: 1,
      unit: 'serving',
      confidence: 0.86,
    });
  }

  if (/(appel|apple)/.test(normalized)) {
    items.push({
      name: 'apple',
      quantity: extractQuantity(normalized, /(\d+)\s*(appel|apple)/, 1),
      unit: 'piece',
      confidence: 0.95,
    });
  }

  if (/(banaan|banana)/.test(normalized)) {
    items.push({
      name: 'banana',
      quantity: 1,
      unit: 'piece',
      confidence: 0.95,
    });
  }

  if (/(sinaasappel|orange)/.test(normalized)) {
    items.push({
      name: 'orange',
      quantity: extractQuantity(normalized, /(\d+)\s*(sinaasappel|orange)/, 1),
      unit: 'piece',
      confidence: 0.9,
    });
  }

  if (/(blauwe bessen|blueberries|blauwebessen)/.test(normalized)) {
    items.push({
      name: 'blueberries',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(blauwe bessen|blueberries|blauwebessen)/, 100),
      unit: 'gram',
      confidence: 0.86,
    });
  }

  if (/(aardbeien|strawberries)/.test(normalized)) {
    items.push({
      name: 'strawberries',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(aardbeien|strawberries)/, 100),
      unit: 'gram',
      confidence: 0.86,
    });
  }

  if (/(rijst|rice)/.test(normalized)) {
    items.push({
      name: 'rice',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(rijst|rice)/, 180),
      unit: 'gram',
      confidence: 0.84,
    });
  }

  if (/(pasta|spaghetti|penne|macaroni)/.test(normalized)) {
    items.push({
      name: 'pasta',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(pasta|spaghetti|penne|macaroni)/, 220),
      unit: 'gram',
      confidence: 0.8,
    });
  }

  if (/(pesto)/.test(normalized)) {
    items.push({
      name: 'pesto',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|eetlepel|tbsp)\s*(pesto)/, 35),
      unit: /(eetlepel|tbsp)/.test(normalized) ? 'tbsp' : 'gram',
      confidence: 0.74,
    });
  }

  if (/(zilvervliesrijst|brown rice)/.test(normalized)) {
    items.push({
      name: 'brown rice',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(zilvervliesrijst|brown rice)/, 180),
      unit: 'gram',
      confidence: 0.84,
    });
  }

  if (/(zalm|salmon)/.test(normalized)) {
    items.push({
      name: 'salmon',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(zalm|salmon)/, 160),
      unit: 'gram',
      confidence: 0.89,
    });
  }

  if (/(kipfilet|kip borst|chicken breast|kip)/.test(normalized) && !/(kipsandwich|kip sandwich|broodje kip)/.test(normalized)) {
    items.push({
      name: 'chicken breast',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(kipfilet|kip borst|chicken breast|kip)/, 150),
      unit: 'gram',
      confidence: 0.87,
    });
  }

  if (/(kalkoen|turkey)/.test(normalized)) {
    items.push({
      name: 'turkey slices',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|plak|plakken|slice|slices)\s*(kalkoen|turkey)/, 40),
      unit: /(plak|plakken|slice|slices)/.test(normalized) ? 'piece' : 'gram',
      confidence: 0.8,
    });
  }

  if (/(ham)/.test(normalized)) {
    items.push({
      name: 'ham',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|plak|plakken|slice|slices)\s*(ham)/, 30),
      unit: /(plak|plakken|slice|slices)/.test(normalized) ? 'piece' : 'gram',
      confidence: 0.8,
    });
  }

  if (/(tonijn|tuna)/.test(normalized)) {
    items.push({
      name: 'tuna',
      quantity: /(blik|blikken|can|cans)/.test(normalized)
        ? extractQuantity(normalized, /(\d+)\s*(blik|blikken|can|cans)\s*(tonijn|tuna)?/, 1) * 120
        : extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(tonijn|tuna)/, 120),
      unit: 'gram',
      confidence: 0.83,
    });
  }

  if (/(gehakt|beef mince|rundergehakt)/.test(normalized)) {
    items.push({
      name: 'beef mince',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(gehakt|beef mince|rundergehakt)/, 150),
      unit: 'gram',
      confidence: 0.82,
    });
  }

  if (/(groenten|vegetables|groente)/.test(normalized)) {
    items.push({
      name: 'vegetables',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(groenten|vegetables|groente)/, 150),
      unit: 'gram',
      confidence: 0.85,
    });
  }

  if (/(salade|salad)/.test(normalized) && !/(fruit salad)/.test(normalized)) {
    items.push({
      name: 'vegetables',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(salade|salad)/, 250),
      unit: 'gram',
      confidence: 0.72,
    });
  }

  if (/(broccoli)/.test(normalized)) {
    items.push({
      name: 'broccoli',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(broccoli)/, 150),
      unit: 'gram',
      confidence: 0.84,
    });
  }

  if (/(spinazie|spinach)/.test(normalized)) {
    items.push({
      name: 'spinach',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(spinazie|spinach)/, 150),
      unit: 'gram',
      confidence: 0.84,
    });
  }

  if (/(komkommer|cucumber)/.test(normalized)) {
    items.push({
      name: 'cucumber',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(komkommer|cucumber)/, 100),
      unit: 'gram',
      confidence: 0.83,
    });
  }

  if (/(tomaat|tomaten|tomato)/.test(normalized)) {
    items.push({
      name: 'tomato',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|tomaat|tomaten|tomato)/, 100),
      unit: /(gram|g)/.test(normalized) ? 'gram' : 'piece',
      confidence: 0.83,
    });
  }

  if (/(sla|lettuce)/.test(normalized)) {
    items.push({
      name: 'lettuce',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(sla|lettuce)/, 75),
      unit: 'gram',
      confidence: 0.8,
    });
  }

  if (/(ui|uien|onion)/.test(normalized)) {
    items.push({
      name: 'onion',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|ui|uien|onion)/, 80),
      unit: /(gram|g)/.test(normalized) ? 'gram' : 'piece',
      confidence: 0.8,
    });
  }

  if (/(wortel|wortelen|carrot)/.test(normalized)) {
    items.push({
      name: 'carrot',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|wortel|wortelen|carrot)/, 100),
      unit: /(gram|g)/.test(normalized) ? 'gram' : 'piece',
      confidence: 0.8,
    });
  }

  if (/(paprika|bell pepper)/.test(normalized)) {
    items.push({
      name: 'bell pepper',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|paprika|bell pepper)/, 100),
      unit: /(gram|g)/.test(normalized) ? 'gram' : 'piece',
      confidence: 0.8,
    });
  }

  if (/(aardappel|aardappelen|potato)/.test(normalized) && !/(zoete aardappel|sweet potato)/.test(normalized)) {
    items.push({
      name: 'potatoes',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(aardappel|aardappelen|potato)/, 200),
      unit: 'gram',
      confidence: 0.82,
    });
  }

  if (/(zoete aardappel|sweet potato)/.test(normalized)) {
    items.push({
      name: 'sweet potato',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(zoete aardappel|sweet potato)/, 200),
      unit: 'gram',
      confidence: 0.82,
    });
  }

  if (/(bonen|beans|kidneybonen)/.test(normalized)) {
    items.push({
      name: 'beans',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(bonen|beans|kidneybonen)/, 130),
      unit: 'gram',
      confidence: 0.8,
    });
  }

  if (/(linzen|lentils)/.test(normalized)) {
    items.push({
      name: 'lentils',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(linzen|lentils)/, 130),
      unit: 'gram',
      confidence: 0.8,
    });
  }

  if (/(kikkererwten|chickpeas)/.test(normalized)) {
    items.push({
      name: 'chickpeas',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(kikkererwten|chickpeas)/, 130),
      unit: 'gram',
      confidence: 0.8,
    });
  }

  if (/(protein yogurt|proteine yoghurt|eiwit yoghurt|protein yoghurt)/.test(normalized)) {
    items.push({
      name: 'protein yogurt',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(protein|proteine)/, 200),
      unit: 'gram',
      confidence: 0.87,
    });
  }

  if (/(griekse yoghurt|greek yogurt)/.test(normalized)) {
    items.push({
      name: 'greek yogurt',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(griekse yoghurt|greek yogurt)/, 200),
      unit: 'gram',
      confidence: 0.87,
    });
  }

  if (/(kwark|quark)/.test(normalized)) {
    items.push({
      name: 'quark',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(kwark|quark)/, 200),
      unit: 'gram',
      confidence: 0.87,
    });
  }

  if (/(yoghurt|yogurt)/.test(normalized) && !/(griekse yoghurt|greek yogurt|proteine yoghurt|protein yogurt|eiwit yoghurt)/.test(normalized)) {
    items.push({
      name: 'yogurt',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|ml)\s*(yoghurt|yogurt)/, 200),
      unit: /(ml)/.test(normalized) ? 'ml' : 'gram',
      confidence: 0.84,
    });
  }

  if (/(huttenkaas|hüttenkäse|cottage cheese)/.test(normalized)) {
    items.push({
      name: 'cottage cheese',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(huttenkaas|hüttenkäse|cottage cheese)/, 150),
      unit: 'gram',
      confidence: 0.83,
    });
  }

  if (/(havermout|oats)/.test(normalized)) {
    items.push({
      name: 'oats',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(havermout|oats)/, 60),
      unit: 'gram',
      confidence: 0.85,
    });
  }

  if (/(muesli)/.test(normalized)) {
    items.push({
      name: 'muesli',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(muesli)/, 50),
      unit: 'gram',
      confidence: 0.83,
    });
  }

  if (/(granola)/.test(normalized)) {
    items.push({
      name: 'granola',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(granola)/, 50),
      unit: 'gram',
      confidence: 0.83,
    });
  }

  if (/(whey|eiwitshake|proteineshake|proteinepoeder)/.test(normalized)) {
    items.push({
      name: 'whey protein',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|scoop|scoops|schep|scheppen)\s*(whey|eiwitshake|proteineshake|proteinepoeder)/, 30),
      unit: /(scoop|scoops|schep|scheppen)/.test(normalized) ? 'scoop' : 'gram',
      confidence: 0.86,
    });
  }

  if (/(ei|egg)/.test(normalized)) {
    items.push({
      name: 'egg',
      quantity: extractQuantity(normalized, /(\d+)\s*(ei|egg)/, 2),
      unit: 'piece',
      confidence: 0.85,
    });
  }

  if (/(avocado)/.test(normalized)) {
    items.push({
      name: 'avocado',
      quantity: 50,
      unit: 'gram',
      confidence: 0.82,
    });
  }

  if (/(amandelen|almonds)/.test(normalized)) {
    items.push({
      name: 'almonds',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|handje|handjes|handful)\s*(amandelen|almonds)/, 30),
      unit: /(handje|handjes|handful)/.test(normalized) ? 'handful' : 'gram',
      confidence: 0.82,
    });
  }

  if (/(walnoten|walnuts)/.test(normalized)) {
    items.push({
      name: 'walnuts',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|handje|handjes|handful)\s*(walnoten|walnuts)/, 30),
      unit: /(handje|handjes|handful)/.test(normalized) ? 'handful' : 'gram',
      confidence: 0.82,
    });
  }

  if (/(cashewnoten|cashews)/.test(normalized)) {
    items.push({
      name: 'cashews',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|handje|handjes|handful)\s*(cashewnoten|cashews)/, 30),
      unit: /(handje|handjes|handful)/.test(normalized) ? 'handful' : 'gram',
      confidence: 0.82,
    });
  }

  if (/(leverworst|liverwurst|leverpastei)/.test(normalized)) {
    items.push({
      name: 'liverwurst',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|grams|g)\s*(leverworst|liverwurst|leverpastei)/, 30),
      unit: 'gram',
      confidence: 0.79,
    });
  }

  if (/(stroopwafel|stroopwafels)/.test(normalized)) {
    items.push({
      name: 'stroopwafel',
      quantity: extractQuantity(normalized, /(\d+)\s*(stroopwafel|stroopwafels)/, 1),
      unit: 'piece',
      confidence: 0.83,
    });
  }

  if (/(rijstwafel|rijstwafels|rice cake|rice cakes)/.test(normalized)) {
    items.push({
      name: 'rice cakes',
      quantity: extractQuantity(normalized, /(\d+)\s*(rijstwafel|rijstwafels|rice cake|rice cakes)/, 2),
      unit: 'piece',
      confidence: 0.82,
    });
  }

  if (/(cracker|crackers)/.test(normalized)) {
    items.push({
      name: 'crackers',
      quantity: extractQuantity(normalized, /(\d+)\s*(cracker|crackers)/, 2),
      unit: 'piece',
      confidence: 0.82,
    });
  }

  if (/(wrap|wraps|tortilla)/.test(normalized)) {
    items.push({
      name: 'wrap',
      quantity: extractQuantity(normalized, /(\d+)\s*(wrap|wraps|tortilla)/, 1),
      unit: 'piece',
      confidence: 0.84,
    });
  }

  if (/(pokebowl|poke bowl|poké bowl)/.test(normalized)) {
    items.push({
      name: 'rice',
      quantity: 180,
      unit: 'gram',
      confidence: 0.66,
      searchAliases: ['poke bowl rice', 'pokebowl', 'poke bowl'],
    });
  }

  if (/(nasi|bami)/.test(normalized)) {
    items.push({
      name: 'rice',
      quantity: 250,
      unit: 'gram',
      confidence: 0.68,
      searchAliases: ['nasi', 'bami'],
    });
  }

  if (/(kaas|cheese)/.test(normalized) && !/(huttenkaas|hüttenkäse|cottage cheese)/.test(normalized)) {
    items.push({
      name: 'cheese',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|plak|plakken|slice|slices)\s*(kaas|cheese)/, 20),
      unit: /(plak|plakken|slice|slices)/.test(normalized) ? 'piece' : 'gram',
      confidence: 0.8,
    });
  }

  if (/(pastasaus|tomatensaus|pasta sauce)/.test(normalized)) {
    items.push({
      name: 'pasta sauce',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g|ml)\s*(pastasaus|tomatensaus|pasta sauce)/, 125),
      unit: /(ml)/.test(normalized) ? 'ml' : 'gram',
      confidence: 0.78,
    });
  }

  if (/(dressing)/.test(normalized)) {
    items.push({
      name: 'dressing',
      quantity: extractQuantity(normalized, /(\d+)\s*(ml|gram|g)\s*(dressing)/, 25),
      unit: /(ml)/.test(normalized) ? 'ml' : 'gram',
      confidence: 0.73,
    });
  }

  if (/(boter|butter)/.test(normalized)) {
    items.push({
      name: 'butter',
      quantity: extractQuantity(normalized, /(\d+)\s*(gram|g)\s*(boter|butter)/, 10),
      unit: 'gram',
      confidence: 0.74,
    });
  }

  if (/(eiwitreep|proteinebar|protein bar)/.test(normalized)) {
    items.push({
      name: 'protein bar',
      quantity: extractQuantity(normalized, /(\d+)\s*(eiwitreep|proteinebar|protein bar)/, 1),
      unit: 'piece',
      confidence: 0.82,
    });
  }

  return items;
};

export const transcribeAudioMock = async (_audioUri: string) => {
  const sentence = sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
  return new Promise<string>((resolve) => {
    setTimeout(() => resolve(sentence), 1500);
  });
};

export const parseMealTextMock = async (text: string): Promise<ParsedMeal> => {
  const items = parseKnownItems(text);
  const fallbackItems =
    items.length > 0
      ? items
      : [
          {
            name: 'bread',
            quantity: 2,
            unit: 'slices',
            confidence: 0.38,
          },
        ];

  return new Promise<ParsedMeal>((resolve) => {
    setTimeout(
      () =>
        resolve({
          mealType: detectMealType(text),
          items: fallbackItems,
          originalText: text,
          overallConfidence: 0.62,
          needsClarification: false,
          clarificationPriority: [],
          clarifications: [],
          templateKey: null,
        }),
      900,
    );
  });
};

// TODO: Plug in OpenAI transcription and parsing endpoints here.
export const aiService = {
  async transcribeAudio(audioUri: string) {
    if (!isSupabaseConfigured) {
      return transcribeAudioMock(audioUri);
    }

    return transcribeAudioWithOpenAI(audioUri);
  },
  async parseMealText(text: string, userId?: string | null) {
    const promptHintText = await mealCorrectionService.getPromptHintText(userId, text);
    const parsed = !isSupabaseConfigured ? await parseMealTextMock(text) : await parseMealTextWithOpenAI(text, promptHintText);
    const initiallyEnriched = mealClarificationService.enrichParsedMeal(parsed, text);
    const personalizationProfile = await mealCorrectionService.getPersonalizationProfile(
      userId,
      text,
      initiallyEnriched.templateKey,
      initiallyEnriched.items.map((item) => item.name),
    );

    return mealClarificationService.enrichParsedMeal(parsed, text, personalizationProfile);
  },
  async recalculateParsedMeal(
    parsedMeal: ParsedMeal,
    userId?: string | null,
    initialParsedMeal?: ParsedMeal,
    clarificationAnswers: ClarificationAnswer[] = [],
  ): Promise<AnalyzedMeal> {
    const items = await nutritionService.getNutritionForItems(parsedMeal.items, userId);
    return mealClarificationService.toAnalyzedMeal(parsedMeal, items, initialParsedMeal ?? parsedMeal, clarificationAnswers);
  },
  async replayClarifications(
    initialParsedMeal: ParsedMeal,
    actions: ClarificationAction[],
    userId?: string | null,
  ): Promise<AnalyzedMeal> {
    let workingParsedMeal = mealClarificationService.enrichParsedMeal(initialParsedMeal, initialParsedMeal.originalText);
    const appliedAnswers: ClarificationAnswer[] = [];

    for (const action of actions) {
      if (action.kind === 'skip') {
        workingParsedMeal = mealClarificationService.skipClarification(workingParsedMeal, action.questionId);
        const skippedQuestion = workingParsedMeal.clarifications.find((entry) => entry.id === action.questionId);

        appliedAnswers.push({
          questionId: action.questionId,
          itemIndex: skippedQuestion?.itemIndex ?? 0,
          itemName: skippedQuestion?.itemName ?? '',
          type: skippedQuestion?.type ?? 'portion_size',
          selectedOptionIds: [],
          selectedLabels: [],
          skipped: true,
          answeredAt: new Date().toISOString(),
        });
        continue;
      }

      const result = mealClarificationService.applyClarificationAnswer(workingParsedMeal, action.questionId, action.selectedOptionIds);
      workingParsedMeal = result.parsedMeal;
      appliedAnswers.push(result.answer);
    }

    return this.recalculateParsedMeal(workingParsedMeal, userId, initialParsedMeal, appliedAnswers);
  },
  async analyzeText(text: string, userId?: string | null): Promise<AnalyzedMeal> {
    const parsed = await this.parseMealText(text, userId);
    return this.recalculateParsedMeal(parsed, userId, parsed, []);
  },
  async applyClarificationAnswer(
    analysis: AnalyzedMeal,
    questionId: string,
    selectedOptionIds: string[],
    userId?: string | null,
  ): Promise<AnalyzedMeal> {
    const existingActions: ClarificationAction[] = analysis.clarificationAnswers
      .filter((entry) => entry.questionId !== questionId)
      .map((entry) =>
        entry.skipped
          ? {
              kind: 'skip' as const,
              questionId: entry.questionId,
            }
          : {
              kind: 'answer' as const,
              questionId: entry.questionId,
              selectedOptionIds: entry.selectedOptionIds,
            },
      );

    return this.replayClarifications(
      analysis.initialParsedMeal,
      [...existingActions, { kind: 'answer', questionId, selectedOptionIds }],
      userId,
    );
  },
  async skipClarificationQuestion(analysis: AnalyzedMeal, questionId: string, userId?: string | null): Promise<AnalyzedMeal> {
    const existingActions: ClarificationAction[] = analysis.clarificationAnswers
      .filter((entry) => entry.questionId !== questionId)
      .map((entry) =>
        entry.skipped
          ? {
              kind: 'skip' as const,
              questionId: entry.questionId,
            }
          : {
              kind: 'answer' as const,
              questionId: entry.questionId,
              selectedOptionIds: entry.selectedOptionIds,
            },
      );

    return this.replayClarifications(
      analysis.initialParsedMeal,
      [...existingActions, { kind: 'skip', questionId }],
      userId,
    );
  },
};
