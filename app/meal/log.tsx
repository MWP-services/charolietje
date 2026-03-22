import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useAuthStore } from '@/store/authStore';
import { useMealStore } from '@/store/mealStore';

export default function VoiceLogMealScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const session = useAuthStore((state) => state.session);
  const draftText = useMealStore((state) => state.draftText);
  const setDraftText = useMealStore((state) => state.setDraftText);
  const analyzeDraft = useMealStore((state) => state.analyzeDraft);
  const isAnalyzing = useMealStore((state) => state.isAnalyzing);
  const clearDraft = useMealStore((state) => state.clearDraft);
  const error = useMealStore((state) => state.error);
  const clearError = useMealStore((state) => state.clearError);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [lastAudioUri, setLastAudioUri] = useState<string | null>(null);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);

  const isTypedMode = mode === 'typed';
  const isGuestMode = session?.provider === 'guest';

  const startRecording = async () => {
    if (isGuestMode) {
      Alert.alert('Niet beschikbaar in gastmodus', 'Transcriptie met audio is alleen beschikbaar met een account. Gebruik getypte invoer om toch een maaltijd te loggen.');
      router.replace('/meal/log?mode=typed');
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microfoonrechten', 'NutriVoice heeft toegang tot je microfoon nodig om je maaltijd op te nemen.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
        shouldPlayInBackground: false,
        shouldRouteThroughEarpiece: false,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error) {
      Alert.alert('Opnamefout', error instanceof Error ? error.message : 'Opname starten lukte niet.');
    }
  };

  const stopRecording = async () => {
    if (!recorderState.isRecording) {
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await recorder.stop();
      const uri = recorder.uri ?? recorder.getStatus().url;
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
      const message = error instanceof Error ? error.message : 'Transcriptie lukte niet.';
      setTranscriptionError(message);
      Alert.alert('Transcriptiefout', message);
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
      const message = error instanceof Error ? error.message : 'Transcriptie lukte niet.';
      setTranscriptionError(message);
      Alert.alert('Transcriptiefout', message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const onAnalyze = async () => {
    try {
      await analyzeDraft(session?.userId);
      router.push('/meal/result');
    } catch (error) {
      Alert.alert('Analyse mislukt', error instanceof Error ? error.message : 'Probeer het opnieuw.');
    }
  };

  return (
    <ScreenContainer>
      <AppHeader
        actionLabel="Wissen"
        onActionPress={clearDraft}
        showBackButton
        subtitle={
          isGuestMode
            ? 'Gastmodus gebruikt alleen getypte invoer. Maak een account aan voor spraaktranscriptie.'
            : 'Praat natuurlijk. Je kunt alles nog aanpassen voordat je opslaat.'
        }
        title="Maaltijd loggen"
      />
      {isGuestMode ? (
        <InlineMessage
          actionLabel={isTypedMode ? 'Terug naar overzicht' : 'Gebruik getypte invoer'}
          description="Je kunt als gast nog steeds maaltijden analyseren, opslaan en je dagtotalen bekijken. Alleen transcriptie via audio is uitgeschakeld."
          onActionPress={() => router.replace(isTypedMode ? '/(tabs)' : '/meal/log?mode=typed')}
          title="Spraaktranscriptie is niet beschikbaar in gastmodus"
        />
      ) : null}
      <FadeInView delay={40}>
        <Card style={{ alignItems: 'center', gap: 18 }}>
          <MicButton disabled={isGuestMode} isRecording={recorderState.isRecording} onPress={recorderState.isRecording ? stopRecording : startRecording} />
          <Text style={{ color: colors.text, fontSize: 20, fontFamily: 'Manrope_700Bold' }}>
            {recorderState.isRecording
              ? 'Bezig met opnemen...'
              : isGuestMode
                ? 'Typ hieronder je maaltijd'
                : isTypedMode
                  ? 'Typ hieronder je maaltijd'
                  : 'Tik op de microfoon om te starten'}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: 'center', fontFamily: 'Manrope_500Medium' }}>
            {recorderState.isRecording
              ? `${Math.max(1, Math.floor(recorderState.durationMillis / 1000))}s opgenomen`
              : isGuestMode
                ? 'Getypte invoer werkt volledig in gastmodus. Maak een account aan als je ook audio wilt transcriberen.'
              : isTypedMode
                ? 'De snelle typmodus slaat opnemen over en brengt je direct naar bewerkbare maaltijdtekst.'
                : 'Probeer: "Als ontbijt had ik 2 boterhammen met pindakaas en melk."'}
          </Text>
        </Card>
      </FadeInView>
      {transcriptionError ? (
        <InlineMessage
          actionLabel={lastAudioUri ? 'Opnieuw proberen' : 'Sluiten'}
          description="Dit bericht komt direct uit het transcriptieverzoek en helpt bij het opsporen van auth- of deploymentproblemen."
          onActionPress={lastAudioUri ? retryTranscription : () => setTranscriptionError(null)}
          title={transcriptionError}
          tone="error"
        />
      ) : null}
      {error ? (
        <InlineMessage
          actionLabel={lastAudioUri ? 'Opnieuw proberen' : 'Sluiten'}
          description="Je kunt de laatste opname opnieuw proberen of de tekst handmatig aanpassen en doorgaan."
          onActionPress={lastAudioUri ? retryTranscription : clearError}
          title={error}
          tone="error"
        />
      ) : null}

      <TranscriptionEditor onChangeText={setDraftText} value={draftText} />

      <Card style={{ gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Handige voorbeelden</Text>
        {[
          'Als ontbijt heb ik 2 boterhammen met pindakaas gegeten en een glas halfvolle melk.',
          'Voor lunch had ik een kipsandwich en een appel.',
          'Als avondeten at ik rijst met zalm en groenten.',
        ].map((example) => (
          <View key={example} style={{ flexDirection: 'row', gap: 10 }}>
            <Ionicons color={colors.primary} name="sparkles-outline" size={18} />
            <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: 'Manrope_500Medium', flex: 1 }}>{example}</Text>
          </View>
        ))}
      </Card>

      <PrimaryButton
        disabled={!draftText.trim()}
        label={isTranscribing ? 'Transcriberen...' : isAnalyzing ? 'Maaltijd analyseren...' : 'Maaltijd analyseren'}
        loading={isTranscribing || isAnalyzing}
        onPress={onAnalyze}
      />
      <SecondaryButton
        label={isGuestMode ? 'Terug naar overzicht' : isTypedMode ? 'Ga terug naar steminvoer' : 'Gebruik getypte invoer'}
        onPress={() => {
          if (isGuestMode) {
            router.replace('/(tabs)');
            return;
          }
          if (isTypedMode) {
            router.replace('/meal/log');
            return;
          }
          setDraftText(draftText || 'Ik had ');
          router.replace('/meal/log?mode=typed');
        }}
        disabled={recorderState.isRecording}
      />
    </ScreenContainer>
  );
}
