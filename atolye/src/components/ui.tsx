import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Product } from '@/lib/api';
import { DISPLAY, PRODUCT_STATUS, tl, useColors, type Palette } from '@/lib/theme';

export function Screen({
  title,
  eyebrow,
  right,
  children,
  refreshing,
  onRefresh,
  footer,
  scroll = true,
}: {
  title?: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
  scroll?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const head = title ? (
    <View style={styles.head}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Label>{eyebrow}</Label> : null}
        <Text style={[styles.title, { color: c.ink }]} numberOfLines={2}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  ) : null;
  const pad = { paddingTop: insets.top + 12, paddingBottom: (footer ? 120 : 32) + insets.bottom };
  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.body, pad]}
          contentInsetAdjustmentBehavior="never"
          refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.ink2} /> : undefined}>
          {head}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, pad, { flex: 1 }]}>
          {head}
          {children}
        </View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: c.paper, borderTopColor: c.line }]}>{footer}</View>
      ) : null}
    </View>
  );
}

export function Label({ children, color, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return <Text style={[styles.label, { color: color ?? c.ink2 }, style]}>{children}</Text>;
}

export function Display({ children, size = 34, style }: { children: ReactNode; size?: number; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return <Text style={[{ fontFamily: DISPLAY, fontSize: size, lineHeight: size * 1.08, color: c.ink }, style]}>{children}</Text>;
}

export function Body({ children, muted, style, numberOfLines }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle>; numberOfLines?: number }) {
  const c = useColors();
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontSize: 15, lineHeight: 21, color: muted ? c.ink2 : c.ink }, style]}>
      {children}
    </Text>
  );
}

type BtnKind = 'primary' | 'accent' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  kind = 'primary',
  busy,
  disabled,
  style,
  icon,
}: {
  title: string;
  onPress: () => void;
  kind?: BtnKind;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
}) {
  const c = useColors();
  const bg: Record<BtnKind, string> = { primary: c.ink, accent: c.accent, ghost: 'transparent', danger: 'transparent' };
  const fg: Record<BtnKind, string> = { primary: c.paper, accent: c.onAccent, ghost: c.ink, danger: c.danger };
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg[kind], borderColor: kind === 'ghost' ? c.line : kind === 'danger' ? c.danger : bg[kind] },
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.8 },
        style,
      ]}>
      {busy ? <ActivityIndicator color={fg[kind]} /> : icon}
      <Text style={[styles.btnText, { color: fg[kind] }]}>{title}</Text>
    </Pressable>
  );
}

export function Pill({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'ok' | 'warn' | 'accent' | 'danger' }) {
  const c = useColors();
  const map = {
    neutral: [c.line, c.ink2],
    ok: [c.okSoft, c.ok],
    warn: [c.warnSoft, c.warn],
    accent: [c.accentSoft, c.accent],
    danger: [c.accentSoft, c.danger],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const c = useColors();
  const base = [styles.card, { backgroundColor: c.card, borderColor: c.line }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [...base, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.empty, { borderColor: c.line }]}>
      <Display size={28} style={{ textAlign: 'center' }}>
        {title}
      </Display>
      {text ? (
        <Body muted style={{ textAlign: 'center' }}>
          {text}
        </Body>
      ) : null}
      {action}
    </View>
  );
}

export function ErrorNote({ text, onRetry }: { text: string; onRetry?: () => void }) {
  const c = useColors();
  return (
    <View style={[styles.err, { backgroundColor: c.accentSoft }]}>
      <Body style={{ color: c.danger, flex: 1 }}>{text}</Body>
      {onRetry ? (
        <Pressable onPress={onRetry} hitSlop={8}>
          <Text style={{ color: c.danger, fontWeight: '600' }}>Tekrar dene</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Loading() {
  const c = useColors();
  return (
    <View style={{ paddingVertical: 48, alignItems: 'center' }}>
      <ActivityIndicator color={c.ink2} />
    </View>
  );
}

export const statusTone = (s: Product['status']) => (s === 'yayinda' ? 'ok' : s === 'onayda' ? 'warn' : 'neutral');

export function ProductRow({ p, onPress }: { p: Product; onPress: () => void }) {
  const c = useColors();
  const cover = p.images.find((i) => i.kind === 'manken') ?? p.images[0];
  const stock = p.variants.reduce((a, v) => a + v.stock, 0);
  return (
    <Card onPress={onPress} style={styles.row}>
      <Image source={cover?.url} style={[styles.thumb, { backgroundColor: c.line }]} contentFit="cover" transition={150} />
      <View style={{ flex: 1, gap: 4 }}>
        <Label>
          {p.code} · {p.category.gender === 'kadin' ? 'Kadın' : 'Erkek'} {p.category.name}
        </Label>
        <Body numberOfLines={2} style={{ fontWeight: '600' }}>
          {p.title}
        </Body>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ color: c.ink, fontWeight: '600', fontVariant: ['tabular-nums'] }}>{tl(p.price)}</Text>
          <Text style={{ color: c.ink2, fontSize: 13 }}>{stock} adet</Text>
          <Pill text={PRODUCT_STATUS[p.status]} tone={statusTone(p.status)} />
        </View>
      </View>
    </Card>
  );
}

export function Swatch({ hex, size = 12, c }: { hex: string; size?: number; c: Palette }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: hex, borderWidth: 1, borderColor: c.line }} />;
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 18, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 6 },
  title: { fontFamily: DISPLAY, fontSize: 44, lineHeight: 48 },
  label: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '500' },
  btn: {
    minHeight: 52,
    borderRadius: 999,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
  },
  btnText: { fontSize: 15.5, fontWeight: '600' },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  pillText: { fontSize: 11.5, fontWeight: '600' },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 72, height: 96, borderRadius: 10 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 18, padding: 28, gap: 12, alignItems: 'center' },
  err: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12, alignItems: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 18, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 10 },
});
