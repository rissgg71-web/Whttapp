const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const readline = require("readline");
const axios = require("axios");

const startTime = Date.now();
const afkUsers = {};

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
      const code = await sock.requestPairingCode(nomor);
      console.log("PAIRING CODE:", code);
      rl.close();
    });
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") console.log("✅ Bot Connected");

    if (connection === "close") {
      const reconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (reconnect) startBot();
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];

    if (!m?.message) return;

    const from = m.key.remoteJid;

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";

    const cmd = text.trim().split(" ")[0].toLowerCase();
