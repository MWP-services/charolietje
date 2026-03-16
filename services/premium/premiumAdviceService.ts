import type { PremiumAdvice, PremiumAdviceInput } from '@/types/premium';

const suggestionForGoal = (input: PremiumAdviceInput) => {
  switch (input.goal) {
    case 'lose_weight':
      return [
        'Houd je avondeten rijk aan eiwitten en groenten om vol te blijven met een slimme calorie-inname.',
        'Plan bewust een avondsnack als laat op de avond snaaien vaak een valkuil is.',
      ];
    case 'build_muscle':
      return [
        'Verdeel je eiwitten gelijkmatiger over de dag zodat elke maaltijd spieropbouw ondersteunt.',
        'Als je calorieen in de namiddag laag blijven, voeg dan een voedzame snack toe zoals yoghurt, havermout of een sandwich.',
      ];
    default:
      return [
        'Streef naar een stabiel ritme met eiwitten, groenten of fruit en vezels in elke hoofdmaaltijd.',
        'Regelmaat wint van perfectie, dus herhaal maaltijden die makkelijk te loggen en vol te houden zijn.',
      ];
  }
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getNextMealFocus = (input: PremiumAdviceInput, lowProtein: boolean, lowFiber: boolean, highCalories: boolean) => {
  if (input.goal === 'build_muscle') {
    return lowProtein
      ? 'Maak je volgende maaltijd eiwitrijk met bijvoorbeeld kwark, eieren, kip, tofu of zalm.'
      : 'Gebruik je volgende maaltijd om eiwit met koolhydraten te combineren zodat herstel en spiergroei ondersteund blijven.';
  }

  if (input.goal === 'lose_weight') {
    return highCalories
      ? 'Houd je volgende maaltijd simpel: een grote portie groente, een magere eiwitbron en een duidelijke portie koolhydraten.'
      : lowFiber
        ? 'Voeg bij je volgende maaltijd extra volume toe met fruit, volkoren producten of peulvruchten voor meer verzadiging.'
        : 'Bewaar je ritme met een verzadigende maaltijd die eiwit en vezels combineert.';
  }

  return lowFiber
    ? 'Je volgende maaltijd is een goed moment om vezels aan te vullen met fruit, volkoren granen of peulvruchten.'
    : 'Kies voor een volgende maaltijd die je huidige balans vasthoudt met eiwit, groente en een rustige portie koolhydraten.';
};

const getScoreLabel = (score: number) => {
  if (score >= 85) {
    return 'Sterke dag';
  }

  if (score >= 70) {
    return 'Goede basis';
  }

  return 'Werk in uitvoering';
};

export const generatePremiumAdviceMock = async (input: PremiumAdviceInput): Promise<PremiumAdvice> => {
  const lowProtein =
    input.proteinTarget !== null && input.dailyTotals.protein < Math.round(input.proteinTarget * 0.75);
  const highCalories =
    input.calorieTarget !== null && input.dailyTotals.calories > Math.round(input.calorieTarget * 1.08);
  const lowFiber = input.dailyTotals.fiber < 25;
  const todaysMeals = input.recentMeals.filter((meal) => meal.date === input.dailyTotals.date);
  const mealCount = todaysMeals.length;
  const snackCount = todaysMeals.filter((meal) => meal.meal_type === 'snack').length;
  const proteinMomentum = input.proteinTarget ? input.dailyTotals.protein / input.proteinTarget : input.dailyTotals.protein / 110;
  const baseScore =
    62 +
    (proteinMomentum >= 0.75 ? 14 : proteinMomentum >= 0.5 ? 6 : -8) +
    (input.dailyTotals.fiber >= 25 ? 10 : input.dailyTotals.fiber >= 18 ? 4 : -6) +
    (mealCount >= 3 ? 8 : mealCount === 2 ? 2 : -6) +
    (highCalories ? -10 : 6) +
    (snackCount >= 2 ? -6 : 4);
  const coachScore = clamp(Math.round(baseScore), 32, 96);
  const checklist = [
    proteinMomentum >= 0.75 ? 'Eiwit ligt op koers voor je dagdoel.' : 'Voeg nog een duidelijk eiwitmoment toe.',
    input.dailyTotals.fiber >= 25 ? 'Je vezeldoel ziet er sterk uit.' : 'Plan nog een vezelrijke keuze voor later vandaag.',
    snackCount <= 1 ? 'Je maaltijdritme blijft overzichtelijk.' : 'Breng je snacks terug naar een bewuster moment.',
  ];

  const advice: PremiumAdvice = {
    coach_score: coachScore,
    score_label: getScoreLabel(coachScore),
    summary:
      input.goal === 'build_muscle'
        ? 'Vandaag ziet er over het algemeen sterk uit, met vooral winst te halen in eiwitverdeling en voldoende energiebeschikbaarheid.'
        : input.goal === 'lose_weight'
          ? 'Je dag ontwikkelt zich goed, met een paar duidelijke kansen rond verzadiging, porties en slimme caloriekeuzes.'
          : 'Je dag oogt redelijk in balans, met kleine aanpassingen die regelmaat, herstel en voedingskwaliteit kunnen verbeteren.',
    pattern_summary:
      mealCount <= 1
        ? 'Je hebt vandaag nog weinig maaltijdmomenten gelogd. Meer ritme maakt coaching nauwkeuriger en helpt energiedips voorkomen.'
        : snackCount >= 2
          ? 'Je dag bevat meerdere snackmomenten. Meer structuur in hoofdmaaltijden kan honger en impulsieve keuzes verlagen.'
          : input.dailyTotals.fiber >= 25
            ? 'Je dag laat een mooie combinatie zien van structuur en vezels, wat meestal helpt bij verzadiging en energiebalans.'
            : 'Je dag is bruikbaar als basis, maar extra vezels en een duidelijke eiwitverdeling maken hem sterker.',
    next_meal_focus: getNextMealFocus(input, lowProtein, lowFiber, highCalories),
    checklist,
    strengths: [
      input.dailyTotals.protein >= 100
        ? 'Je hebt vandaag al een sterke eiwitbasis gelegd.'
        : 'Je hebt in elk geval een maaltijd met eiwitten genomen, en dat is een goede basis om op verder te bouwen.',
      input.dailyTotals.fiber >= 20
        ? 'Je vezelinname gaat duidelijk de goede kant op.'
        : 'Je logt verschillende maaltijden in plaats van grote delen van de dag over te slaan.',
    ],
    improvements: [
      lowProtein
        ? 'Je eiwitinname ligt nog onder je doel. Voeg vanavond een eiwitrijke snack of grotere eiwitportie toe.'
        : 'Gebruik je volgende maaltijd om je eiwitmomentum vast te houden in plaats van alles op het laatste eetmoment te laten aankomen.',
      lowFiber
        ? 'Je vezelinname is vandaag nog laag. Havermout, fruit, peulvruchten of volkoren brood verbeteren verzadiging en balans.'
        : 'Je kunt de voedingsvariatie vergroten door een tweede bron van fruit of groente toe te voegen.',
    ],
    warnings: [
      highCalories ? 'Je calorieen lopen boven je doel uit, dus portiegrootte en energierijke extra\'s verdienen aandacht.' : '',
      snackCount >= 2 ? 'Een groot deel van je inname komt uit snacks, waardoor je dag minder bewust kan aanvoelen.' : '',
    ].filter(Boolean),
    goal_specific_tips: suggestionForGoal(input),
  };

  return new Promise<PremiumAdvice>((resolve) => {
    setTimeout(() => resolve(advice), 900);
  });
};

// TODO: Replace this with an LLM-backed coaching endpoint that uses richer meal history.
export const premiumAdviceService = {
  generateAdvice: generatePremiumAdviceMock,
};
