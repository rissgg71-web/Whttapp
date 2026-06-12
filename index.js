const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection }) => {
    if (connection === "open") {
      console.log("Bot connected 🗿");
    }

    if (connection === "close") {
      console.log("Reconnect...");
      startBot();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;

    const from = m.key.remoteJid;

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";

    // .ping
    if (text === ".ping") {
      await sock.sendMessage(from, {
        text: "Pong 🗿"
      });
    }

    // .menu
    if (text === ".menu") {
      await sock.sendMessage(from, {
        text: `
🗿 *WHTTAPP BOT*

.ping
.menu
.owner
.brat teks
        `
      });
    }

    // .owner
    if (text === ".owner") {
      await sock.sendMessage(from, {
        text: "Owner: rissgg71-web 🗿"
      });
    }
  });
}

startBot();
