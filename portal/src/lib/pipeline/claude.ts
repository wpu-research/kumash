import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { COLORS, PATTERN_NAME, slugify } from "../catalog-data";
import { GARMENTS, PATTERNS, type Garment, type Pattern } from "../garments";
import { prepareForVision } from "./images";
import { PermanentError, type AiProvider, type AnalyzedItem } from "./provider";

// Claude sağlayıcısı: çekim fotoğraflarını tek istekte okur, her parçayı bulur (kutu), özelliklerini
// çıkarır ve Türkçe ürün metnini yazar. Görsel üretmez; manken görselleri render.ts'te çizilir.

const MODEL = "claude-opus-5-5";
const PRICE_IN = 4 / 1e6; // USD / token (Opus 5.5)
const PRICE_OUT = 20 / 1e6;

// Not: SDK'nın zod yardımcısı enum'ları şemada zorunlu kural olarak değil açıklama olarak gönderiyor;
// bu yüzden sınıf alanları serbest metin alınır ve aşağıda normalize edilir.
const ItemSchema = z.object({
  garment: z.string(),
  gender: z.string(),
  photo_index: z.number().int(),
  box: z.object({ x0: z.number().int(), y0: z.number().int(), x1: z.number().int(), y1: z.number().int() }),
  color_name: z.string(),
  color_hex: z.string(),
  pattern: z.string(),
  fabric: z.string(),
  style: z.string(),
  attributes: z.array(z.object({ name: z.string(), value: z.string() })),
  title: z.string(),
  description: z.string(),
  confidence: z.number(),
});

const AnalysisSchema = z.object({
  items: z.array(ItemSchema),
  notes: z.array(z.string()),
});

const SYSTEM = `Sen Kumash adlı Türk giyim markasının ürün kataloğu editörüsün. Sana mağaza çalışanının telefonla çektiği, düz zemine serilmiş kıyafetlerin fotoğrafları gelir. Görevin fotoğraflardaki her satılabilir giysiyi ayrı bir ürün olarak kataloğa hazırlamak.

Her giysi için:
- garment: listedeki en yakın tip. Askılı/kolsuz üst bluz sayılır; trençkot, kaban, şişme mont "mont"; blazer ve hırka benzeri ceketler "ceket"; uzun kollu örme üstler "kazak".
- gender: kesim ve beden görünümüne göre kadin ya da erkek. Emin değilsen kadin seç ve notes alanında belirt.
- photo_index ve box: giysinin göründüğü fotoğrafın sırası (0'dan başlar) ve o fotoğrafa göre 0-1000 ölçekli kutusu (x0,y0 sol üst; x1,y1 sağ alt). Kutu giysinin tamamını, mümkün olduğunca az zeminle kapsasın.
- color_name: renk listesinden en yakın ad (filtrelerde kullanılıyor). color_hex: kumaşın fotoğraftaki gerçek baskın rengi, #RRGGBB.
- pattern: duz, cizgili, puantiyeli veya kareli. Çiçekli ya da başka desenleri en yakına eşle ve attributes'a "Desen" olarak gerçek adını yaz.
- fabric: görünüşe göre Türkçe kumaş adı (Saten, Krep, Viskon, Keten, Pamuk Poplin, Denim, Gabardin, Triko, Yün Karışımlı ...). Fotoğraftan kesin bilinemez; en olası olanı yaz.
- style: kalıp/kesim adı (Midi, Oversize, Slim Fit, Geniş Paça, Kruvaze, Blazer ...).
- attributes: Trendyol özellik alanlarına gidecek, fotoğrafta gerçekten görülen bilgiler: Yaka Tipi, Kol Boyu, Boy, Cep, Kapama, Desen gibi. Görmediğin bilgiyi yazma.
- title: Trendyol tarzı, 3-6 kelime, marka adı ve renk olmadan (ör. "Saten Kruvaze Midi Elbise").
- description: 2-3 cümle, sade ve somut. Fotoğrafta görünen özellikleri anlat. Kumaş bileşimi, ölçü, beden, yıkama talimatı gibi fotoğraftan bilinemeyecek bilgileri uydurma; "kaliteli", "mükemmel" gibi boş övgüler kullanma.
- confidence: 0-1 arası, parçayı doğru tanıdığından ne kadar eminsin.

Aynı giysi birden fazla fotoğrafta görünüyorsa (yakın çekim gibi) tek ürün yaz. Aksesuar, ayakkabı, askı, etiket ve zemin eşyalarını ürün sayma. Fotoğrafta giysi yoksa items boş olsun ve notes'ta nedenini yaz. notes: çalışana kısa uyarılar (bulanıklık, üst üste binme, eksik ışık, emin olunamayan parça).

Garment tipleri: ${GARMENTS.join(", ")}
Renk listesi: ${COLORS.map((c) => `${c.name} ${c.hex}`).join(", ")}
Desenler: ${Object.entries(PATTERN_NAME).map(([k, v]) => `${k}=${v}`).join(", ")}`;

const clamp = (n: number) => Math.max(0, Math.min(1000, Math.round(n)));
const fold = (s: string) => slugify(s).replace(/-/g, "");
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function normGarment(v: string): Garment | null {
  const f = fold(v);
  return (GARMENTS as readonly string[]).includes(f) ? (f as Garment) : null;
}
function normPattern(v: string): Pattern {
  const f = fold(v);
  return (PATTERNS as readonly string[]).includes(f) ? (f as Pattern) : "duz";
}
function normColor(name: string, hex: string) {
  const byName = COLORS.find((c) => fold(c.name) === fold(name));
  if (byName) return byName;
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return COLORS[0];
  const [r, g, b] = rgb(hex);
  return COLORS.reduce((best, c) => {
    const [cr, cg, cb] = rgb(c.hex), [br, bg, bb] = rgb(best.hex);
    return (cr - r) ** 2 + (cg - g) ** 2 + (cb - b) ** 2 < (br - r) ** 2 + (bg - g) ** 2 + (bb - b) ** 2 ? c : best;
  });
}

export const claudeProvider: AiProvider = {
  name: `claude (${MODEL})`,
  async analyze(photos) {
    if (!photos.paths.length) throw new PermanentError("Claude sağlayıcısı için en az bir fotoğraf gerekli.");
    const client = new Anthropic();
    const images = await Promise.all(photos.paths.map(prepareForVision));
    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    images.forEach((data, i) => {
      content.push({ type: "text", text: `Fotoğraf ${i}:` });
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } });
    });
    content.push({ type: "text", text: "Bu çekimdeki giysileri kataloğa hazırla." });

    let res;
    try {
      res = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high", format: betaZodOutputFormat(AnalysisSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content }],
      });
    } catch (err) {
      // 429 / 5xx / bağlantı hatalarını SDK zaten 2 kez yeniden dener; 4xx kalıcıdır
      if (err instanceof Anthropic.AuthenticationError) throw new PermanentError("Claude API anahtarı geçersiz (ANTHROPIC_API_KEY).");
      if (err instanceof Anthropic.BadRequestError) throw new PermanentError(`Claude isteği geçersiz: ${err.message}`);
      throw err;
    }

    const costCents = Math.round((res.usage.input_tokens * PRICE_IN + res.usage.output_tokens * PRICE_OUT) * 100);
    if (res.stop_reason === "refusal") throw new PermanentError("Claude isteği reddetti; fotoğrafları kontrol edin.");
    if (res.stop_reason === "max_tokens") throw new PermanentError("Yanıt kesildi (max_tokens); daha az fotoğrafla deneyin.");
    const out = res.parsed_output;
    if (!out) throw new PermanentError("Claude yanıtı beklenen formatta değil.");

    const notes = [...out.notes];
    const items: AnalyzedItem[] = [];
    for (const it of out.items) {
      const garment = normGarment(it.garment);
      if (!garment) {
        notes.push(`"${it.garment}" tipi katalogda yok, atlandı: ${it.title}`);
        continue;
      }
      const index = items.length;
      const pattern = normPattern(it.pattern);
      const known = normColor(it.color_name, it.color_hex);
      const hex = /^#[0-9a-fA-F]{6}$/.test(it.color_hex) ? it.color_hex.toUpperCase() : known.hex;
      const attrs: Record<string, string> = { Kumaş: it.fabric, Desen: PATTERN_NAME[pattern], Kalıp: it.style };
      for (const a of it.attributes) if (a.name.trim() && a.value.trim()) attrs[a.name.trim()] = a.value.trim();
      const b = it.box;
      const box = b.x1 > b.x0 && b.y1 > b.y0 ? { x0: clamp(b.x0), y0: clamp(b.y0), x1: clamp(b.x1), y1: clamp(b.y1) } : null;
      items.push({
        index,
        garment,
        gender: fold(it.gender).startsWith("erkek") ? "erkek" : "kadin",
        box,
        photoIndex: Math.min(Math.max(0, it.photo_index), photos.paths.length - 1),
        attrs: { color: known.name, colorHex: hex, pattern, fabric: it.fabric, style: it.style, attrs },
        copy: { title: it.title.trim(), description: it.description.trim() },
        confidence: Math.max(0, Math.min(1, it.confidence)),
      });
    }
    return { items, model: res.model, costCents, notes };
  },
};
