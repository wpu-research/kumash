# Kumash Atölye

Personelin iOS ve Android uygulaması: ürünü çek, yapay zekâ mankene giydirsin, onayla, siteye, Trendyol'a, Instagram'a ve Facebook'a yayınla.
Arka uç Supabase'tir: tablolara doğrudan supabase-js ile bağlanılır, yazma işlemleri `app_*` RPC fonksiyonlarıyla yapılır.
Oturum Supabase Auth (e-posta + şifre) ile açılır ve kendi kendine yenilenir.

## Ekranlar

- **Giriş:** personel e-postası + şifre. Hesabın `profiles.role` değeri `staff` ya da `admin` değilse uygulamaya girilemez.
- **Çekim:** yeni çekim, son çekimler, kanalların bağlı olup olmadığı.
- **Kamera:** hizalama çerçevesi, önce grup fotoğrafı, sonra en fazla 7 yakın plan; galeriden seçme; fotoğraflar 2000 px'e küçültülüp gönderilir.
- **Çekim durumu:** tanıma, giydirme ve metin adımları Supabase realtime ile canlı izlenir; bulunan ürünler listelenir.
- **Onay / Ürün:** görseller, başlık, fiyat, beden stoğu, yayın kanalları; onayla ve yayınla, reddet, yayından kaldır.
- **Ürünler:** yayındaki ve arşivdeki ürünler.
- **Siparişler:** sipariş ayrıntısı ve durum değiştirme.

## Çalıştırma

```bash
npm install
npx expo start          # telefonda Expo Go ile QR kodu okut
npx expo start --web    # tarayıcıda önizleme
```

Bağlantı bilgileri `app.json` → `expo.extra` altındadır: `supabaseUrl`, `supabaseAnonKey` (anon anahtar istemcide durabilir, erişimi RLS sınırlar) ve
ürün bağlantılarında kullanılan `storeUrl`. Başka bir Supabase projesine (ör. yerel `supabase start`) bağlanmak için bu iki değeri değiştir.

## Kontroller

```bash
npx tsc --noEmit && npx eslint src && npx expo-doctor
```

## Mağazalara çıkış

EAS ile bulutta derlenir, Mac gerekmez:

```bash
npx eas-cli@latest build --platform all
npx eas-cli@latest submit
```

Apple Developer ve Google Play Console hesapları gerekir. Paket kimliği `com.kumash.atolye`.
