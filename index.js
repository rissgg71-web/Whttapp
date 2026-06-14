const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const readline = require("readline");
const axios = require("axios");

const {
  makeBrat,
  makeBratVid,
  makeQC,
  toSticker
} = require("./lib/maker");

const startTime = Date.now();

const afkUsers = {};

let botOnline = false;

async function startBot() {

  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

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

    rl.question(
      "Isi nomor awalan 62:\n",
      async (nomor) => {

        const code =
          await sock.requestPairingCode(nomor);

        console.log(`
╔════════════╗
║  WHTTAPP   ║
╚════════════╝

PAIRING CODE:
${code}
`);

        rl.close();
      }
    );
  }

  sock.ev.on(
    "connection.update",
    ({ connection, lastDisconnect }) => {

      if (connection === "open") {
        console.log("✅ Bot Connected");
      }

      if (connection === "close") {

        const reconnect =
          lastDisconnect?.error?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (reconnect) startBot();
      }
    }
  );

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      const m = messages[0];

      if (!m?.message) return;

      const from = m.key.remoteJid;

      const text =
        m.message.conversation ||
        m.message.extendedTextMessage?.text ||
        "";

      const cmd =
        text.trim().split(" ")[0].toLowerCase();
      // ONLINE OFFLINE

      if (cmd === ".online") {

        botOnline = true;

        return sock.sendMessage(from, {
          text: "✅ Bot Online"
        });
      }

      if (cmd === ".offline") {

        botOnline = false;

        return sock.sendMessage(from, {
          text: "❌ Bot Offline"
        });
      }

      if (!botOnline && cmd !== ".online")
        return;

      // PING

      if (cmd === ".ping") {

        return sock.sendMessage(from, {
          text: "🏓 Pong!"
        });
      }

      // OWNER

      if (cmd === ".owner") {

        return sock.sendMessage(from, {
          text: "👑 Owner : rissgg71-web"
        });
      }

      // RUNTIME

      if (cmd === ".runtime") {

        const up =
          Math.floor(
            (Date.now() - startTime) / 1000
          );

        return sock.sendMessage(from, {
          text: `⏱ Runtime : ${up} Detik`
        });
      }

      // MENU

      if (cmd === ".menu") {

        return sock.sendMessage(from, {

          text: `
╔════════════════════╗
║      WHTTAPP V3    ║
╚════════════════════╝

👤 Owner : rissgg71-web
⚡ Status : Online

╭─ MAIN
│ • .ping
│ • .menu
│ • .owner
│ • .runtime
╰──────────

╭─ GROUP
│ • .groupinfo
│ • .tagall
│ • .hidetag
╰──────────

╭─ FUN
│ • .afk
│ • .cekganteng
│ • .rate
│ • .truth
│ • .dare
╰──────────

╭─ TOOLS
│ • .qc
│ • .brat
│ • .bratvid
╰──────────

╭─ OWNER
│ • .online
│ • .offline
╰──────────
`
        });
      }
      // GROUP INFO

      if (cmd === ".groupinfo") {

        if (!from.endsWith("@g.us")) {
          return sock.sendMessage(from, {
            text: "❌ Khusus Grup"
          });
        }

        const group =
          await sock.groupMetadata(from);

        const admins =
          group.participants.filter(
            v => v.admin
          ).length;

        return sock.sendMessage(from, {
          text: `
╔═══ GROUP INFO ═══╗

📛 Nama : ${group.subject}
👥 Member : ${group.participants.length}
👑 Admin : ${admins}

╚══════════════════╝
`
        });
      }

      // TAGALL

      if (cmd === ".tagall") {

        if (!from.endsWith("@g.us")) {
          return sock.sendMessage(from, {
            text: "❌ Khusus Grup"
          });
        }

        const group =
          await sock.groupMetadata(from);

        const mentions =
          group.participants.map(v => v.id);

        let teks =
`📢 TAG ALL

👥 ${group.subject}

`;

        group.participants.forEach(
          (user, i) => {

            teks +=
`${i + 1}. @${user.id.split("@")[0]}
`;
          }
        );

        return sock.sendMessage(from, {
          text: teks,
          mentions
        });
      }

      // HIDETAG

      if (cmd === ".hidetag") {

        if (!from.endsWith("@g.us")) {
          return sock.sendMessage(from, {
            text: "❌ Khusus Grup"
          });
        }

        const group =
          await sock.groupMetadata(from);

        const mentions =
          group.participants.map(v => v.id);

        return sock.sendMessage(from, {
          text:
            text.replace(
              ".hidetag",
              ""
            ).trim() || "🗿",
          mentions
        });
      }
      // AFK

      if (cmd === ".afk") {

        const alasan =
          text.replace(".afk", "").trim() ||
          "AFK";

        afkUsers[from] = alasan;

        return sock.sendMessage(from, {
          text:
`😴 AFK AKTIF

📝 Alasan :
${alasan}`
        });
      }

      if (
        afkUsers[from] &&
        cmd !== ".afk"
      ) {

        delete afkUsers[from];

        await sock.sendMessage(from, {
          text: "😎 AFK Dinonaktifkan"
        });
      }

      // CEKGANTENG

      if (cmd === ".cekganteng") {

        const persen =
          Math.floor(
            Math.random() * 100
          ) + 1;

        return sock.sendMessage(from, {
          text:
`😎 Tingkat Kegantengan

${persen}/100 ⭐`
        });
      }

      // RATE

      if (cmd === ".rate") {

        const isi =
          text.replace(".rate", "").trim();

        const nilai =
          Math.floor(
            Math.random() * 100
          ) + 1;

        return sock.sendMessage(from, {
          text:
`📊 Rating

${isi}

⭐ ${nilai}/100`
        });
      }

      // TRUTH

      if (cmd === ".truth") {

        const list = [
          "Siapa orang terakhir yang kamu chat?",
          "Pernah suka teman sendiri?",
          "Rahasia yang belum pernah kamu ceritakan?",
          "Pernah bohong ke orang tua?",
          "Siapa crush kamu sekarang?"
        ];

        return sock.sendMessage(from, {
          text:
`🎲 TRUTH

${
list[
Math.floor(
Math.random() *
list.length
)
]
}`
        });
      }

      // DARE

      if (cmd === ".dare") {

        const list = [
          "Tag teman favoritmu 🗿",
          "Kirim 😂 10 kali",
          "Ganti nama grup 1 menit",
          "Spam stiker 5 kali",
          "Voice note bilang halo"
        ];

        return sock.sendMessage(from, {
          text:
`🎲 DARE

${
list[
Math.floor(
Math.random() *
list.length
)
]
}`
        });
      }
      // QC

      if (cmd === ".qc") {

        const isi =
          text.replace(".qc", "").trim();

        if (!isi) {
          return sock.sendMessage(from, {
            text: "Contoh: .qc halo"
          });
        }

        const png =
          await makeQC(
            isi,
            "Whttapp User",
            "https://telegra.ph/file/320b066dc81928b782c7b.png"
          );

        const sticker =
          await toSticker(
            png,
            "WHTTAPP",
            "rissgg71-web"
          );

        return sock.sendMessage(from, {
          sticker
        });
      }

      // BRAT

      if (cmd === ".brat") {

        const isi =
          text.replace(".brat", "").trim();

        if (!isi) {
          return sock.sendMessage(from, {
            text: "Contoh: .brat halo"
          });
        }

        const png =
          await makeBrat(isi);

        const sticker =
          await toSticker(
            png,
            "WHTTAPP",
            "rissgg71-web"
          );

        return sock.sendMessage(from, {
          sticker
        });
      }

      // BRATVID

      if (cmd === ".bratvid") {

        const isi =
          text.replace(
            ".bratvid",
            ""
          ).trim();

        if (!isi) {
          return sock.sendMessage(from, {
            text:
              "Contoh: .bratvid halo"
          });
        }

        const sticker =
          await makeBratVid(
            isi,
            "WHTTAPP",
            "rissgg71-web"
          );

        return sock.sendMessage(from, {
          sticker
        });
      }

    });
}

startBot();
