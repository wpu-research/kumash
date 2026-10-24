// Ürün görseli üretici. Gerçek try-on modeli bağlanana kadar mock AI sağlayıcısı
// ürün görsellerini buradan çizer: "duz" (düz çekim, ham foto yerine) ve "manken" (AI manken).
// Tüm çizimler 300x400 koordinat sisteminde, mankenle aynı ölçekte.

export const GARMENTS = ["tisort", "bluz", "gomlek", "kazak", "ceket", "mont", "elbise", "etek", "pantolon", "sort"] as const;
export type Garment = (typeof GARMENTS)[number];
export const PATTERNS = ["duz", "cizgili", "puantiyeli", "kareli"] as const;
export type Pattern = (typeof PATTERNS)[number];
export type View = "duz" | "manken" | "arka";

const TOPS: Garment[] = ["tisort", "bluz", "gomlek", "kazak", "ceket", "mont"];
const BOTTOMS: Garment[] = ["etek", "pantolon", "sort"];

export const isTop = (g: Garment) => TOPS.includes(g);
export const isBottom = (g: Garment) => BOTTOMS.includes(g);

type Spec = { sleeve: "none" | "short" | "long"; hem: number; flare: number; neck: "crew" | "v" | "collar" | "lapel" };

const TOP_SPECS: Record<string, Spec> = {
  tisort: { sleeve: "short", hem: 252, flare: 0, neck: "crew" },
  bluz: { sleeve: "short", hem: 246, flare: 8, neck: "v" },
  gomlek: { sleeve: "long", hem: 258, flare: 0, neck: "collar" },
  kazak: { sleeve: "long", hem: 254, flare: 0, neck: "crew" },
  ceket: { sleeve: "long", hem: 280, flare: 4, neck: "lapel" },
  mont: { sleeve: "long", hem: 300, flare: 6, neck: "collar" },
};

function topPath(s: Spec, worn: boolean): string {
  const L = 100, R = 200, Y = 108, armpit = 150;
  const hl = L + 2 - s.flare, hr = R - 2 + s.flare;
  if (s.sleeve === "none") {
    return `M${L + 10} ${Y}L${R - 10} ${Y}Q${R + 4} ${armpit} ${hr} ${s.hem}Q150 ${s.hem + 8} ${hl} ${s.hem}Q${L - 4} ${armpit} ${L + 10} ${Y}Z`;
  }
  if (worn) {
    const end = s.sleeve === "short" ? 166 : 268;
    return [
      `M${L} ${Y}Q150 ${Y - 12} ${R} ${Y}`,
      `L${R + 16} ${Y + 8}L${R + 20} ${end}L${R + 3} ${end}L${R} ${armpit + 4}`,
      `L${hr} ${s.hem}Q150 ${s.hem + 8} ${hl} ${s.hem}`,
      `L${L} ${armpit + 4}L${L - 3} ${end}L${L - 20} ${end}L${L - 16} ${Y + 8}Z`,
    ].join("");
  }
  if (s.sleeve === "short") {
    return `M${L} ${Y}Q150 ${Y - 12} ${R} ${Y}L${R + 32} ${armpit}L${R + 14} ${armpit + 16}L${R} ${armpit}L${hr} ${s.hem}Q150 ${s.hem + 8} ${hl} ${s.hem}L${L} ${armpit}L${L - 14} ${armpit + 16}L${L - 32} ${armpit}Z`;
  }
  return `M${L} ${Y}Q150 ${Y - 12} ${R} ${Y}L${R + 26} ${armpit - 10}L${R + 40} ${s.hem}L${R + 20} ${s.hem + 4}L${R + 4} ${armpit + 14}L${hr} ${s.hem}Q150 ${s.hem + 8} ${hl} ${s.hem}L${L - 4} ${armpit + 14}L${L - 20} ${s.hem + 4}L${L - 40} ${s.hem}L${L - 26} ${armpit - 10}Z`;
}

const PATHS: Record<string, string> = {
  elbise: "M114 106L132 104Q150 118 168 104L186 106L192 150Q186 190 190 205L234 334Q150 348 66 334L110 205Q114 190 108 150Z",
  etek: "M112 198Q150 204 188 198L222 312Q150 324 78 312Z",
  pantolon: "M110 198Q150 204 190 198L196 386L160 388L151 254L149 254L140 388L104 386Z",
  sort: "M110 198Q150 204 190 198L200 286L156 290L150 252L144 290L100 286Z",
};

function garmentPath(g: Garment, worn: boolean) {
  return TOP_SPECS[g] ? topPath(TOP_SPECS[g], worn) : PATHS[g];
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amt * (amt > 0 ? 255 - v : v))));
  const r = ch((n >> 16) & 255), gg = ch((n >> 8) & 255), b = ch(n & 255);
  return `#${((r << 16) | (gg << 8) | b).toString(16).padStart(6, "0")}`;
}

function details(g: Garment, color: string): string {
  const dark = shade(color, -0.35), light = shade(color, 0.25);
  const line = (d: string, w = 1.2, c = dark, o = 0.7) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round"/>`;
  const spec = TOP_SPECS[g];
  let out = "";
  if (spec) {
    if (spec.neck === "crew") out += `<path d="M132 103Q150 122 168 103Q150 110 132 103Z" fill="${dark}"/>`;
    if (spec.neck === "v") out += `<path d="M134 103L150 132L166 103Q150 110 134 103Z" fill="${dark}"/>`;
    if (spec.neck === "collar") out += `<path d="M130 101L150 124L140 132L124 108Z" fill="${light}"/><path d="M170 101L150 124L160 132L176 108Z" fill="${light}"/>` + line(`M150 124V${spec.hem}`, 1);
    if (spec.neck === "lapel") out += `<path d="M128 100L150 196L132 150L118 112Z" fill="${dark}" fill-opacity=".55"/><path d="M172 100L150 196L168 150L182 112Z" fill="${dark}" fill-opacity=".55"/>` + line(`M150 196V${spec.hem}`, 1.4) + line("M114 236H136") + line("M164 236H186");
    if (g === "gomlek" || g === "ceket") for (let y = 140; y < spec.hem - 10; y += 26) out += `<circle cx="${g === "ceket" ? 155 : 150}" cy="${y + (g === "ceket" ? 70 : 0)}" r="2.2" fill="${dark}" fill-opacity="${g === "ceket" && y > 160 ? 0 : 0.8}"/>`;
    if (g === "kazak") for (let x = 106; x < 196; x += 6) out += line(`M${x} ${spec.hem - 12}V${spec.hem + 2}`, 1, dark, 0.45);
    if (g === "mont") for (let y = 140; y < spec.hem; y += 26) out += line(`M98 ${y}Q150 ${y + 6} 202 ${y}`, 1.4, dark, 0.5);
  }
  if (g === "elbise") out += line("M110 205Q150 214 190 205", 1.4);
  if (g === "etek") out += `<path d="M112 198Q150 204 188 198L189 210Q150 216 111 210Z" fill="${dark}" fill-opacity=".5"/>`;
  if (g === "pantolon" || g === "sort") out += `<path d="M110 198Q150 204 190 198L190.6 210Q150 216 109.6 210Z" fill="${dark}" fill-opacity=".5"/>` + line("M150 212V246", 1.2) + line("M118 214Q126 228 140 222", 1);
  return out;
}

function patternDef(id: string, p: Pattern, color: string) {
  const c = shade(color, color === "#F2EFEA" || parseInt(color.slice(1), 16) > 0xb0b0b0 ? -0.45 : 0.55);
  if (p === "cizgili") return `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="4" fill="${c}" fill-opacity=".85"/></pattern>`;
  if (p === "puantiyeli") return `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="2.4" fill="${c}"/><circle cx="12" cy="12" r="2.4" fill="${c}"/></pattern>`;
  if (p === "kareli") return `<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="7" fill="${c}" fill-opacity=".45"/><rect width="7" height="22" fill="${c}" fill-opacity=".45"/><rect x="14" width="1.5" height="22" fill="${c}" fill-opacity=".6"/></pattern>`;
  return "";
}

function piece(uid: string, g: Garment, color: string, pattern: Pattern, sheen: number, worn: boolean) {
  const d = garmentPath(g, worn);
  const pid = `${uid}p`, sid = `${uid}s`;
  return {
    defs:
      patternDef(pid, pattern, color) +
      `<linearGradient id="${sid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${0.1 + sheen * 0.35}"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#fff" stop-opacity="${sheen * 0.22}"/><stop offset="1" stop-color="#000" stop-opacity="${0.18 + sheen * 0.1}"/></linearGradient>`,
    body:
      `<path d="${d}" fill="${color}"/>` +
      (pattern !== "duz" ? `<path d="${d}" fill="url(#${pid})"/>` : "") +
      `<path d="${d}" fill="url(#${sid})"/>` +
      details(g, color),
  };
}

const MANNEQUIN = `
<g fill="url(#skin)">
  <ellipse cx="150" cy="54" rx="23" ry="28"/>
  <path d="M141 76H159L161 104H139Z"/>
  <path d="M100 108Q150 96 200 108Q207 160 190 205Q200 230 198 252L102 252Q100 230 110 205Q93 160 100 108Z"/>
  <ellipse cx="101" cy="115" rx="11" ry="9"/><ellipse cx="199" cy="115" rx="11" ry="9"/>
  <path d="M104 248L148 248L142 392L118 392Z"/><path d="M152 248L196 248L182 392L158 392Z"/>
</g>`;

// Düz çekimde giysiyi kadrajın ortasına almak için [dikey merkez, ölçek]
const FLAT: Record<Garment, [number, number]> = {
  tisort: [180, 1.25], bluz: [178, 1.25], gomlek: [182, 1.15], kazak: [182, 1.15], ceket: [192, 1.1], mont: [202, 1.05],
  elbise: [226, 1.1], etek: [261, 1.4], pantolon: [293, 1.4], sort: [244, 1.5],
};

export type ImageParams = { g: Garment; color: string; pattern: Pattern; sheen: number; view: View };

export function renderGarmentSvg({ g, color, pattern, sheen, view }: ImageParams): string {
  const worn = view !== "duz";
  const parts: { defs: string; body: string }[] = [];
  if (worn) {
    // Tekli ürün mankende nötr bir tamamlayıcıyla gösterilir (kombin sayfası gerçek eşleşmeleri kullanır)
    if (isTop(g)) parts.push(piece("b", "pantolon", "#2C3B5E", "duz", 0.1, true));
    if (isBottom(g)) parts.push(piece("t", "tisort", "#F2EFEA", "duz", 0.1, true));
  }
  parts.push(piece("m", g, color, pattern, sheen, worn));
  const bg = worn
    ? `<radialGradient id="bg" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#F1ECE6"/><stop offset="1" stop-color="#D9CFC5"/></radialGradient>`
    : `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F5F2"/><stop offset="1" stop-color="#ECE8E3"/></linearGradient>`;
  const skin = `<linearGradient id="skin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9C9B9"/><stop offset=".5" stop-color="#EEE3D7"/><stop offset="1" stop-color="#CDBBA9"/></linearGradient>`;
  const shadow = `<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="${worn ? 2 : 6}" stdDeviation="${worn ? 2 : 6}" flood-opacity="${worn ? 0.18 : 0.22}"/></filter>`;
  const scene = worn
    ? `<ellipse cx="150" cy="394" rx="70" ry="7" fill="#000" fill-opacity=".12"/>${view === "arka" ? `<g transform="translate(300 0) scale(-1 1)">` : "<g>"}${MANNEQUIN}<g filter="url(#sh)">${parts.map((p) => p.body).join("")}</g></g>`
    : `<g filter="url(#sh)" transform="translate(150 200) scale(${FLAT[g][1]}) translate(-150 -${FLAT[g][0]})">${parts.map((p) => p.body).join("")}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="600" height="800"><defs>${bg}${skin}${shadow}${parts.map((p) => p.defs).join("")}</defs><rect width="300" height="400" fill="url(#bg)"/>${scene}</svg>`;
}

export function garmentImageUrl(p: Omit<ImageParams, "sheen"> & { sheen?: number }) {
  const q = new URLSearchParams({ g: p.g, c: p.color.replace("#", ""), p: p.pattern, s: String(p.sheen ?? 0.2), v: p.view });
  return `/img/g?${q.toString()}`;
}

// Kumaş adına göre parlaklık: saten parlak, yün ve keten mat.
export function sheenFor(fabric: string) {
  const f = fabric.toLowerCase();
  if (f.includes("saten") || f.includes("ipek")) return 0.9;
  if (f.includes("deri")) return 0.6;
  if (f.includes("denim") || f.includes("gabardin")) return 0.25;
  if (f.includes("yün") || f.includes("triko") || f.includes("keten")) return 0.05;
  return 0.18;
}
