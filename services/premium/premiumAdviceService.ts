import type { PremiumAdvice, PremiumAdviceInput } from '@/types/premium';

const suggestionForGoal = (input: PremiumAdviceInput) => {
  switch (input.goal) {
    case 'lose_weight':
      return [
        'Keep dinner high in protein and vegetables to stay full while keeping calories efficient.',
        'Plan a deliberate evening snack if late-night grazing is a common trigger.',
      ];
    case 'build_muscle':
      return [
        'Spread protein more evenly across the day so each meal supports muscle protein synthesis.',
        'If calories stay low by late afternoon, add a dense snack like yogurt, oats, or a sandwich.',
      ];
    default:
      return [
        'Aim for a stable rhythm with protein, produce, and fiber in each main meal.',
        'Consistency beats perfection, so keep repeating meals that are easy to log and easy to stick with.',
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
        ? 'Today looks solid overall, but there is still room to improve protein distribution and calorie support.'
        : input.goal === 'lose_weight'
          ? 'Your day is trending well, with a few leverage points around satiety and calorie density.'
          : 'Your day looks fairly balanced, with small tweaks that can improve consistency and recovery.',
    strengths: [
      input.dailyTotals.protein >= 100
        ? 'You already have a strong protein foundation today.'
        : 'You have at least one protein-containing meal in the day, which is a good base to build on.',
      input.dailyTotals.fiber >= 20
        ? 'Fiber intake is moving in the right direction.'
        : 'You are logging a mix of meals instead of skipping large parts of the day.',
    ],
    improvements: [
      lowProtein
        ? 'Protein is still below target. Add a protein-forward snack or stronger protein portion this evening.'
        : 'Use the next meal to keep protein momentum going instead of letting the last meal carry the whole day.',
      lowFiber
        ? 'Fiber is light today. Oats, fruit, legumes, or whole grain bread would improve fullness and balance.'
        : 'You can improve nutrient variety by rotating in a second fruit or vegetable source.',
    ],
    warnings: [
      highCalories ? 'Calories are drifting above target, so portion size and energy-dense extras deserve attention.' : '',
      eveningSnackCount >= 2 ? 'A large share of intake is coming from snacks, which may make your day feel less intentional.' : '',
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
