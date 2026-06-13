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

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "connecting") {
      console.log("🔄 Connecting...");
    }

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

  if (!sock.authState.creds.registered) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question("Isi nomor kamu dengan awalan 62:\n", async (nomor) => {
      try {
        const code = await sock.requestPairingCode(nomor);
        console.log("\n🗿 PAIRING CODE:");
        console.log(code);
      } catch (e) {
        console.log("❌ Gagal membuat pairing code");
        console.log(e.message);
      }

      rl.close();
    });
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;
    if (m.key.fromMe) return;

    const from = m.key.remoteJid;

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";

    if (text === ".ping") {
      await sock.sendMessage(from, {
        text: "Pong 🗿"
      });
    }

    if (text === ".owner") {
      await sock.sendMessage(from, {
        text: "Owner: rissgg71-web 🗿"
      });
    }

    if (text === ".menu") {
      await sock.sendMessage(from, {
        text: `
🗿 *WHTTAPP BOT*

⚡ MAIN
.ping
.menu
.owner

🎨 STICKER
.brat teks
        `
      });
    }

    if (text.startsWith(".brat ")) {
      const isi = text.slice(6);

      await sock.sendMessage(from, {
        text: `🗿 BRAT:\n${isi}`
      });
    }
  });
}

startBot();
