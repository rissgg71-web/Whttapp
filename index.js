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

  // Pairing Code
  if (!sock.authState.creds.registered) {
    const nomor = "628xxxxxxxxxx"; // GANTI NOMOR LU
    const code = await sock.requestPairingCode(nomor);
    console.log("PAIRING CODE:", code);
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("Bot Connected 🗿");
    }

    if (connection === "close") {
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
    if (!m.message) return;

    const from = m.key.remoteJid;

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";

    console.log("Pesan:", text);

    if (text === ".ping") {
      await sock.sendMessage(from, {
        text: "Pong 🗿"
      });
    }

    if (text === ".menu") {
      await sock.sendMessage(from, {
        text: `
🗿 *WHTTAPP BOT*

.ping
.menu
.owner
`
      });
    }

    if (text === ".owner") {
      await sock.sendMessage(from, {
        text: "Owner: rissgg71-web 🗿"
      });
    }
  });
}

startBot();
