import { useColorScheme } from 'react-native';

import type { Channel, ListingStatus, OrderStatus, ProductStatus } from './api';

// Kumash marka dili: porselen zemin, mürekkep metin, bordo vurgu. Sunumdaki paletle aynı.
const light = {
  paper: '#EDEFF1',
  card: '#F7F8F9',
  raised: '#FFFFFF',
  ink: '#12141B',
  ink2: '#5C6271',
  line: 'rgba(18,20,27,0.12)',
  accent: '#8C1D35',
  accentSoft: 'rgba(140,29,53,0.09)',
  onAccent: '#FFFFFF',
  ok: '#2F7D5B',
  okSoft: 'rgba(47,125,91,0.12)',
  warn: '#A36A0A',
  warnSoft: 'rgba(163,106,10,0.12)',
  danger: '#B42318',
  scrim: 'rgba(12,14,19,0.55)',
};

const dark: typeof light = {
  paper: '#0C0E13',
  card: '#151821',
  raised: '#1B1F2A',
  ink: '#ECEEF2',
  ink2: '#9399A7',
  line: 'rgba(236,238,242,0.12)',
  accent: '#E5728A',
  accentSoft: 'rgba(229,114,138,0.14)',
  onAccent: '#12141B',
  ok: '#6CC79E',
  okSoft: 'rgba(108,199,158,0.14)',
  warn: '#E3B04B',
  warnSoft: 'rgba(227,176,75,0.14)',
  danger: '#F97066',
  scrim: 'rgba(0,0,0,0.6)',
};

export type Palette = typeof light;

export function useColors(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const DISPLAY = 'Italiana_400Regular';

export const tl = (kurus: number) =>
  (kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺';

export const parseTl = (s: string) => {
  const n = Number(s.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

export const kurusToInput = (k: number) => (k / 100).toFixed(2).replace('.', ',');

export const CHANNEL_LABEL: Record<Channel, string> = { site: 'Kumash sitesi', trendyol: 'Trendyol', instagram: 'Instagram', facebook: 'Facebook' };

export const PRODUCT_STATUS: Record<ProductStatus, string> = { taslak: 'Taslak', onayda: 'Onay bekliyor', yayinda: 'Yayında', arsiv: 'Arşivde' };

export const LISTING_STATUS: Record<ListingStatus, string> = {
  bekliyor: 'Bekliyor',
  yayinda: 'Yayında',
  kimlik_yok: 'Hesap bağlı değil',
  hata: 'Hata',
  reddedildi: 'Reddedildi',
};

export const ORDER_STATUS: Record<OrderStatus, string> = {
  alindi: 'Alındı',
  hazirlaniyor: 'Hazırlanıyor',
  kargoda: 'Kargoda',
  teslim: 'Teslim edildi',
  iptal: 'İptal',
};

export function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'az önce';
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
