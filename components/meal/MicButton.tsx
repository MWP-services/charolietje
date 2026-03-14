import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { colors } from '@/constants/colors';

type MicButtonProps = {
  isRecording: boolean;
  onPress: () => void;
};

export const MicButton = ({ isRecording, onPress }: MicButtonProps) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isRecording) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isRecording, pulse]);

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Animated.View
        style={{
          width: 128,
          height: 128,
          borderRadius: 64,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isRecording ? '#FFEEF1' : colors.primarySoft,
          borderWidth: 10,
          borderColor: isRecording ? '#FFD7DF' : '#E7FBF0',
          transform: [{ scale: pulse }],
        }}>
        <View
          style={{
            width: 92,
            height: 92,
            borderRadius: 46,
            backgroundColor: isRecording ? colors.danger : colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.shadow,
            shadowOpacity: 1,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
          }}>
          <Ionicons color={colors.surface} name={isRecording ? 'stop' : 'mic'} size={34} />
        </View>
      </Animated.View>
    </Pressable>
  );
};
