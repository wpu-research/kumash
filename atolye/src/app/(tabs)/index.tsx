import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Display, Empty, ErrorNote, Label, Loading, Pill, Screen } from '@/components/ui';
import type { Shoot } from '@/lib/api';
import { useSession } from '@/lib/session';
import { ago, CHANNEL_LABEL, useColors } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

const SHOOT_STATUS: Record<Shoot['status'], [string, 'neutral' | 'warn' | 'ok' | 'danger']> = {
  yuklendi: ['Sırada', 'neutral'],
  isleniyor: ['İşleniyor', 'warn'],
  tamamlandi: ['Hazır', 'ok'],
  hata: ['Hata', 'danger'],
};

export default function Home() {
  const c = useColors();
  const { api, signOut } = useSession();
  const shoots = useLoad(() => api.shoots(), { pollMs: 8000 });
  const me = useLoad(() => api.me());
  const list = shoots.data?.shoots ?? [];

  return (
    <Screen
      eyebrow="Kumash Atölye"
      title="Çekim"
      refreshing={shoots.refreshing}
      onRefresh={() => {
        shoots.refresh();
        me.reload();
      }}
      right={
        <Pressable onPress={signOut} hitSlop={10} style={{ paddingBottom: 10 }}>
          <Text style={{ color: c.ink2, fontSize: 13 }}>Çıkış</Text>
        </Pressable>
      }>
      <Pressable
        onPress={() => router.push('/cekim/yeni')}
        style={({ pressed }) => [styles.hero, { backgroundColor: c.ink }, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}>
        <View style={[styles.frame, { borderColor: c.paper }]}>
          <View style={[styles.corner, styles.tl, { borderColor: c.accent }]} />
          <View style={[styles.corner, styles.tr, { borderColor: c.accent }]} />
          <View style={[styles.corner, styles.bl, { borderColor: c.accent }]} />
          <View style={[styles.corner, styles.br, { borderColor: c.accent }]} />
        </View>
        <View style={{ gap: 4 }}>
          <Label color={c.paper}>Yeni çekim</Label>
          <Display size={40} style={{ color: c.paper }}>
            Ürünleri çek
          </Display>
          <Body style={{ color: c.paper, opacity: 0.75 }}>3-4 parçayı düz zemine yan yana diz, tek kare çek. Sonra istersen yakın planlar.</Body>
        </View>
      </Pressable>

      {me.data ? (
        <View style={styles.channels}>
          {me.data.channels.map((ch) => (
            <View key={ch.channel} style={styles.ch}>
              <View style={[styles.dot, { backgroundColor: ch.ready ? c.ok : c.warn }]} />
              <Text style={{ color: c.ink2, fontSize: 12.5 }}>{CHANNEL_LABEL[ch.channel]}</Text>
            </View>
          ))}
          <Text style={{ color: c.ink2, fontSize: 12.5 }}>· yapay zekâ: {me.data.ai === 'claude' ? 'Claude' : 'deneme modu'}</Text>
        </View>
      ) : null}

      <View style={styles.sectionHead}>
        <Label>Son çekimler</Label>
      </View>
      {shoots.error ? <ErrorNote text={shoots.error} onRetry={shoots.reload} /> : null}
      {shoots.loading ? <Loading /> : null}
      {!shoots.loading && !list.length && !shoots.error ? <Empty title="Henüz çekim yok" text="İlk çekimini yap; ürünler birkaç dakika içinde onaya düşer." /> : null}
      {list.map((s) => {
        const [label, tone] = SHOOT_STATUS[s.status];
        return (
          <Card key={s.id} onPress={() => router.push(`/cekim/${s.id}`)} style={styles.shoot}>
            {s.photos[0] ? (
              <Image source={s.photos[0]} style={[styles.shootImg, { backgroundColor: c.line }]} contentFit="cover" />
            ) : (
              <View style={[styles.shootImg, { backgroundColor: c.line }]} />
            )}
            <View style={{ flex: 1, gap: 4 }}>
              <Label>
                Çekim #{s.id} · {ago(s.createdAt)}
              </Label>
              <Body style={{ fontWeight: '600' }}>
                {s.products ? `${s.products} ürün` : s.status === 'hata' ? 'İşlenemedi' : 'Ürünler hazırlanıyor'}
              </Body>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Pill text={label} tone={tone} />
                <Text style={{ color: c.ink2, fontSize: 12.5 }}>{s.photos.length} fotoğraf</Text>
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, padding: 22, gap: 22, overflow: 'hidden' },
  frame: { height: 120, borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, opacity: 0.9 },
  corner: { position: 'absolute', width: 18, height: 18 },
  tl: { left: -1, top: -1, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 12 },
  tr: { right: -1, top: -1, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 12 },
  bl: { left: -1, bottom: -1, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 12 },
  br: { right: -1, bottom: -1, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 12 },
  channels: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', paddingHorizontal: 4 },
  ch: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  sectionHead: { marginTop: 10 },
  shoot: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  shootImg: { width: 64, height: 64, borderRadius: 10 },
});
