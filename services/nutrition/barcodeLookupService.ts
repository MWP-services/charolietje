import type { AnalyzedMeal } from '@/types/meal';

const round = (value: number) => Math.round(value * 10) / 10;

const readNumeric = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const toMilligrams = (value: number, unit: 'mg' | 'g' = 'mg') => (unit === 'g' ? value * 1000 : value);

const parseServingSize = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase().replace(',', '.');
  const weightMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(g|gram|grams|ml|milliliter|milliliters)/);
  if (weightMatch) {
    const quantity = Number(weightMatch[1]);
    const rawUnit = weightMatch[2];
    return {
      quantity,
      unit: rawUnit.startsWith('m') ? 'ml' : 'gram',
    } as const;
  }

  if (/(piece|pieces|stuk|stuks|bar|reep|serving|portion)/.test(normalized)) {
    return { quantity: 1, unit: 'piece' as const };
  }

  return null;
};

const buildNutrients = (
  nutriments: Record<string, unknown>,
  suffix: '_serving' | '_100g' | '_100ml',
  multiplier: number,
) => ({
  calories: round(readNumeric(nutriments[`energy-kcal${suffix}`]) * multiplier),
  protein: round(readNumeric(nutriments[`proteins${suffix}`]) * multiplier),
  carbs: round(readNumeric(nutriments[`carbohydrates${suffix}`]) * multiplier),
  fat: round(readNumeric(nutriments[`fat${suffix}`]) * multiplier),
  fiber: round(readNumeric(nutriments[`fiber${suffix}`]) * multiplier),
  sugar: round(readNumeric(nutriments[`sugars${suffix}`]) * multiplier),
  sodium: round(
    toMilligrams(readNumeric(nutriments[`sodium${suffix}`])) ||
      toMilligrams(readNumeric(nutriments[`salt${suffix}`]) / 2.5, 'g'),
  ),
});

export const barcodeLookupService = {
  async lookupBarcode(barcode: string): Promise<AnalyzedMeal> {
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) {
      throw new Error('Voer eerst een barcode in.');
    }

    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(trimmedBarcode)}.json`);
    if (!response.ok) {
      throw new Error(`Barcode lookup mislukt (${response.status}).`);
    }

    const data = (await response.json()) as {
      status?: number;
      product?: {
        product_name?: string;
        serving_size?: string | null;
        nutriments?: Record<string, unknown>;
      };
    };

    if (data.status !== 1 || !data.product?.nutriments) {
      throw new Error('Geen product gevonden voor deze barcode.');
    }

    const productName = data.product.product_name?.trim() || `Product ${trimmedBarcode}`;
    const nutriments = data.product.nutriments;
    const parsedServing = parseServingSize(data.product.serving_size);
    const caloriesPerServing = readNumeric(nutriments['energy-kcal_serving']);
    const caloriesPer100ml = readNumeric(nutriments['energy-kcal_100ml']);
    const caloriesPer100g = readNumeric(nutriments['energy-kcal_100g']);

    let quantity = 1;
    let unit: 'serving' | 'gram' | 'ml' | 'piece' = 'serving';
    let nutrients = buildNutrients(nutriments, '_serving', 1);

    if (caloriesPerServing) {
      quantity = parsedServing?.quantity ?? 1;
      unit = parsedServing?.unit ?? 'serving';
    } else if (parsedServing && caloriesPer100ml) {
      quantity = parsedServing.quantity;
      unit = 'ml';
      nutrients = buildNutrients(nutriments, '_100ml', quantity / 100);
    } else if (parsedServing && caloriesPer100g) {
      quantity = parsedServing.quantity;
      unit = parsedServing.unit === 'ml' ? 'gram' : parsedServing.unit;
      nutrients = buildNutrients(nutriments, '_100g', quantity / 100);
    } else if (caloriesPer100ml) {
      quantity = 100;
      unit = 'ml';
      nutrients = buildNutrients(nutriments, '_100ml', 1);
    } else if (caloriesPer100g) {
      quantity = 100;
      unit = 'gram';
      nutrients = buildNutrients(nutriments, '_100g', 1);
    } else {
      throw new Error('Voor dit product ontbreken bruikbare voedingswaarden.');
    }

    return {
      mealType: 'unknown',
      originalText: `${productName} gescand via barcode`,
      items: [
        {
          name: productName,
          quantity,
          unit,
          confidence: 0.99,
          ...nutrients,
          nutritionSource: 'matched',
        },
      ],
      totals: nutrients,
    };
  },
};
