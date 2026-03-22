import { View } from 'react-native';

import { FormField } from '@/components/common/FormField';
import type { NutrientKey, OptionalNutrients } from '@/types/nutrition';

type NutritionInputsProps = {
  values: OptionalNutrients;
  onChange: (key: NutrientKey, value: number | null) => void;
};

const inputConfig: Array<{ key: NutrientKey; label: string; placeholder: string }> = [
  { key: 'calories', label: 'Calorieen', placeholder: 'Bijv. 120' },
  { key: 'protein', label: 'Eiwit (g)', placeholder: 'Bijv. 8' },
  { key: 'carbs', label: 'Koolhydraten (g)', placeholder: 'Bijv. 15' },
  { key: 'fat', label: 'Vet (g)', placeholder: 'Bijv. 4' },
  { key: 'fiber', label: 'Vezels (g)', placeholder: 'Bijv. 3' },
  { key: 'sugar', label: 'Suiker (g)', placeholder: 'Bijv. 6' },
  { key: 'sodium', label: 'Natrium (mg)', placeholder: 'Bijv. 120' },
];

export const NutritionInputs = ({ values, onChange }: NutritionInputsProps) => (
  <View style={{ gap: 12 }}>
    {inputConfig.map((field) => (
      <FormField
        key={field.key}
        inputMode="decimal"
        keyboardType="numeric"
        label={field.label}
        onChangeText={(value) => {
          const trimmed = value.trim();
          if (!trimmed) {
            onChange(field.key, null);
            return;
          }

          const parsed = Number(trimmed);
          onChange(field.key, Number.isFinite(parsed) ? parsed : null);
        }}
        placeholder={field.placeholder}
        value={values[field.key] === null ? '' : String(values[field.key])}
      />
    ))}
  </View>
);
