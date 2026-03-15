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

export const generatePremiumAdviceMock = async (input: PremiumAdviceInput): Promise<PremiumAdvice> => {
  const lowProtein =
    input.proteinTarget !== null && input.dailyTotals.protein < Math.round(input.proteinTarget * 0.75);
  const highCalories =
    input.calorieTarget !== null && input.dailyTotals.calories > Math.round(input.calorieTarget * 1.08);
  const lowFiber = input.dailyTotals.fiber < 25;
  const eveningSnackCount = input.recentMeals.filter((meal) => meal.meal_type === 'snack').length;

  const advice: PremiumAdvice = {
    summary:
      input.goal === 'build_muscle'
        ? 'Vandaag ziet er over het algemeen sterk uit, maar er is nog ruimte om je eiwitverdeling en calorie-ondersteuning te verbeteren.'
        : input.goal === 'lose_weight'
          ? 'Je dag ontwikkelt zich goed, met een paar duidelijke kansen rond verzadiging en caloriedichtheid.'
          : 'Je dag oogt redelijk in balans, met kleine aanpassingen die regelmaat en herstel kunnen verbeteren.',
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
      eveningSnackCount >= 2 ? 'Een groot deel van je inname komt uit snacks, waardoor je dag minder bewust kan aanvoelen.' : '',
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
