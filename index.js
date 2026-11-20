// Vt4Fun — entrada compatível com a hospedagem Silly Development.
// Startup -> MAIN_FILE: index.js
import "dotenv/config";

if (process.env.REGISTER_COMMANDS_ON_START === "true") {
  if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_TOKEN) {
    throw new Error("Configure DISCORD_CLIENT_ID e DISCORD_TOKEN para registrar os comandos.");
  }
  await import("./src/deploy.js");
}

await import("./src/index.js");
