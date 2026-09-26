import { DiscordSDK } from "@discord/embedded-app-sdk";

const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID;

if (!clientId) {
  throw new Error("VITE_DISCORD_CLIENT_ID is not configured.");
}

export function createDiscordSdk() {
  return new DiscordSDK(clientId);
}