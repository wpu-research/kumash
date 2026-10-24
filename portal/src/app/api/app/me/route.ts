import { appRoute } from "@/lib/app-api";
import { getProvider } from "@/lib/pipeline";
import { CHANNELS, channelReady } from "@/lib/publishers";

export const dynamic = "force-dynamic";

export const GET = appRoute(async () => ({
  store: "Kumash",
  ai: getProvider().name,
  channels: CHANNELS.map((c) => ({ channel: c, ready: channelReady(c) })),
}));
