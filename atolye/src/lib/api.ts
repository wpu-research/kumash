import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient as createSupabase, type SupabaseClient } from '@supabase/supabase-js';

// Supabase'e doğrudan bağlanan istemci. Yüzeyi eski REST sürümüyle aynı:
// ekranlar `api.products('onayda')`, `api.publish(id, kanallar)` gibi çağırmaya devam eder.
// Tutarlar kuruş cinsinden tamsayıdır (129900 = 1.299,00 ₺).

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  storeUrl?: string;
};

export const SUPABASE_URL = extra.supabaseUrl ?? '';
export const SUPABASE_ANON_KEY = extra.supabaseAnonKey ?? '';
// Ürünün mağazadaki adresi; yalnız "sitede gör" bağlantısı için.
export const STORE_URL = (extra.storeUrl ?? '').replace(/\/+$/, '');

export type Channel = 'site' | 'trendyol' | 'instagram' | 'facebook';
export type ProductStatus = 'taslak' | 'onayda' | 'yayinda' | 'arsiv';
export type ListingStatus = 'bekliyor' | 'yayinda' | 'kimlik_yok' | 'hata' | 'reddedildi';
export type OrderStatus = 'alindi' | 'hazirlaniyor' | 'kargoda' | 'teslim' | 'iptal';
export type AssetKind = 'ham' | 'kesik' | 'manken' | 'kombin' | 'sosyal';

export type Product = {
  id: number;
  slug: string;
  code: string;
  title: string;
  description: string;
  price: number;
  comparePrice: number | null;
  status: ProductStatus;
  color: string;
  colorHex: string;
  fabric: string;
  fit: string;
  pattern: string;
  shootId: number | null;
  category: { name: string; gender: 'kadin' | 'erkek'; garment: string };
  url: string;
  images: { id: number; kind: AssetKind; url: string; qc: number | null }[];
  variants: { id: number; size: string; stock: number }[];
  listings: { channel: Channel; status: ListingStatus; error: string | null }[];
  createdAt: string;
  publishedAt: string | null;
};

export type Shoot = {
  id: number;
  status: 'yuklendi' | 'isleniyor' | 'tamamlandi' | 'hata';
  note: string | null;
  createdAt: string;
  photos: string[];
  products?: number;
};

export type ShootDetail = {
  shoot: Shoot;
  job: { status: string; error: string | null; log: { at: string; msg: string }[]; costCents: number } | null;
  products: Product[];
};

export type Order = {
  id: number;
  no: string;
  channel: Channel;
  status: OrderStatus;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  total: number;
  shipping: number;
  payment: string;
  createdAt: string;
  items: { productId: number; title: string; size: string; qty: number; price: number }[];
};

export type Me = { store: string; ai: string; channels: { channel: Channel; ready: boolean }[] };

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const CHANNELS: Channel[] = ['site', 'trendyol', 'instagram', 'facebook'];

// Supabase hatalarını ekranların beklediği tek tip hataya çevirir.
function fail(err: { message?: string; code?: string } | null, fallback: string): never {
  const msg = err?.message ?? fallback;
  if (/fetch|network/i.test(msg)) throw new ApiError(0, 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.');
  if (err?.code === 'PGRST116') throw new ApiError(404, 'Kayıt bulunamadı');
  if (/jwt|session|not authenticated/i.test(msg)) throw new ApiError(401, 'Oturum geçersiz, tekrar giriş yapın.');
  throw new ApiError(400, msg);
}

function unwrap<T>(res: { data: T | null; error: { message?: string; code?: string } | null }, fallback: string): T {
  if (res.error || res.data == null) fail(res.error, fallback);
  return res.data;
}

export function createSupabaseClient() {
  return createSupabase(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}

// --- satır → ekran tipi dönüşümleri -------------------------------------------------

type Row = Record<string, any>;

const code = (id: number) => `KMS-${String(id).padStart(5, '0')}`;

function toProduct(r: Row): Product {
  const cat = r.categories ?? {};
  return {
    id: r.id,
    slug: r.slug,
    code: code(r.id),
    title: r.title,
    description: r.description ?? '',
    price: r.price,
    comparePrice: r.compare_price ?? null,
    status: r.status,
    color: r.color,
    colorHex: r.color_hex,
    fabric: r.fabric,
    fit: r.fit,
    pattern: r.pattern,
    shootId: r.shoot_id ?? null,
    category: { name: cat.name ?? '', gender: cat.gender ?? 'kadin', garment: cat.garment ?? '' },
    url: STORE_URL ? `${STORE_URL}/urun/${r.slug}` : '',
    images: (r.assets ?? [])
      .slice()
      .sort((a: Row, b: Row) => a.sort - b.sort || a.id - b.id)
      .map((a: Row) => ({ id: a.id, kind: a.kind, url: a.url, qc: a.qc_score ?? null })),
    variants: (r.variants ?? [])
      .slice()
      .sort((a: Row, b: Row) => a.id - b.id)
      .map((v: Row) => ({ id: v.id, size: v.size, stock: v.stock })),
    listings: (r.channel_listings ?? []).map((l: Row) => ({ channel: l.channel, status: l.status, error: l.last_error ?? null })),
    createdAt: r.created_at,
    publishedAt: r.published_at ?? null,
  };
}

function toShoot(r: Row): Shoot {
  return {
    id: r.id,
    status: r.status,
    note: r.note ?? null,
    createdAt: r.created_at,
    photos: r.photo_urls ?? [],
    products: Array.isArray(r.products) ? r.products.length : r.products?.[0]?.count,
  };
}

function toOrder(r: Row): Order {
  return {
    id: r.id,
    no: r.no,
    channel: r.channel,
    status: r.status,
    customerName: r.customer_name,
    phone: r.phone,
    city: r.city,
    address: r.address,
    total: r.total,
    shipping: r.shipping,
    payment: r.payment,
    createdAt: r.created_at,
    items: (r.order_items ?? []).map((i: Row) => ({
      productId: i.product_id,
      title: i.title,
      size: i.size,
      qty: i.qty,
      price: i.price,
    })),
  };
}

const PRODUCT_SELECT =
  '*, categories(name, gender, garment), assets(id, kind, url, qc_score, sort), variants(id, size, stock), channel_listings(channel, status, last_error)';

// --- istemci -------------------------------------------------------------------------

export type Client = ReturnType<typeof createClient>;

export function createClient(sb: SupabaseClient) {
  const products = async (where: { status?: ProductStatus; ids?: number[]; shootId?: number }) => {
    let q = sb.from('products').select(PRODUCT_SELECT);
    if (where.ids) q = q.in('id', where.ids.length ? where.ids : [-1]);
    else if (where.shootId != null) q = q.eq('shoot_id', where.shootId);
    else if (where.status) q = q.eq('status', where.status);
    // Onay kuyruğu ve çekim içi liste çekim sırasını korur; diğerleri yeniden eskiye.
    const asc = where.status === 'onayda' || where.shootId != null;
    const rows = unwrap(await q.order('id', { ascending: asc }).limit(100), 'Ürünler alınamadı');
    return (rows as Row[]).map(toProduct);
  };

  return {
    // Eski sürümdeki `server` alanının karşılığı; ekranlarda bilgi amaçlı gösteriliyordu.
    server: SUPABASE_URL,

    login: async (email: string, password: string) => {
      const { data, error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (/invalid login/i.test(error.message)) throw new ApiError(401, 'E-posta ya da şifre hatalı.');
        fail(error, 'Giriş yapılamadı');
      }
      // Personel olmayan bir hesap (ör. mağazadan kayıt olmuş müşteri) uygulamaya giremez.
      const { data: profile } = await sb.from('profiles').select('role').eq('id', data.user!.id).maybeSingle();
      if (!profile || !['staff', 'admin'].includes(profile.role)) {
        await sb.auth.signOut();
        throw new ApiError(403, 'Bu hesabın atölye yetkisi yok.');
      }
      return { expiresAt: new Date((data.session!.expires_at ?? 0) * 1000).toISOString() };
    },

    signOut: () => sb.auth.signOut(),

    me: async (): Promise<Me> => {
      const [{ data: user }, creds] = await Promise.all([
        sb.auth.getUser(),
        sb.from('channel_credentials').select('channel, ready'),
      ]);
      const ready = new Map<string, boolean>((creds.data ?? []).map((c: Row) => [c.channel, !!c.ready]));
      return {
        store: user.user?.email ?? 'Kumash',
        ai: 'supabase',
        channels: CHANNELS.map((channel) => ({ channel, ready: ready.get(channel) ?? false })),
      };
    },

    shoots: async () => {
      const rows = unwrap(
        await sb.from('shoots').select('*, products(count)').order('id', { ascending: false }).limit(50),
        'Çekimler alınamadı',
      );
      return { shoots: (rows as Row[]).map(toShoot) };
    },

    shoot: async (id: number): Promise<ShootDetail> => {
      const [shootRes, jobRes, items] = await Promise.all([
        sb.from('shoots').select('*').eq('id', id).single(),
        sb
          .from('jobs')
          .select('status, error, log, cost_cents')
          .eq('type', 'shoot_process')
          .contains('payload', { shootId: id })
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle(),
        products({ shootId: id }),
      ]);
      const shoot = unwrap(shootRes, 'Çekim bulunamadı') as Row;
      const j = jobRes.data as Row | null;
      return {
        shoot: toShoot(shoot),
        job: j ? { status: j.status, error: j.error ?? null, log: j.log ?? [], costCents: j.cost_cents ?? 0 } : null,
        products: items,
      };
    },

    products: async (status: ProductStatus) => ({ products: await products({ status }) }),

    product: async (id: number) => {
      const [p] = await products({ ids: [id] });
      if (!p) throw new ApiError(404, 'Ürün bulunamadı');
      return { product: p };
    },

    updateProduct: async (
      id: number,
      patch: { title?: string; description?: string; price?: number; stock?: Record<string, number> },
    ) => {
      unwrap(await sb.rpc('app_update_product', { p_product_id: id, p_patch: patch }), 'Ürün güncellenemedi');
      const [p] = await products({ ids: [id] });
      if (!p) throw new ApiError(404, 'Ürün bulunamadı');
      return { product: p };
    },

    publish: async (id: number, channels: Channel[]) => {
      const { error } = await sb.rpc('app_publish_product', { p_product_id: id, p_channels: channels });
      if (error) fail(error, 'Yayınlanamadı');
      return { ok: true as const, channels };
    },

    archive: async (id: number) => {
      const { error } = await sb.rpc('app_archive_product', { p_product_id: id });
      if (error) fail(error, 'Arşivlenemedi');
      const [p] = await products({ ids: [id] });
      if (!p) throw new ApiError(404, 'Ürün bulunamadı');
      return { product: p };
    },

    orders: async () => {
      const rows = unwrap(
        await sb
          .from('orders')
          .select('*, order_items(product_id, title, size, qty, price)')
          .order('id', { ascending: false })
          .limit(100),
        'Siparişler alınamadı',
      );
      return { orders: (rows as Row[]).map(toOrder) };
    },

    setOrderStatus: async (id: number, status: OrderStatus) => {
      const { error } = await sb.rpc('app_set_order_status', { p_order_id: id, p_status: status });
      if (error) fail(error, 'Sipariş durumu değiştirilemedi');
      return { ok: true as const };
    },

    uploadShoot: async (photos: { uri: string; name: string }[], note: string, onProgress?: (p: number) => void) => {
      // Storage ilerleme yüzdesi vermiyor; fotoğraf başına ilerleme bildiriliyor.
      const stamp = Date.now();
      const urls: string[] = [];
      for (const [i, photo] of photos.entries()) {
        const path = `${stamp}/${String(i + 1).padStart(2, '0')}-${photo.name}`;
        const body = await (await fetch(photo.uri)).arrayBuffer();
        const { error } = await sb.storage.from('shoots').upload(path, body, { contentType: 'image/jpeg', upsert: true });
        if (error) fail(error, 'Fotoğraf yüklenemedi');
        urls.push(sb.storage.from('shoots').getPublicUrl(path).data.publicUrl);
        onProgress?.((i + 1) / photos.length);
      }
      const id = unwrap(await sb.rpc('app_create_shoot', { p_note: note || null, p_photo_urls: urls }), 'Çekim açılamadı');
      return { id: Number(id) };
    },

    // Çekim ilerlemesini yoklama yerine canlı izlemek için. Aboneliği kapatan işlevi döndürür.
    watchShoot: (id: number, onChange: () => void) => {
      const ch = sb
        .channel(`shoot-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shoots', filter: `id=eq.${id}` }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `shoot_id=eq.${id}` }, onChange)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, onChange)
        .subscribe();
      return () => void sb.removeChannel(ch);
    },
  };
}
