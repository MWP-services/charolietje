import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { Tag } from '@/components/common/Tag';
import { colors } from '@/constants/colors';
import type { MealWithItems } from '@/types/meal';
import { formatCalories, formatMealType } from '@/utils/formatting';

type MealCardProps = {
  meal: MealWithItems;
  onPress: () => void;
};

export const MealCard = ({ meal, onPress }: MealCardProps) => (
  <Pressable accessibilityRole="button" onPress={onPress}>
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tag label={formatMealType(meal.meal_type)} tone="primary" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons color={colors.textMuted} name="flash-outline" size={16} />
          <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Manrope_700Bold' }}>{formatCalories(meal.total_calories)}</Text>
        </View>
      </View>
      <Text numberOfLines={2} style={{ color: colors.text, fontSize: 16, lineHeight: 24, fontFamily: 'Manrope_700Bold' }}>
        {meal.original_text}
      </Text>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
          {Math.round(meal.total_protein)}g protein
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
          {meal.items.length} items
        </Text>
      </View>
    </Card>
  </Pressable>
);
