const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const readline = require("readline");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  if (!sock.authState.creds.registered) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Isi nomor kamu dengan awalan 62:\n", async (nomor) => {
      try {
        const code = await sock.requestPairingCode(nomor);
        console.log("\nPAIRING CODE:");
        console.log(code);
      } catch (err) {
        console.log("Pairing gagal:", err.message);
      }
      rl.close();
    });
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "connecting") {
      console.log("🔄 Connecting...");
    }

    if (connection === "open") {
      console.log("✅ Bot Connected");
    }

    if (connection === "close") {
      console.log("❌ Connection Closed");

      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];

    if (!m || !m.message) return;

    const from = m.key.remoteJid;

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      "";

    console.log("📩", text);

    const cmd = text.trim().split(" ")[0].toLowerCase();

    if (cmd === ".ping") {
      await sock.sendMessage(from, {
        text: "🏓 Pong!"
      });
    }

    if (cmd === ".owner") {
      await sock.sendMessage(from, {
        text: "🗿 Owner: rissgg71-web"
      });
    }

    if (cmd === ".menu") {
      await sock.sendMessage(from, {
        text: `
🗿 *WHTTAPP BOT*

⚡ MAIN
.ping
.menu
.owner

🚀 STATUS
Online
        `
      });
    }
  });
}

startBot();
