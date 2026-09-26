import { useEffect } from "react";
import { createDiscordSdk } from "../discordSdk";

export default function DiscordActivityAuth() {
  useEffect(() => {
    async function setupDiscordActivity() {
      try {
        const discordSdk = createDiscordSdk();

        await discordSdk.ready();

        const { code } = await discordSdk.commands.authorize({
          client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
          response_type: "code",
          state: "",
          prompt: "none",
          scope: ["identify"],
        });

          const response = await fetch(

             "/.proxy/api/token",
  {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          let detail = `HTTP ${response.status}`;

          try {
            const errorData = await response.json();

            if (errorData.detail) {
              detail = errorData.detail;
            } else if (errorData.error) {
              detail = errorData.error;
            }
          } catch {
            // Keep the HTTP status if the response is not JSON.
          }

          throw new Error(
            `Discord token exchange failed: ${detail}`
          );
        }

        const { access_token } = await response.json();

        await discordSdk.commands.authenticate({
          access_token,
        });

        console.log("Discord Activity authenticated");
      } catch (error) {
        console.error(
          "Discord Activity authentication failed:",
          error
        );

        const message =
          error instanceof Error ? error.message : String(error);

        document.body.innerHTML = `
          <div style="
            min-height: 100vh;
            background: #0b0f19;
            color: #ff6b6b;
            padding: 40px;
            font-family: monospace;
          ">
            <h2>Discord Activity Authentication Error</h2>
            <pre style="white-space: pre-wrap;">${message}</pre>
          </div>
        `;
      }
    }

    setupDiscordActivity();
  }, []);

  return null;
}