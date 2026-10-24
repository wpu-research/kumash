# Kumash Portal

Kumash'ın kendi mağazası ve yönetim paneli: tek fotoğraftan AI manken görselleri üretip
ürünü kendi siteye, Trendyol'a ve Instagram'a gönderen hat.

## Çalıştırma

```bash
pnpm install
pnpm db:reset      # gömülü Postgres (./.data) kurar ve 135 ürünlük demo katalog yükler
pnpm dev           # http://localhost:3100
```

- Mağaza: `/` · Panel: `/panel` (geliştirmede şifre `kumash`, `ADMIN_PASSWORD` ile değişir)
- `DATABASE_URL` boşsa PGlite kullanılır. Gömülü veritabanı tek süreçlidir: `db:reset` / `db:seed`
  çalıştırmadan önce dev sunucusunu durdurun.
- Ortam değişkenleri: `.env.example`

## Yapı

| Klasör | İçerik |
| --- | --- |
| `src/app/(store)` | Mağaza: ana sayfa, listeleme + filtre, ürün, sepet, ödeme, sipariş |
| `src/app/panel` | Panel: özet, çekim yükleme + canlı takip, onay, ürünler, siparişler, iş kayıtları |
| `src/db` | Drizzle şeması, bağlantı (Postgres / PGlite), seed |
| `src/lib/pipeline` | AI sağlayıcı arabirimi + mock sağlayıcı |
| `src/lib/jobs.ts` | Postgres tablosu üstünde iş kuyruğu (çekim işleme, yayın, stok senkronu) |
| `src/lib/publishers.ts` | Kanal yayıncıları: site, Trendyol, Instagram |
| `src/lib/garments.ts` | Gerçek model bağlanana kadar ürün görsellerini çizen SVG üretici |

## Şu an mock olanlar

- **AI sağlayıcı**: `ANTHROPIC_API_KEY` tanımlıysa Claude (`claude-opus-5-5`, `src/lib/pipeline/claude.ts`)
  çekim fotoğraflarını tek istekte okur: parçaları ve kutularını bulur, renk/kumaş/desen/kalıbı çıkarır,
  Türkçe başlık ve açıklama yazar. Her parçanın fotoğraftan gerçek kesiti "düz çekim" olarak eklenir.
  Anahtar yoksa mock sağlayıcı fotoğrafa bakmadan örnek parçalar üretir.
- **Manken görselleri**: Claude görsel üretmez; manken görselleri Claude'un okuduğu renk ve desenle
  SVG olarak çizilir. Gerçek try-on modeli (FASHN, Vertex AI) `renderItemImages`'ın yerine geçecek.
- **Trendyol / Instagram**: kimlik yoksa ürün `kimlik_yok` olarak işaretlenir; gerçek API çağrıları Faz 2.
- **Ödeme**: "Kart (test)" kart bilgisi almaz; iyzico/PayTR bağlantısı yapılacak.

## Deploy (Railway)

Servis kök dizini `portal/`, builder `Dockerfile`. Gerekli değişkenler: `DATABASE_URL`, `ADMIN_PASSWORD`,
`SESSION_SECRET`, `UPLOAD_DIR` (volume yolu, ör. `/data/uploads`). Migration'lar ilk bağlantıda uygulanır;
demo katalog için bir kez `pnpm db:seed` çalıştırılır.
