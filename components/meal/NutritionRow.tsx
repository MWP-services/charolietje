import { Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { AnalyzedMealItem } from '@/types/meal';
import { formatCalories } from '@/utils/formatting';

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
      <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Manrope_700Bold', flex: 1 }}>{item.name}</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>{formatCalories(item.calories)}</Text>
    </View>
    <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_500Medium' }}>
      {item.quantity} {item.unit} • {Math.round(item.protein)}g protein • {Math.round(item.carbs)}g carbs • {Math.round(item.fat)}g fat
    </Text>
  </View>
);
