import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FadeInView } from '@/components/common/FadeInView';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { MicButton } from '@/components/meal/MicButton';
import { TranscriptionEditor } from '@/components/meal/TranscriptionEditor';
import { colors } from '@/constants/colors';
import { aiService } from '@/services/ai/aiService';
import { useMealStore } from '@/store/mealStore';

export default function VoiceLogMealScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { draftText, setDraftText, analyzeDraft, isAnalyzing, clearDraft, error, clearError } = useMealStore();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastAudioUri, setLastAudioUri] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const isTypedMode = mode === 'typed';

  const startRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone permission', 'NutriVoice needs microphone access to record your meal.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const nextRecording = new Audio.Recording();
      await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await nextRecording.startAsync();
      setRecording(nextRecording);
      setSeconds(0);
      timerRef.current = setInterval(() => {
        setSeconds((value) => value + 1);
      }, 1000);
    } catch (error) {
      Alert.alert('Recording error', error instanceof Error ? error.message : 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (!uri) {
        return;
      }
      setLastAudioUri(uri);
      setIsTranscribing(true);
      clearError();
      setTranscriptionError(null);
      const transcription = await aiService.transcribeAudio(uri);
      setDraftText(transcription);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not transcribe recording.';
      setTranscriptionError(message);
      Alert.alert('Transcription error', message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const retryTranscription = async () => {
    if (!lastAudioUri) {
      return;
    }

    try {
      setIsTranscribing(true);
      clearError();
      setTranscriptionError(null);
      const transcription = await aiService.transcribeAudio(lastAudioUri);
      setDraftText(transcription);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not transcribe recording.';
      setTranscriptionError(message);
      Alert.alert('Transcription error', message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const onAnalyze = async () => {
    try {
      await analyzeDraft();
      router.push('/meal/result');
    } catch (error) {
      Alert.alert('Analysis failed', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  return (
    <ScreenContainer>
      <AppHeader actionLabel="Reset" onActionPress={clearDraft} showBackButton subtitle="Speak naturally. You can edit everything before saving." title="Log a meal" />
      <FadeInView delay={40}>
        <Card style={{ alignItems: 'center', gap: 18 }}>
          <MicButton isRecording={Boolean(recording)} onPress={recording ? stopRecording : startRecording} />
          <Text style={{ color: colors.text, fontSize: 20, fontFamily: 'Manrope_700Bold' }}>
            {recording ? 'Recording now...' : isTypedMode ? 'Type your meal below' : 'Tap the mic to start'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
            {recording
              ? `${seconds}s captured`
              : isTypedMode
                ? 'Quick-add mode skips recording and takes you straight into editable meal text.'
                : 'Try: "Als ontbijt had ik 2 boterhammen met pindakaas en melk."'}
          </Text>
        </Card>
      </FadeInView>
      {transcriptionError ? (
        <InlineMessage
          actionLabel={lastAudioUri ? 'Retry transcription' : 'Dismiss'}
          description="This message comes directly from the transcription request, so it should help pinpoint auth or deployment issues."
          onActionPress={lastAudioUri ? retryTranscription : () => setTranscriptionError(null)}
          title={transcriptionError}
          tone="error"
        />
      ) : null}
      {error ? (
        <InlineMessage
          actionLabel={lastAudioUri ? 'Retry transcription' : 'Dismiss'}
          description="You can retry the last recording or edit the text manually and continue."
          onActionPress={lastAudioUri ? retryTranscription : clearError}
          title={error}
          tone="error"
        />
      ) : null}

      <TranscriptionEditor onChangeText={setDraftText} value={draftText} />

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Helpful examples</Text>
        {[
          'Als ontbijt heb ik 2 boterhammen met pindakaas gegeten en een glas halfvolle melk.',
          'For lunch I had a chicken sandwich and an apple.',
          'Dinner was rice with salmon and vegetables.',
        ].map((example) => (
          <View key={example} style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons color={colors.primary} name="sparkles-outline" size={18} />
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium', flex: 1 }}>{example}</Text>
          </View>
        ))}
      </Card>

      <PrimaryButton
        disabled={!draftText.trim()}
        label={isTranscribing ? 'Transcribing...' : isAnalyzing ? 'Analyzing meal...' : 'Analyze meal'}
        loading={isTranscribing || isAnalyzing}
        onPress={onAnalyze}
      />
      <SecondaryButton
        label={isTypedMode ? 'Switch to voice flow' : 'Use typed entry'}
        onPress={() => {
          if (isTypedMode) {
            router.replace('/meal/log');
            return;
          }
          setDraftText(draftText || 'I had ');
          router.replace('/meal/log?mode=typed');
        }}
        disabled={Boolean(recording)}
      />
    </ScreenContainer>
  );
}
