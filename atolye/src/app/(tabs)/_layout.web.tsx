import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/lib/theme';

// Web önizlemesi için: yerel sekme çubuğu webde yok, alta basit bir çubuk.
export default function TabsLayoutWeb() {
  const c = useColors();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={[styles.bar, { backgroundColor: c.card, borderTopColor: c.line }]}>
        <TabTrigger name="index" href="/" asChild>
          <Tab>Çekim</Tab>
        </TabTrigger>
        <TabTrigger name="onay" href="/onay" asChild>
          <Tab>Onay</Tab>
        </TabTrigger>
        <TabTrigger name="urunler" href="/urunler" asChild>
          <Tab>Ürünler</Tab>
        </TabTrigger>
        <TabTrigger name="siparisler" href="/siparisler" asChild>
          <Tab>Siparişler</Tab>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function Tab({ children, isFocused, ref: _ref, ...props }: TabTriggerSlotProps) {
  const c = useColors();
  return (
    <Pressable {...props} style={styles.tab}>
      <View style={[styles.dot, { backgroundColor: isFocused ? c.accent : 'transparent' }]} />
      <Text style={{ color: isFocused ? c.ink : c.ink2, fontWeight: isFocused ? '600' : '400', fontSize: 13 }}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 10, paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
