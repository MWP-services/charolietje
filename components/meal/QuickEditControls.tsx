import { Pressable, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/common/SecondaryButton';
import { colors } from '@/constants/colors';
import { radii } from '@/constants/radii';

type PortionPreset = {
  label: string;
  quantity: number;
  unit?: string;
};

type QuickEditControlsProps = {
  presets: PortionPreset[];
  onDecrease: () => void;
  onIncrease: () => void;
  onPresetPress: (preset: PortionPreset) => void;
  onToggleManual: () => void;
  manualOpen: boolean;
  showManualToggle?: boolean;
  onDuplicate?: () => void;
  onRemove?: () => void;
  canRemove?: boolean;
};

export const QuickEditControls = ({
  presets,
  onDecrease,
  onIncrease,
  onPresetPress,
  onToggleManual,
  manualOpen,
  showManualToggle = true,
  onDuplicate,
  onRemove,
  canRemove = true,
}: QuickEditControlsProps) => (
  <View style={{ gap: 12 }}>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Pressable
        onPress={onDecrease}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 44,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}>
        <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_700Bold' }}>-</Text>
      </Pressable>
      <Pressable
        onPress={onIncrease}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 44,
          borderRadius: radii.pill,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}>
        <Text style={{ color: colors.text, fontSize: 22, fontFamily: 'Manrope_700Bold' }}>+</Text>
      </Pressable>
    </View>

    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {presets.map((preset) => (
        <Pressable
          key={`${preset.label}-${preset.quantity}-${preset.unit ?? ''}`}
          onPress={() => onPresetPress(preset)}
          style={({ pressed }) => ({
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: radii.pill,
            backgroundColor: colors.surfaceMuted,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.88 : 1,
          })}>
          <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Manrope_700Bold' }}>{preset.label}</Text>
        </Pressable>
      ))}
    </View>

    {showManualToggle ? <SecondaryButton label={manualOpen ? 'Klaar met aanpassen' : 'Waardes aanpassen'} onPress={onToggleManual} /> : null}

    {onDuplicate || onRemove ? (
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {onDuplicate ? (
          <View style={{ flex: 1 }}>
            <SecondaryButton label="Item dupliceren" onPress={onDuplicate} />
          </View>
        ) : null}
        {onRemove ? (
          <View style={{ flex: 1 }}>
            <SecondaryButton label={canRemove ? 'Item verwijderen' : 'Minstens 1 item nodig'} onPress={onRemove} disabled={!canRemove} />
          </View>
        ) : null}
      </View>
    ) : null}
  </View>
);
