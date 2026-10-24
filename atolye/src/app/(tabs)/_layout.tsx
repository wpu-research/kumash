import { NativeTabs } from 'expo-router/native-tabs';

import { useColors } from '@/lib/theme';

export default function TabsLayout() {
  const c = useColors();
  return (
    <NativeTabs tintColor={c.accent} labelStyle={{ selected: { color: c.ink } }} backgroundColor={c.paper}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Çekim</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'camera', selected: 'camera.fill' }} md="photo_camera" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="onay">
        <NativeTabs.Trigger.Label>Onay</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'checkmark.seal', selected: 'checkmark.seal.fill' }} md="new_releases" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="urunler">
        <NativeTabs.Trigger.Label>Ürünler</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'hanger', selected: 'hanger' }} md="checkroom" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="siparisler">
        <NativeTabs.Trigger.Label>Siparişler</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'shippingbox', selected: 'shippingbox.fill' }} md="local_shipping" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
