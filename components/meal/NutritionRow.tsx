import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { AnalyzedMealItem } from '@/types/meal';
import { formatCalories, formatFoodName, formatUnit } from '@/utils/formatting';
import { hasCompleteNutrition } from '@/utils/nutrition';

type NutritionRowProps = {
  item: AnalyzedMealItem;
};

export const NutritionRow = ({ item }: NutritionRowProps) => (
  <View
    style={{
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 6,
    }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
      <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Manrope_700Bold', flex: 1 }}>{formatFoodName(item.name)}</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>{formatCalories(item.calories)}</Text>
    </View>
    {hasCompleteNutrition(item) ? (
      <Text style={{ color: item.nutritionSource === 'estimated' ? colors.warning : colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>
        {item.quantity} {formatUnit(item.unit)} - {Math.round(item.protein ?? 0)}g eiwit - {Math.round(item.carbs ?? 0)}g koolhydraten - {Math.round(item.fat ?? 0)}g vet
        {item.nutritionSource === 'estimated' ? ' - AI-inschatting, even controleren' : ''}
      </Text>
    ) : (
      <Text style={{ color: colors.danger, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
        {item.quantity} {formatUnit(item.unit)} - voedingswaarde onbekend, handmatig invullen nodig
      </Text>
    )}
  </View>
);
