import type { GoalType } from '@/types/profile';

export const formatCalories = (value: number | null) => (value === null ? 'Onbekend' : `${Math.round(value)} kcal`);

export const formatGrams = (value: number | null) => (value === null ? 'Onbekend' : `${Math.round(value)} g`);

export const formatMilligrams = (value: number | null) => (value === null ? 'Onbekend' : `${Math.round(value)} mg`);

export const formatNutrientValue = (label: string, value: number | null) => {
  if (label.toLowerCase() === 'sodium') {
    return formatMilligrams(value);
  }

  if (label.toLowerCase() === 'calories') {
    return formatCalories(value);
  }

  return formatGrams(value);
};

export const formatMealType = (mealType: string) => {
  switch (mealType) {
    case 'breakfast':
      return 'Ontbijt';
    case 'lunch':
      return 'Lunch';
    case 'dinner':
      return 'Avondeten';
    case 'snack':
      return 'Snack';
    default:
      return 'Onbekend';
  }
};

export const formatGoal = (goal: GoalType) => {
  switch (goal) {
    case 'lose_weight':
      return 'Afvallen';
    case 'build_muscle':
      return 'Spieren opbouwen';
    default:
      return 'Gewicht behouden';
  }
};

export const formatFoodName = (name: string) => {
  switch (name.toLowerCase()) {
    case 'bread':
      return 'Brood';
    case 'peanut butter':
      return 'Pindakaas';
    case 'semi-skimmed milk':
      return 'Halfvolle melk';
    case 'skim milk':
      return 'Magere melk';
    case 'black coffee':
      return 'Zwarte koffie';
    case 'coffee with milk':
      return 'Koffie met melk';
    case 'tea':
      return 'Thee';
    case 'water':
      return 'Water';
    case 'orange juice':
      return 'Sinaasappelsap';
    case 'cola':
      return 'Cola';
    case 'cola zero':
      return 'Cola zero';
    case 'chocolate milk':
      return 'Chocolademelk';
    case 'chicken sandwich':
      return 'Kipsandwich';
    case 'apple':
      return 'Appel';
    case 'banana':
      return 'Banaan';
    case 'orange':
      return 'Sinaasappel';
    case 'blueberries':
      return 'Blauwe bessen';
    case 'strawberries':
      return 'Aardbeien';
    case 'rice':
      return 'Rijst';
    case 'brown rice':
      return 'Zilvervliesrijst';
    case 'potatoes':
      return 'Aardappelen';
    case 'sweet potato':
      return 'Zoete aardappel';
    case 'chicken breast':
      return 'Kipfilet';
    case 'turkey slices':
      return 'Kalkoenfilet';
    case 'ham':
      return 'Ham';
    case 'tuna':
      return 'Tonijn';
    case 'beef mince':
      return 'Rundergehakt';
    case 'salmon':
      return 'Zalm';
    case 'vegetables':
      return 'Groenten';
    case 'broccoli':
      return 'Broccoli';
    case 'spinach':
      return 'Spinazie';
    case 'cucumber':
      return 'Komkommer';
    case 'tomato':
      return 'Tomaat';
    case 'lettuce':
      return 'Sla';
    case 'onion':
      return 'Ui';
    case 'carrot':
      return 'Wortel';
    case 'bell pepper':
      return 'Paprika';
    case 'beans':
      return 'Bonen';
    case 'lentils':
      return 'Linzen';
    case 'chickpeas':
      return 'Kikkererwten';
    case 'yogurt':
      return 'Yoghurt';
    case 'greek yogurt':
      return 'Griekse yoghurt';
    case 'quark':
      return 'Kwark';
    case 'cottage cheese':
      return 'Huttenkase';
    case 'protein yogurt':
      return 'Proteineyoghurt';
    case 'oats':
      return 'Havermout';
    case 'muesli':
      return 'Muesli';
    case 'granola':
      return 'Granola';
    case 'whey protein':
      return 'Whey proteine';
    case 'egg':
      return 'Ei';
    case 'avocado':
      return 'Avocado';
    case 'almonds':
      return 'Amandelen';
    case 'walnuts':
      return 'Walnoten';
    case 'cashews':
      return 'Cashewnoten';
    case 'pasta':
      return 'Pasta';
    case 'wrap':
      return 'Wrap';
    case 'rice cakes':
      return 'Rijstwafels';
    case 'crackers':
      return 'Crackers';
    case 'cheese':
      return 'Kaas';
    case 'extra cheese':
      return 'Extra kaas';
    case 'protein bar':
      return 'Eiwitreep';
    case 'pasta sauce':
      return 'Pastasaus';
    case 'extra sauce':
      return 'Extra saus';
    case 'dressing':
      return 'Dressing';
    case 'extra dressing':
      return 'Extra dressing';
    case 'olive oil':
      return 'Olijfolie';
    case 'extra oil':
      return 'Extra olie';
    case 'butter':
      return 'Boter';
    case 'extra butter':
      return 'Extra boter';
    case 'liverwurst':
      return 'Leverworst';
    case 'stroopwafel':
      return 'Stroopwafel';
    default:
      return name;
  }
};

export const formatUnit = (unit: string) => {
  switch (unit.toLowerCase()) {
    case 'slice':
    case 'slices':
      return 'sneetjes';
    case 'piece':
      return 'stuk';
    case 'gram':
      return 'gram';
    case 'ml':
      return 'ml';
    case 'serving':
      return 'portie';
    case 'cup':
      return 'kop';
    case 'glass':
      return 'glas';
    case 'mug':
      return 'mok';
    case 'bowl':
      return 'kom';
    case 'handful':
      return 'handje';
    case 'scoop':
      return 'schep';
    case 'can':
      return 'blik';
    case 'bottle':
      return 'fles';
    case 'pot':
      return 'pot';
    case 'pack':
      return 'pak';
    default:
      return unit;
  }
};
