import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { Body, Button, Display, ErrorNote, Label, Loading, Pill, Screen, statusTone, Swatch } from '@/components/ui';
import type { Channel, Product } from '@/lib/api';
import { useSession } from '@/lib/session';
import { CHANNEL_LABEL, kurusToInput, LISTING_STATUS, parseTl, PRODUCT_STATUS, tl, useColors } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

const ALL: Channel[] = ['site', 'trendyol', 'instagram', 'facebook'];
const KIND: Record<Product['images'][number]['kind'], string> = { manken: 'Manken', kesik: 'Düz çekim', ham: 'Çekim', kombin: 'Kombin', sosyal: 'Sosyal' };

type Draft = { title: string; description: string; price: string; stock: Record<number, number> };
const toDraft = (p: Product): Draft => ({
  title: p.title,
  description: p.description,
  price: kurusToInput(p.price),
  stock: Object.fromEntries(p.variants.map((v) => [v.id, v.stock])),
});

export default function ProductScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useSession();
  const q = useLoad(() => api.product(Number(id)).then((r) => r.product));
  const me = useLoad(() => api.me());
  const p = q.data;

  // Düzenleme yoksa sunucudaki hali gösterilir; odak yenilemeleri kullanıcının düzenlemesini ezmez
  const [edits, setEdits] = useState<Draft | null>(null);
  const draft = edits ?? (p ? toDraft(p) : null);
  const [channels, setChannels] = useState<Channel[]>(ALL);
  const [busy, setBusy] = useState<'save' | 'publish' | 'archive' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ready = useMemo(() => Object.fromEntries((me.data?.channels ?? []).map((x) => [x.channel, x.ready])) as Record<Channel, boolean>, [me.data]);

  if (!p || !draft) {
    return (
      <Screen eyebrow="Ürün" title="Yükleniyor">
        {q.error ? <ErrorNote text={q.error} onRetry={q.reload} /> : <Loading />}
      </Screen>
    );
  }

  const price = parseTl(draft.price);
  const totalStock = Object.values(draft.stock).reduce((a, b) => a + b, 0);
  const dirty =
    draft.title !== p.title ||
    draft.description !== p.description ||
    price !== p.price ||
    p.variants.some((v) => draft.stock[v.id] !== v.stock);

  const save = async () => {
    if (!Number.isFinite(price) || price < 100) throw new Error('Geçerli bir fiyat gir.');
    if (draft.title.trim().length < 3) throw new Error('Başlık en az 3 karakter olmalı.');
    const r = await api.updateProduct(p.id, {
      title: draft.title.trim(),
      description: draft.description.trim(),
      price,
      stock: Object.fromEntries(Object.entries(draft.stock).map(([k, v]) => [k, v])),
    });
    q.setData(r.product);
    setEdits(null);
    return r.product;
  };

  const run = async (kind: 'save' | 'publish' | 'archive') => {
    setBusy(kind);
    setError(null);
    setNotice(null);
    try {
      if (kind === 'save') {
        await save();
        setNotice('Kaydedildi.');
      } else if (kind === 'publish') {
        if (dirty) await save();
        if (totalStock <= 0) throw new Error('Yayından önce en az bir bedene stok gir.');
        await api.publish(p.id, channels);
        if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setNotice('Yayına gönderildi. Kanal durumları birkaç saniye içinde güncellenir.');
        setTimeout(() => q.reload(), 1500);
        setTimeout(() => q.reload(), 4000);
      } else {
        const r = await api.archive(p.id);
        q.setData(r.product);
        setNotice(p.status === 'onayda' ? 'Ürün reddedildi ve arşive alındı.' : 'Ürün yayından kaldırıldı.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const set = (patch: Partial<Draft>) => setEdits({ ...draft, ...patch });
  const step = (vid: number, delta: number) => set({ stock: { ...draft.stock, [vid]: Math.max(0, (draft.stock[vid] ?? 0) + delta) } });
  const input = [styles.input, { color: c.ink, backgroundColor: c.card, borderColor: c.line }];
  const imgW = Math.min(width - 36, 520) * 0.78;

  const footer =
    p.status === 'onayda' ? (
      <>
        <Button title="Reddet" kind="danger" onPress={() => run('archive')} busy={busy === 'archive'} style={{ flex: 0.8 }} />
        <Button title="Onayla, yayınla" kind="accent" onPress={() => run('publish')} busy={busy === 'publish'} style={{ flex: 1.4 }} />
      </>
    ) : p.status === 'yayinda' ? (
      <>
        <Button title="Kaldır" kind="ghost" onPress={() => run('archive')} busy={busy === 'archive'} style={{ flex: 0.8 }} />
        <Button title={dirty ? 'Kaydet' : 'Tekrar gönder'} onPress={() => run(dirty ? 'save' : 'publish')} busy={busy === 'save' || busy === 'publish'} style={{ flex: 1.4 }} />
      </>
    ) : (
      <Button title="Tekrar yayınla" kind="accent" onPress={() => run('publish')} busy={busy === 'publish'} style={{ flex: 1 }} />
    );

  return (
    <Screen
      eyebrow={`${p.code} · ${p.category.gender === 'kadin' ? 'Kadın' : 'Erkek'} ${p.category.name}`}
      title={p.title}
      footer={footer}
      right={
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/onay'))} hitSlop={10} style={{ paddingBottom: 10 }}>
          <Text style={{ color: c.ink2, fontSize: 13 }}>Kapat</Text>
        </Pressable>
      }>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Pill text={PRODUCT_STATUS[p.status]} tone={statusTone(p.status)} />
        <Swatch hex={p.colorHex} c={c} />
        <Text style={{ color: c.ink2, fontSize: 13 }}>
          {p.color} · {p.fabric} · {p.fit}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={imgW + 10} decelerationRate="fast" contentContainerStyle={{ gap: 10 }} style={{ marginHorizontal: -18 }}>
        <View style={{ width: 8 }} />
        {p.images.map((img) => (
          <View key={img.id} style={{ width: imgW, gap: 6 }}>
            <Image source={img.url} style={[styles.img, { backgroundColor: c.line }]} contentFit="cover" transition={150} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Label>{KIND[img.kind]}</Label>
              {img.qc != null && img.kind !== 'ham' ? <Label color={img.qc < 85 ? c.accent : c.ink2}>Kalite {img.qc}</Label> : null}
            </View>
          </View>
        ))}
        <View style={{ width: 8 }} />
      </ScrollView>
      <Body muted style={{ fontSize: 13 }}>
        Manken görselinde renk, düğme ve desen gerçek ürünle aynı mı? Değilse reddet ve yakın planla yeniden çek.
      </Body>

      {error ? <ErrorNote text={error} /> : null}
      {notice ? (
        <View style={[styles.notice, { backgroundColor: c.okSoft }]}>
          <Body style={{ color: c.ok }}>{notice}</Body>
        </View>
      ) : null}

      <View style={styles.field}>
        <Label>Başlık</Label>
        <TextInput value={draft.title} onChangeText={(t) => set({ title: t })} style={input} maxLength={120} />
      </View>
      <View style={styles.field}>
        <Label>Fiyat (₺)</Label>
        <TextInput value={draft.price} onChangeText={(t) => set({ price: t })} keyboardType="decimal-pad" style={[input, { fontSize: 22, fontWeight: '600' }]} />
        {Number.isFinite(price) && price !== p.price ? <Text style={{ color: c.ink2, fontSize: 12.5 }}>Önceki: {tl(p.price)}</Text> : null}
      </View>

      <View style={styles.field}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Label>Beden stoğu</Label>
          <Label>{totalStock} adet</Label>
        </View>
        <View style={styles.sizes}>
          {p.variants.map((v) => (
            <View key={v.id} style={[styles.size, { backgroundColor: c.card, borderColor: (draft.stock[v.id] ?? 0) > 0 ? c.ink : c.line }]}>
              <Text style={{ color: c.ink2, fontSize: 12, fontWeight: '600' }}>{v.size}</Text>
              <Text style={{ color: c.ink, fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{draft.stock[v.id] ?? 0}</Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <Pressable onPress={() => step(v.id, -1)} style={[styles.stepBtn, { borderColor: c.line }]} hitSlop={4} accessibilityLabel={`${v.size} azalt`}>
                  <Text style={{ color: c.ink, fontSize: 18 }}>−</Text>
                </Pressable>
                <Pressable onPress={() => step(v.id, 1)} style={[styles.stepBtn, { borderColor: c.line }]} hitSlop={4} accessibilityLabel={`${v.size} artır`}>
                  <Text style={{ color: c.ink, fontSize: 18 }}>+</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Label>Yayınlanacak yerler</Label>
        <View style={[styles.box, { borderColor: c.line, backgroundColor: c.card }]}>
          {ALL.map((ch, i) => {
            const listing = p.listings.find((l) => l.channel === ch);
            const on = ch === 'site' || channels.includes(ch);
            return (
              <View key={ch} style={[styles.chRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Body style={{ fontWeight: '600' }}>{CHANNEL_LABEL[ch]}</Body>
                  <Text style={{ color: c.ink2, fontSize: 12.5 }}>
                    {listing && p.status !== 'onayda' ? LISTING_STATUS[listing.status] : ready[ch] === false ? 'Hesap bağlı değil; bağlanınca gönderilir' : ch === 'site' ? 'Her zaman' : 'Hazır'}
                  </Text>
                </View>
                {listing && p.status === 'yayinda' ? (
                  <Pill text={LISTING_STATUS[listing.status]} tone={listing.status === 'yayinda' ? 'ok' : listing.status === 'hata' ? 'danger' : 'warn'} />
                ) : null}
                <Switch
                  value={on}
                  disabled={ch === 'site'}
                  onValueChange={(v) => setChannels((all) => (v ? [...new Set([...all, ch])] : all.filter((x) => x !== ch)))}
                  trackColor={{ true: c.ok, false: c.line }}
                />
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Label>Açıklama</Label>
        <TextInput value={draft.description} onChangeText={(t) => set({ description: t })} multiline style={[input, { minHeight: 120, textAlignVertical: 'top' }]} />
      </View>

      <Display size={18} style={{ color: c.ink2, textAlign: 'center', marginTop: 8 }}>
        {p.status === 'yayinda' ? 'sitede yayında' : 'onaylanınca her yerde'}
      </Display>
    </Screen>
  );
}

const styles = StyleSheet.create({
  img: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16 },
  notice: { padding: 14, borderRadius: 12 },
  field: { gap: 8 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  size: { flexGrow: 1, minWidth: 92, borderWidth: 1, borderRadius: 14, padding: 10, alignItems: 'center', gap: 4 },
  stepBtn: { width: 34, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  box: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, paddingHorizontal: 14 },
  chRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
});
