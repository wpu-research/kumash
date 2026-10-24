import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Body, Card, Empty, ErrorNote, Label, Loading, Pill, Screen } from '@/components/ui';
import type { Order, OrderStatus } from '@/lib/api';
import { useSession } from '@/lib/session';
import { ago, CHANNEL_LABEL, ORDER_STATUS, tl, useColors } from '@/lib/theme';
import { useLoad } from '@/lib/use-load';

const FLOW: OrderStatus[] = ['alindi', 'hazirlaniyor', 'kargoda', 'teslim', 'iptal'];
const tone = (s: OrderStatus) => (s === 'teslim' ? 'ok' : s === 'iptal' ? 'danger' : s === 'alindi' ? 'accent' : 'warn');

export default function Orders() {
  const { api } = useSession();
  const q = useLoad(() => api.orders(), { pollMs: 20000 });
  const list = q.data?.orders ?? [];
  const open = list.filter((o) => o.status === 'alindi' || o.status === 'hazirlaniyor').length;
  return (
    <Screen eyebrow={open ? `${open} sipariş hazırlanacak` : 'Siparişler'} title="Siparişler" refreshing={q.refreshing} onRefresh={q.refresh}>
      {q.error ? <ErrorNote text={q.error} onRetry={q.reload} /> : null}
      {q.loading ? <Loading /> : null}
      {!q.loading && !list.length && !q.error ? <Empty title="Henüz sipariş yok" text="Siteden ve diğer kanallardan gelen siparişler burada listelenir." /> : null}
      {list.map((o) => (
        <OrderCard key={o.id} o={o} onChange={(s) => q.setData({ orders: list.map((x) => (x.id === o.id ? { ...x, status: s } : x)) })} />
      ))}
    </Screen>
  );
}

function OrderCard({ o, onChange }: { o: Order; onChange: (s: OrderStatus) => void }) {
  const c = useColors();
  const { api } = useSession();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = async (s: OrderStatus) => {
    const prev = o.status;
    onChange(s);
    try {
      await api.setOrderStatus(o.id, s);
      setErr(null);
    } catch (e) {
      onChange(prev);
      setErr(e instanceof Error ? e.message : String(e));
    }
  };
  return (
    <Card onPress={() => setOpen((v) => !v)} style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
        <View style={{ flex: 1, gap: 3 }}>
          <Label>
            {o.no} · {CHANNEL_LABEL[o.channel]} · {ago(o.createdAt)}
          </Label>
          <Body style={{ fontWeight: '600' }}>{o.customerName}</Body>
          <Text style={{ color: c.ink2, fontSize: 13 }}>
            {o.items.reduce((a, i) => a + i.qty, 0)} parça · {o.city}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <Text style={{ color: c.ink, fontWeight: '700', fontSize: 16, fontVariant: ['tabular-nums'] }}>{tl(o.total)}</Text>
          <Pill text={ORDER_STATUS[o.status]} tone={tone(o.status)} />
        </View>
      </View>
      {open ? (
        <View style={{ gap: 10 }}>
          {o.items.map((i, n) => (
            <View key={n} style={styles.item}>
              <Body style={{ flex: 1 }} numberOfLines={1}>
                {i.qty} × {i.title}
              </Body>
              <Text style={{ color: c.ink2 }}>{i.size}</Text>
            </View>
          ))}
          <Text style={{ color: c.ink2, fontSize: 13 }} selectable>
            {o.phone} · {o.address}, {o.city}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {FLOW.map((s) => (
              <Pressable key={s} onPress={() => set(s)} style={[styles.chip, { borderColor: o.status === s ? c.ink : c.line, backgroundColor: o.status === s ? c.ink : 'transparent' }]}>
                <Text style={{ color: o.status === s ? c.paper : c.ink, fontSize: 13, fontWeight: '500' }}>{ORDER_STATUS[s]}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {err ? <ErrorNote text={err} /> : null}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
});
