const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    logger: P({ level: "silent" }),
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  // Pairing Code
  if (!sock.authState.creds.registered) {
    const nomor = "628xxxxxxxxxx"; // GANTI NOMOR LU
    const code = await sock.requestPairingCode(nomor);
    console.log("\n🗿 PAIRING CODE:");
    console.log(code);
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ Bot Connected");
    }

    if (connection === "close") {
      const reconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Connection Closed");

      if (reconnect) {
        console.log("🔄 Reconnecting...");
        startBot();
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    if (m.key.fromMe) return;

    const from = m.key.remoteJid;

    const body =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";

    const text = body.trim();
    const args = text.split(" ");
    const cmd = args.shift()?.toLowerCase();

    console.log("📩", text);

    // PING
    if (cmd === ".ping") {
      return sock.sendMessage(from, {
        text: "Pong 🗿"
      });
    }

    // OWNER
    if (cmd === ".owner") {
      return sock.sendMessage(from, {
        text: "Owner: rissgg71-web 🗿"
      });
    }

    // MENU
    if (cmd === ".menu") {
      return sock.sendMessage(from, {
        text: `
🗿 *WHTTAPP BOT*

⚡ MAIN
.ping
.menu
.owner

🎨 STICKER
.brat teks

🚀 STATUS
Online
        `
      });
    }

    // BRAT SEMENTARA
    if (cmd === ".brat") {
      const isi = args.join(" ");

      if (!isi) {
        return sock.sendMessage(from, {
          text: "Contoh:\n.brat Halo Cuk 🗿"
        });
      }

      return sock.sendMessage(from, {
        text: `🗿 BRAT:\n${isi}`
      });
    }
  });
}

startBot();
