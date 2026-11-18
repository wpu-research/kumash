# Kumash

Kumash, tek bir ürün fotoğrafından yapay zekâ ile manken görselleri ve ürün metni üretip ürünü kendi mağazaya ve satış/sosyal kanallarına (Trendyol, Instagram, Facebook) gönderen bir çekim-yayın hattıdır. Bu klasör üç parçadan oluşan bir monorepo'dur.

## Klasör yapısı

| Klasör | İçerik |
| --- | --- |
| `portal/` | Web: Kumash'ın kendi mağazası ve yönetim paneli (Next.js) |
| `atolye/` | Personel mobil uygulaması "Kumash Atölye" (Expo / React Native, iOS + Android + web önizleme) |
| `sunum/` | Tanıtım sunumları ve atölye kabini anlatım videosu (HTML, `.mp4`, `.srt`) |

## Ana özellikler

- **Portal:** mağaza (ana sayfa, listeleme + filtre, ürün, sepet, ödeme, sipariş) ve panel (çekim yükleme ve canlı takip, onay, ürünler, siparişler, iş kayıtları).
- AI hattı: `ANTHROPIC_API_KEY` tanımlıysa çekim fotoğrafları Claude ile okunur (parça, renk, kumaş, desen, Türkçe başlık/açıklama); yoksa mock sağlayıcı çalışır. Manken görselleri şimdilik SVG olarak çizilir.
- Postgres üstünde iş kuyruğu: çekim işleme, kanal yayını, stok senkronu.
- Kanal yayıncıları: site, Trendyol, Instagram, Facebook. Kimlik yoksa durum "kimlik bekleniyor" olur; ödeme "Kart (test)" modundadır.
- **Atölye:** personel girişi, kamera ile çekim, çekim durumunun canlı izlenmesi, onay/yayın/reddetme, ürün ve sipariş yönetimi. Arka uç Supabase'tir.

## Teknoloji

- Portal: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Drizzle ORM, Postgres (geliştirmede gömülü PGlite), Anthropic SDK, pnpm, Docker.
- Atölye: Expo SDK 58, Expo Router, React Native, Supabase (supabase-js, Auth, realtime), TypeScript.

## Kurulum ve çalıştırma

```bash
# Portal
cd portal
pnpm install
pnpm db:reset     # gömülü veritabanı + demo katalog
pnpm dev          # http://localhost:3100  (panel: /panel)

# Atölye
cd atolye
npm install
npx expo start
```

Atölye'nin Supabase bağlantı alanları (`supabaseUrl`, `supabaseAnonKey`, `storeUrl`) `atolye/app.json` içindeki `expo.extra` altında tanımlanır.

## Ortam değişkenleri (portal, yalnız adlar)

`DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`, `AI_PROVIDER`, `TRENDYOL_SUPPLIER_ID`, `TRENDYOL_API_KEY`, `TRENDYOL_API_SECRET`, `INSTAGRAM_BUSINESS_ID`, `INSTAGRAM_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`, `FACEBOOK_PAGE_TOKEN`, `UPLOAD_DIR`, `PORT`

Şablon: `portal/.env.example`. Gerçek değerler depoya konmaz.

## Lisans

Kök için lisans belirtilmemiş. `atolye/LICENSE` dosyası MIT lisansıdır; `portal/` için lisans dosyası yok.
