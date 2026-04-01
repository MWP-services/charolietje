import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { colors } from '@/constants/colors';
import type { MealClarificationQuestion } from '@/types/meal';

type ClarificationCardProps = {
  question: MealClarificationQuestion;
  isLoading?: boolean;
  initialSelectedOptionIds?: string[];
  confirmLabel?: string;
  onConfirm: (selectedOptionIds: string[]) => void;
  onSkip: () => void;
};

const helperCopy: Record<MealClarificationQuestion['type'], string> = {
  meal_size: 'Dit helpt ons om alle onderdelen van de maaltijd in één keer slimmer te schalen.',
  portion_size: 'Een snelle keuze is genoeg. We passen daarna direct de voedingsinschatting aan.',
  quantity: 'Kies de optie die het dichtst bij je echte portie zat.',
  preparation_method: 'Bereiding maakt vaak veel verschil voor kcal en vet.',
  hidden_calories: 'Selecteer alles wat van toepassing is. Twijfel? Kies dan "Niet zeker".',
  source_context: 'Herkomst helpt bij een betere standaardinschatting voor portie en extra\'s.',
};

export const ClarificationCard = ({ question, isLoading, initialSelectedOptionIds, confirmLabel, onConfirm, onSkip }: ClarificationCardProps) => {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedOptionIds(initialSelectedOptionIds ?? []);
  }, [initialSelectedOptionIds, question.id]);

  return (
    <Card style={{ gap: 14 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ color: colors.primaryDark, fontSize: 12, fontFamily: 'Manrope_700Bold' }}>SNELLE CHECK</Text>
        <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_800ExtraBold' }}>{question.question}</Text>
        <Text style={{ color: colors.textSecondary, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>{helperCopy[question.type]}</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {question.options.map((option) => {
          const isSelected = selectedOptionIds.includes(option.id);

          return (
            <Pressable
              key={option.id}
              onPress={() =>
                setSelectedOptionIds((current) => {
                  if (question.selectionMode === 'multiple') {
                    return isSelected ? current.filter((value) => value !== option.id) : [...current, option.id];
                  }

                  return isSelected ? [] : [option.id];
                })
              }
              style={({ pressed }) => ({
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primarySoft : colors.surfaceMuted,
                opacity: pressed ? 0.92 : 1,
              })}>
              <Text style={{ color: isSelected ? colors.primaryDark : colors.textSecondary, fontFamily: 'Manrope_700Bold' }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        disabled={!selectedOptionIds.length}
        label={confirmLabel ?? 'Werk inschatting bij'}
        loading={isLoading}
        onPress={() => onConfirm(selectedOptionIds)}
      />
      <SecondaryButton label="Gebruik standaardinschatting" onPress={onSkip} disabled={isLoading} />
    </Card>
  );
};
