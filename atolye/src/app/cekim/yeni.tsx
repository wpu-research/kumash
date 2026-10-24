import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, Button, Display, Label } from '@/components/ui';
import { useSession } from '@/lib/session';
import { useColors } from '@/lib/theme';

const MAX = 8;
const MAX_EDGE = 2000; // sunucuya giden fotoğrafın uzun kenarı; tanıma ve kırpma için yeterli, yükleme hızlı

type Shot = { uri: string; width: number; height: number };
type Flash = 'off' | 'on' | 'auto';
const FLASH_LABEL: Record<Flash, string> = { off: 'Flaş kapalı', on: 'Flaş açık', auto: 'Flaş otomatik' };

async function shrink(s: Shot) {
  const ctx = ImageManipulator.manipulate(s.uri);
  const long = Math.max(s.width, s.height);
  if (long > MAX_EDGE) ctx.resize(s.width >= s.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ format: SaveFormat.JPEG, compress: 0.82 });
  return out.uri;
}

export default function NewShoot() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { api } = useSession();
  const [permission, requestPermission] = useCameraPermissions();
  const cam = useRef<CameraView>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [flash, setFlash] = useState<Flash>('off');
  const [ready, setReady] = useState(false);
  const [taking, setTaking] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const full = shots.length >= MAX;
  const hint = !shots.length
    ? 'Ürünleri düz zemine yan yana diz, çerçeveye sığdır'
    : full
      ? 'En fazla 8 fotoğraf. Gönderebilirsin.'
      : 'Şimdi her parçanın yakın planını çek (isteğe bağlı)';

  const take = async () => {
    if (!cam.current || taking || full) return;
    setTaking(true);
    try {
      const p = await cam.current.takePictureAsync({ quality: 0.9, shutterSound: false });
      if (p) {
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShots((s) => [...s, { uri: p.uri, width: p.width, height: p.height }]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fotoğraf çekilemedi');
    } finally {
      setTaking(false);
    }
  };

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX - shots.length,
      quality: 1,
    });
    if (!r.canceled) setShots((s) => [...s, ...r.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }))].slice(0, MAX));
  };

  const send = async () => {
    if (!shots.length) return;
    setError(null);
    setProgress(0);
    try {
      const files = await Promise.all(shots.map(async (s, i) => ({ uri: await shrink(s), name: `${i + 1}.jpg` })));
      const { id } = await api.uploadShoot(files, '', setProgress);
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/cekim/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setProgress(null);
    }
  };

  // İzin yoksa: açıklama + galeriden seçme seçeneği
  if (!permission?.granted) {
    return (
      <View style={[styles.perm, { backgroundColor: c.paper, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
        <View style={{ gap: 10 }}>
          <Label>Kamera izni</Label>
          <Display size={40}>Çekim için kameraya ihtiyacımız var</Display>
          <Body muted>Fotoğraflar yalnızca Kumash sunucusuna gönderilir ve ürün görselleri için kullanılır.</Body>
        </View>
        <View style={{ gap: 10 }}>
          {permission?.canAskAgain === false ? (
            <Body muted>Kamera izni kapalı. Telefon ayarlarından Atölye için kamerayı aç ya da galeriden seç.</Body>
          ) : (
            <Button title="Kameraya izin ver" onPress={requestPermission} />
          )}
          <Button title="Galeriden seç" kind="ghost" onPress={pick} />
          <Button title="Vazgeç" kind="ghost" onPress={() => router.back()} />
          {shots.length ? <Button title={`${shots.length} fotoğrafı gönder`} kind="accent" onPress={send} busy={progress !== null} /> : null}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cam} style={StyleSheet.absoluteFill} facing="back" flash={flash} onCameraReady={() => setReady(true)} />

      {/* hizalama çerçevesi */}
      <View pointerEvents="none" style={[styles.guide, { top: insets.top + 84, bottom: insets.bottom + 220 }]}>
        <View style={[styles.k, styles.ktl]} />
        <View style={[styles.k, styles.ktr]} />
        <View style={[styles.k, styles.kbl]} />
        <View style={[styles.k, styles.kbr]} />
        <View style={styles.cross} />
      </View>

      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.chip}>
          <Text style={styles.chipText}>Kapat</Text>
        </Pressable>
        <View style={[styles.chip, { flexShrink: 1 }]}>
          <Text style={styles.chipText} numberOfLines={1}>
            {hint}
          </Text>
        </View>
        <Pressable onPress={() => setFlash((f) => (f === 'off' ? 'auto' : f === 'auto' ? 'on' : 'off'))} hitSlop={12} style={styles.chip}>
          <Text style={styles.chipText}>{FLASH_LABEL[flash]}</Text>
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {shots.map((s, i) => (
            <View key={s.uri + i} style={styles.thumbWrap}>
              <Image source={s.uri} style={styles.thumb} contentFit="cover" />
              <Text style={styles.thumbLabel}>{i === 0 ? 'Grup' : `Yakın ${i}`}</Text>
              <Pressable onPress={() => setShots((all) => all.filter((_, j) => j !== i))} hitSlop={8} style={styles.remove} accessibilityLabel="Fotoğrafı sil">
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
        <View style={styles.controls}>
          <Pressable onPress={pick} style={styles.side} hitSlop={8}>
            <Text style={styles.sideText}>Galeri</Text>
          </Pressable>
          <Pressable
            onPress={take}
            disabled={!ready || full || progress !== null}
            accessibilityLabel="Fotoğraf çek"
            style={({ pressed }) => [styles.shutter, (pressed || taking) && { transform: [{ scale: 0.92 }] }, (!ready || full) && { opacity: 0.4 }]}>
            <View style={styles.shutterIn} />
          </Pressable>
          <Pressable onPress={send} disabled={!shots.length || progress !== null} style={[styles.side, styles.send, { backgroundColor: shots.length ? c.accent : 'rgba(255,255,255,0.15)' }]}>
            <Text style={[styles.sideText, { fontWeight: '700' }]}>
              {progress !== null ? `%${Math.round(progress * 100)}` : `Gönder${shots.length ? ` (${shots.length})` : ''}`}
            </Text>
          </Pressable>
        </View>
      </View>

      {progress !== null ? (
        <View style={[StyleSheet.absoluteFill, styles.overlay]}>
          <Display size={36} style={{ color: '#fff' }}>
            Yükleniyor
          </Display>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max(4, progress * 100)}%`, backgroundColor: c.accent }]} />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{shots.length} fotoğraf sıkıştırılıp gönderiliyor</Text>
        </View>
      ) : null}
    </View>
  );
}

const K = 28;
const styles = StyleSheet.create({
  perm: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  guide: { position: 'absolute', left: 22, right: 22 },
  k: { position: 'absolute', width: K, height: K, borderColor: '#fff' },
  ktl: { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 14 },
  ktr: { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 14 },
  kbl: { left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 14 },
  kbr: { right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 14 },
  cross: { position: 'absolute', left: '50%', top: '50%', width: 14, height: 14, marginLeft: -7, marginTop: -7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 7 },
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 14, flexDirection: 'row', gap: 8, justifyContent: 'space-between', alignItems: 'center' },
  chip: { backgroundColor: 'rgba(12,14,19,0.6)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: '#fff', fontSize: 12.5, fontWeight: '500' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(12,14,19,0.72)', paddingTop: 12, gap: 12 },
  err: { color: '#FFB4B4', paddingHorizontal: 18, fontSize: 13 },
  strip: { paddingHorizontal: 14, gap: 8, minHeight: 74 },
  thumbWrap: { width: 56, alignItems: 'center', gap: 3 },
  thumb: { width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  thumbLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10 },
  remove: { position: 'absolute', right: -5, top: -5, width: 20, height: 20, borderRadius: 10, backgroundColor: '#8C1D35', alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  side: { minWidth: 92, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  send: {},
  sideText: { color: '#fff', fontSize: 14 },
  shutter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterIn: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
  overlay: { backgroundColor: 'rgba(12,14,19,0.85)', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 32 },
  track: { width: '80%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  fill: { height: 4 },
});
