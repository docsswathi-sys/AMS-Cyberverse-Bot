import { useEffect } from "react";
import { discordSdk } from "../discordSdk";

export default function DiscordActivityAuth() {
  useEffect(() => {
    async function setupDiscordActivity() {
      try {
        await discordSdk.ready();

        const { code } = await discordSdk.commands.authorize({
          client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify"],
        });

        const response = await fetch("/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error("Discord token exchange failed.");
        }

        const { access_token } = await response.json();

        await discordSdk.commands.authenticate({
          access_token,
        });

        console.log("Discord Activity authenticated");
      } catch (error) {
        console.error("Discord Activity authentication failed:", error);
      }
    }

    setupDiscordActivity();
  }, []);

  return null;
}