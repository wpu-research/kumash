import { Platform } from 'react-native';

// Portal (Railway) üzerindeki /api/app uçlarıyla konuşan istemci.
// Tutarlar kuruş cinsinden tamsayıdır (129900 = 1.299,00 ₺).

export const DEFAULT_SERVER = 'https://kumash-portal-production.up.railway.app';

export type Channel = 'site' | 'trendyol' | 'instagram' | 'facebook';
export type ProductStatus = 'taslak' | 'onayda' | 'yayinda' | 'arsiv';
export type ListingStatus = 'bekliyor' | 'yayinda' | 'kimlik_yok' | 'hata' | 'reddedildi';
export type OrderStatus = 'alindi' | 'hazirlaniyor' | 'kargoda' | 'teslim' | 'iptal';

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
  images: { id: number; kind: 'ham' | 'kesik' | 'manken' | 'kombin' | 'sosyal'; url: string; qc: number | null }[];
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

export type Client = ReturnType<typeof createClient>;

export function createClient(server: string, token: string | null, onUnauthorized: () => void) {
  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${server}/api/app${path}`, {
        ...init,
        headers: {
          ...(init.body && !(init.body instanceof FormData) ? { 'content-type': 'application/json' } : {}),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...init.headers,
        },
      });
    } catch {
      throw new ApiError(0, 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.');
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) onUnauthorized();
    if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `İstek başarısız (${res.status})`);
    return data as T;
  }
  const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

  return {
    server,
    login: (password: string) => call<{ token: string; expiresAt: string }>('/login', json('POST', { password })),
    me: () => call<Me>('/me'),
    shoots: () => call<{ shoots: Shoot[] }>('/shoots'),
    shoot: (id: number) => call<ShootDetail>(`/shoots/${id}`),
    products: (status: ProductStatus) => call<{ products: Product[] }>(`/products?status=${status}`),
    product: (id: number) => call<{ product: Product }>(`/products/${id}`),
    updateProduct: (id: number, patch: { title?: string; description?: string; price?: number; stock?: Record<string, number> }) =>
      call<{ product: Product }>(`/products/${id}`, json('PATCH', patch)),
    publish: (id: number, channels: Channel[]) => call<{ ok: true; channels: Channel[] }>(`/products/${id}/publish`, json('POST', { channels })),
    archive: (id: number) => call<{ product: Product }>(`/products/${id}/archive`, json('POST', {})),
    orders: () => call<{ orders: Order[] }>('/orders'),
    setOrderStatus: (id: number, status: OrderStatus) => call<{ ok: true }>(`/orders/${id}`, json('PATCH', { status })),
    uploadShoot: (photos: { uri: string; name: string }[], note: string, onProgress?: (p: number) => void) =>
      upload(server, token, photos, note, onProgress),
  };
}

// fetch yükleme ilerlemesi vermiyor; XHR ile yüzde gösterilir.
async function upload(server: string, token: string | null, photos: { uri: string; name: string }[], note: string, onProgress?: (p: number) => void) {
  const form = new FormData();
  for (const p of photos) {
    if (Platform.OS === 'web') form.append('photos', await (await fetch(p.uri)).blob(), p.name);
    else form.append('photos', { uri: p.uri, name: p.name, type: 'image/jpeg' } as unknown as Blob);
  }
  if (note) form.append('note', note);
  return new Promise<{ id: number }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${server}/api/app/shoots`);
    if (token) xhr.setRequestHeader('authorization', `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => {
      let data: { id?: number; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && data.id) resolve({ id: data.id });
      else reject(new ApiError(xhr.status, data.error ?? `Yükleme başarısız (${xhr.status})`));
    };
    xhr.onerror = () => reject(new ApiError(0, 'Yükleme sırasında bağlantı koptu.'));
    xhr.send(form);
  });
}
