import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Empty, ErrorNote, Loading, ProductRow, Screen } from '@/components/ui';
import type { ProductStatus } from '@/lib/api';
import { useSession } from '@/lib/session';
import { useColors } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

const TABS: { key: ProductStatus; label: string }[] = [
  { key: 'yayinda', label: 'Yayında' },
  { key: 'arsiv', label: 'Arşiv' },
];

export default function Products() {
  const c = useColors();
  const { api } = useSession();
  const [tab, setTab] = useState<ProductStatus>('yayinda');
  const q = useLoad(() => api.products(tab));
  const list = (q.data?.products ?? []).filter((p) => p.status === tab);

  const pick = (k: ProductStatus) => {
    setTab(k);
    q.setData(null);
    setTimeout(q.reload, 0);
  };

  return (
    <Screen eyebrow="Katalog" title="Ürünler" refreshing={q.refreshing} onRefresh={q.refresh}>
      <View style={[styles.seg, { backgroundColor: c.card, borderColor: c.line }]}>
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => pick(t.key)} style={[styles.segItem, tab === t.key && { backgroundColor: c.ink }]}>
            <Text style={{ color: tab === t.key ? c.paper : c.ink2, fontWeight: '600', fontSize: 14 }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      {q.error ? <ErrorNote text={q.error} onRetry={q.reload} /> : null}
      {q.loading || !q.data ? <Loading /> : null}
      {q.data && !list.length ? <Empty title="Liste boş" /> : null}
      {list.map((p) => (
        <ProductRow key={p.id} p={p} onPress={() => router.push(`/urun/${p.id}`)} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, padding: 4 },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 999 },
});
