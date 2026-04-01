import { Text, View } from 'react-native';

import { Tag } from '@/components/common/Tag';
import { colors } from '@/constants/colors';
import type { AnalyzedMealItem } from '@/types/meal';
import { formatCalories, formatFoodName, formatQuantityWithUnit } from '@/utils/formatting';
import { hasCompleteNutrition } from '@/utils/nutrition';

type NutritionRowProps = {
  item: AnalyzedMealItem;
};

const getStatusMeta = (item: AnalyzedMealItem) => {
  if (item.nutritionSource === 'manual') {
    return { label: 'Aangepast', tone: 'primary' as const };
  }

  if (item.nutritionSource === 'estimated') {
    return { label: 'AI-inschatting', tone: 'warning' as const };
  }

  if (item.needsClarification) {
    return { label: 'Even nalopen', tone: 'warning' as const };
  }

  return null;
};

export const NutritionRow = ({ item }: NutritionRowProps) => {
  const statusMeta = getStatusMeta(item);

  return (
    <View
      style={{
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 8,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>{formatFoodName(item.name)}</Text>
          {statusMeta ? <Tag label={statusMeta.label} tone={statusMeta.tone} /> : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_800ExtraBold' }}>{formatCalories(item.calories)}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'Manrope_600SemiBold' }}>
            {formatQuantityWithUnit(item.quantity, item.unit, item.estimatedGrams)}
          </Text>
        </View>
      </View>
      {hasCompleteNutrition(item) ? (
        <>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: 'Manrope_600SemiBold' }}>
            {Math.round(item.protein ?? 0)}g eiwit • {Math.round(item.carbs ?? 0)}g koolhydraten • {Math.round(item.fat ?? 0)}g vet
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, fontFamily: 'Manrope_500Medium' }}>
            Vezels {Math.round(item.fiber ?? 0)}g • Suiker {Math.round(item.sugar ?? 0)}g • Natrium {Math.round(item.sodium ?? 0)}mg
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.danger, fontSize: 13, fontFamily: 'Manrope_600SemiBold' }}>
          Voedingswaarde ontbreekt nog. Vul de waardes hieronder aan om een betrouwbare schatting te bewaren.
        </Text>
      )}
    </View>
  );
};
