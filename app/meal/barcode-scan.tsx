import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult, type BarcodeType } from 'expo-camera';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { AppHeader } from '@/components/common/AppHeader';
import { Card } from '@/components/common/Card';
import { FormField } from '@/components/common/FormField';
import { InlineMessage } from '@/components/common/InlineMessage';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenContainer } from '@/components/common/ScreenContainer';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { colors } from '@/constants/colors';
import { premiumLaunchPlan } from '@/constants/premiumPlan';
import { barcodeLookupService } from '@/services/nutrition/barcodeLookupService';
import { useMealStore } from '@/store/mealStore';
import { useProfileStore } from '@/store/profileStore';

const barcodeTypes: BarcodeType[] = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'];

export default function MealBarcodeScanScreen() {
  const router = useRouter();
  const { draftIndex, targetKey } = useLocalSearchParams<{ draftIndex?: string; targetKey?: string }>();
  const profile = useProfileStore((state) => state.profile);
  const updateDraftItem = useMealStore((state) => state.updateDraftItem);
  const setDraftAnalysis = useMealStore((state) => state.setDraftAnalysis);
  const setPendingScannedItem = useMealStore((state) => state.setPendingScannedItem);
  const [permission, requestPermission] = useCameraPermissions();
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);

  const goBackSafely = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/meal/result');
  };

  const handleLookup = async (barcode: string) => {
    try {
      setError(null);
      setIsResolving(true);
      const analysis = await barcodeLookupService.lookupBarcode(barcode);
      const scannedItem = analysis.items[0];

      if (typeof draftIndex === 'string' && Number.isFinite(Number(draftIndex))) {
        updateDraftItem(Number(draftIndex), scannedItem);
        goBackSafely();
        return;
      }

      if (typeof targetKey === 'string' && targetKey.trim()) {
        setPendingScannedItem(targetKey, scannedItem);
        goBackSafely();
        return;
      }

      setDraftAnalysis(analysis, analysis.originalText);
      router.replace('/meal/result');
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Barcode verwerken mislukt.');
      setScanLocked(false);
    } finally {
      setIsResolving(false);
    }
  };

  const onBarcodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanLocked || isResolving) {
      return;
    }

    setManualBarcode(data);
    setScanLocked(true);
    await handleLookup(data);
  };

  if (!profile?.is_premium) {
    return (
      <ScreenContainer>
        <AppHeader backHref="/meal/result" showBackButton subtitle="Barcode scannen is alleen beschikbaar in premium." title="Product scannen" />
        <InlineMessage
          actionLabel="Premium activeren"
          description={premiumLaunchPlan.description}
          onActionPress={() => router.replace('/premium/activate')}
          title="Deze functie is premium"
          tone="info"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <AppHeader
        backHref="/meal/result"
        showBackButton
        subtitle="Scan de streepjescode van een verpakking of vul hem handmatig in."
        title="Product scannen"
      />

      {error ? (
        <InlineMessage
          actionLabel="Opnieuw proberen"
          description="Je kunt opnieuw scannen of de barcode handmatig invullen als de camera het product niet goed oppakt."
          onActionPress={() => {
            setError(null);
            setScanLocked(false);
          }}
          title={error}
          tone="error"
        />
      ) : null}

      {!permission ? (
        <Card>
          <Text style={{ color: colors.textSecondary, fontFamily: 'Manrope_500Medium' }}>Camerarechten worden geladen...</Text>
        </Card>
      ) : !permission.granted ? (
        <Card style={{ gap: 14 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontFamily: 'Manrope_700Bold' }}>Camera-toegang nodig</Text>
          <Text style={{ color: colors.textSecondary, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
            Geef cameratoegang om verpakkingen te scannen. Zonder toegang kun je nog steeds de barcode handmatig invoeren.
          </Text>
          <PrimaryButton label="Camera-toegang geven" onPress={() => void requestPermission()} />
        </Card>
      ) : (
        <Card style={{ gap: 14, overflow: 'hidden', padding: 0 }}>
          <View style={{ height: 360, backgroundColor: '#08110F' }}>
            <CameraView
              active={!isResolving}
              barcodeScannerSettings={{ barcodeTypes }}
              facing="back"
              onBarcodeScanned={onBarcodeScanned}
              style={{ flex: 1 }}
            />
          </View>
          <View style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Richt op de barcode</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 22, fontFamily: 'Manrope_500Medium' }}>
              {Platform.OS === 'web'
                ? 'Gebruik bij web het liefst een mobiele browser of vul de code hieronder handmatig in als cameratoegang lastig doet.'
                : 'De scan stopt automatisch zodra een code is gevonden.'}
            </Text>
            <SecondaryButton
              label={scanLocked ? 'Nieuwe scan starten' : 'Scanner is actief'}
              onPress={() => setScanLocked(false)}
              disabled={!scanLocked}
            />
          </View>
        </Card>
      )}

      <Card style={{ gap: 14 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontFamily: 'Manrope_700Bold' }}>Barcode handmatig invoeren</Text>
        <FormField
          autoCapitalize="none"
          inputMode="numeric"
          keyboardType="numeric"
          label="Barcode"
          onChangeText={setManualBarcode}
          placeholder="Bijv. 5449000000996"
          value={manualBarcode}
        />
        <PrimaryButton
          disabled={!manualBarcode.trim() || isResolving}
          label={isResolving ? 'Product ophalen...' : 'Product ophalen'}
          loading={isResolving}
          onPress={() => void handleLookup(manualBarcode)}
        />
      </Card>
    </ScreenContainer>
  );
}
