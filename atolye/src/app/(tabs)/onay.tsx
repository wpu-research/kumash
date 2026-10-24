import { router } from 'expo-router';

import { Button, Empty, ErrorNote, Loading, ProductRow, Screen } from '@/components/ui';
import { useSession } from '@/lib/session';
import { useLoad } from '@/lib/use-load';

export default function Review() {
  const { api } = useSession();
  const q = useLoad(() => api.products('onayda'), { pollMs: 10000 });
  const list = q.data?.products ?? [];
  return (
    <Screen eyebrow={list.length ? `${list.length} ürün bekliyor` : 'Onay'} title="Onay" refreshing={q.refreshing} onRefresh={q.refresh}>
      {q.error ? <ErrorNote text={q.error} onRetry={q.reload} /> : null}
      {q.loading ? <Loading /> : null}
      {!q.loading && !list.length && !q.error ? (
        <Empty title="Her şey onaylı" text="Yeni çekimden çıkan ürünler burada seni bekler." action={<Button title="Yeni çekim" onPress={() => router.push('/cekim/yeni')} />} />
      ) : null}
      {list.map((p) => (
        <ProductRow key={p.id} p={p} onPress={() => router.push(`/urun/${p.id}`)} />
      ))}
    </Screen>
  );
}
