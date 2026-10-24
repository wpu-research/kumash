import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Button, Display, ErrorNote, Label, Loading, ProductRow, Screen } from '@/components/ui';
import { useSession } from '@/lib/session';
import { useColors } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

// İş günlüğündeki satırlardan adım durumunu çıkarır (sunucu "ayrıştırma", "giydirme", "metin" yazıyor).
const STEPS = [
  { key: 'yukle', label: 'Fotoğraflar alındı', match: /sağlayıcı/ },
  { key: 'tani', label: 'Parçalar tanındı', match: /ayrıştırma/ },
  { key: 'giydir', label: 'Mankene giydirildi', match: /giydirme/ },
  { key: 'metin', label: 'Ürün metinleri yazıldı', match: /metin/ },
] as const;

export default function ShootScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const q = useLoad(() => api.shoot(Number(id)), { pollMs: 1500 });
  const d = q.data;
  const done = d?.shoot.status === 'tamamlandi';
  const failed = d?.shoot.status === 'hata' || d?.job?.status === 'hata';
  const log = d?.job?.log ?? [];
  const reached = STEPS.map((s) => log.some((l) => s.match.test(l.msg)));
  const pending = d?.products.filter((p) => p.status === 'onayda').length ?? 0;

  return (
    <Screen
      eyebrow={`Çekim #${id}`}
      title={done ? 'Ürünler hazır' : failed ? 'İşlenemedi' : 'Hazırlanıyor'}
      right={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} style={{ paddingBottom: 10 }}>
          <Text style={{ color: c.ink2, fontSize: 13 }}>Kapat</Text>
        </Pressable>
      }
      footer={done && pending ? <Button title={`${pending} ürünü onayla`} kind="accent" style={{ flex: 1 }} onPress={() => router.replace('/onay')} /> : undefined}>
      {q.error && !d ? <ErrorNote text={q.error} onRetry={q.reload} /> : null}
      {!d ? <Loading /> : null}
      {d ? (
        <>
          {d.shoot.photos.length ? (
            <View style={styles.photos}>
              {d.shoot.photos.slice(0, 4).map((u, i) => (
                <Image key={u} source={u} style={[styles.photo, i === 0 && styles.first, { backgroundColor: c.line }]} contentFit="cover" />
              ))}
            </View>
          ) : null}

          <View style={[styles.steps, { borderColor: c.line }]}>
            {STEPS.map((s, i) => {
              const ok = reached[i] || done;
              const active = !ok && !failed && reached.slice(0, i).every(Boolean);
              return (
                <View key={s.key} style={styles.step}>
                  <View style={[styles.mark, { borderColor: ok ? c.ok : active ? c.accent : c.line, backgroundColor: ok ? c.ok : 'transparent' }]}>
                    {ok ? <Text style={{ color: c.paper, fontSize: 11, fontWeight: '800' }}>✓</Text> : null}
                  </View>
                  <Body style={{ flex: 1, color: ok || active ? c.ink : c.ink2, fontWeight: active ? '600' : '400' }}>{s.label}</Body>
                  {active ? <Label color={c.accent}>şimdi</Label> : null}
                </View>
              );
            })}
          </View>

          {failed ? <ErrorNote text={d.job?.error ?? 'Çekim işlenirken hata oluştu.'} /> : null}

          {d.products.length ? (
            <View style={{ gap: 10, marginTop: 6 }}>
              <Label>{d.products.length} ürün bulundu</Label>
              {d.products.map((p) => (
                <ProductRow key={p.id} p={p} onPress={() => router.push(`/urun/${p.id}`)} />
              ))}
            </View>
          ) : !done && !failed ? (
            <View style={{ alignItems: 'center', gap: 6, paddingVertical: 12 }}>
              <Display size={22} style={{ color: c.ink2 }}>
                ortalama 1-2 dakika
              </Display>
              <Body muted style={{ textAlign: 'center' }}>
                Bu ekranı kapatabilirsin; ürünler hazır olunca Onay sekmesine düşer.
              </Body>
            </View>
          ) : null}

          {log.length ? (
            <View style={{ gap: 6, marginTop: 8 }}>
              <Label>İşlem kaydı</Label>
              {log.map((l, i) => (
                <Text key={i} style={{ color: c.ink2, fontSize: 12.5, fontFamily: 'monospace' }}>
                  {new Date(l.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} {l.msg}
                </Text>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  photo: { width: '23.5%', aspectRatio: 1, borderRadius: 10 },
  first: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16 },
  steps: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, padding: 14, gap: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mark: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
