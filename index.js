const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  let pairingRequested = false;

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {

    if (connection === "connecting") {
      console.log("🔄 Connecting...");
    }

    if (connection === "open") {
      console.log("✅ Connected");
    }

    // Minta pairing setelah socket siap
    if (!pairingRequested && !sock.authState.creds.registered) {
      pairingRequested = true;

      try {
        const nomor = "628XXXXXXXXXX"; // GANTI NOMOR LU
        const code = await sock.requestPairingCode(nomor);

        console.log("\n🗿 PAIRING CODE:");
        console.log(code);
        console.log("");
      } catch (e) {
        console.log("❌ Pairing gagal:", e.message);
      }
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Connection Closed");

      if (shouldReconnect) {
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

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";

    if (text === ".ping") {
      await sock.sendMessage(from, {
        text: "Pong 🗿"
      });
    }

    if (text === ".menu") {
      await sock.sendMessage(from, {
        text: `
🗿 WHTTAPP BOT

.ping
.menu
.owner
        `
      });
    }

    if (text === ".owner") {
      await sock.sendMessage(from, {
        text: "Owner: rissgg71-web"
      });
    }
  });
}

startBot();
