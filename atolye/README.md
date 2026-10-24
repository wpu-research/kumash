# Kumash Atölye

Personelin iOS ve Android uygulaması: ürünü çek, yapay zekâ mankene giydirsin, onayla, siteye, Trendyol'a, Instagram'a ve Facebook'a yayınla.
Arka uç `../portal` içindeki `/api/app` uçlarıdır (Bearer token, 30 gün).

## Ekranlar

- **Giriş:** panel şifresi; sunucu adresi varsayılan olarak canlı portal.
- **Çekim:** yeni çekim, son çekimler, kanalların bağlı olup olmadığı.
- **Kamera:** hizalama çerçevesi, önce grup fotoğrafı, sonra en fazla 7 yakın plan; galeriden seçme; fotoğraflar 2000 px'e küçültülüp gönderilir.
- **Çekim durumu:** tanıma, giydirme ve metin adımları canlı izlenir; bulunan ürünler listelenir.
- **Onay / Ürün:** görseller, başlık, fiyat, beden stoğu, yayın kanalları; onayla ve yayınla, reddet, yayından kaldır.
- **Ürünler:** yayındaki ve arşivdeki ürünler.
- **Siparişler:** sipariş ayrıntısı ve durum değiştirme.

## Çalıştırma

```bash
npm install
npx expo start          # telefonda Expo Go ile QR kodu okut
npx expo start --web    # tarayıcıda önizleme
```

Yerel portala bağlanmak için giriş ekranında "Sunucu adresini değiştir" ile bilgisayarın yerel ağ adresini gir (ör. `http://192.168.1.20:3100`).

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
