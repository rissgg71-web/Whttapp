const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const readline = require("readline");
const { Sticker } = require("wa-sticker-formatter");

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

    const cmd = text.trim().split(" ")[0].toLowerCase();

    console.log("📩", text);
    // .ping
    if (cmd === ".ping") {
      return sock.sendMessage(from, {
        text: "🏓 Pong!"
      });
    }

    // .owner
    if (cmd === ".owner") {
      return sock.sendMessage(from, {
        text: "🗿 Owner: rissgg71-web"
      });
    }

    // .runtime
    if (cmd === ".runtime") {
      const up = Math.floor((Date.now() - startTime) / 1000);

      return sock.sendMessage(from, {
        text: `⏱ Runtime: ${up} detik`
      });
    }

    // .menu
    if (cmd === ".menu") {
      const up = Math.floor((Date.now() - startTime) / 1000);

      return sock.sendMessage(from, {
        text: `
╭━━━〔 🗿 WHTTAPP BOT 🗿 〕━━━⬣
┃ 👑 Owner : rissgg71-web
┃ ⚡ Status : Online
┃ ⏱ Runtime : ${up} detik
╰━━━━━━━━━━━━━━━━⬣

⚡ MAIN
➜ .ping
➜ .menu
➜ .owner
➜ .runtime

👥 GROUP
➜ .tagall
➜ .hidetag
➜ .groupinfo

🎮 FUN
➜ .afk
➜ .cekganteng
➜ .rate
➜ .truth
➜ .dare

🛠️ TOOLS
➜ .qc
➜ .brat
`
      });
    }
    // .groupinfo
    if (cmd === ".groupinfo") {
      if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, {
          text: "🗿 Khusus grup."
        });
      }

      const group = await sock.groupMetadata(from);
      const admin = group.participants.filter(v => v.admin).length;

      return sock.sendMessage(from, {
        text: `
╭━━━〔 👥 GROUP INFO 〕━━━⬣
┃ 📛 Nama : ${group.subject}
┃ 👤 Member : ${group.participants.length}
┃ 👑 Admin : ${admin}
╰━━━━━━━━━━━━━━━━⬣
`
      });
    }

    // .tagall
    if (cmd === ".tagall") {
      if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, {
          text: "🗿 Khusus grup."
        });
      }

      const group = await sock.groupMetadata(from);
      const mentions = group.participants.map(v => v.id);

      let teks = `
╭━━━〔 📢 TAG ALL 📢 〕━━━⬣
┃ 👥 Group : ${group.subject}
┃ 👤 Total : ${group.participants.length}
╰━━━━━━━━━━━━━━━━⬣

📋 List Member

`;

      group.participants.forEach((user, i) => {
        teks += `${i + 1}. @${user.id.split("@")[0]}\n`;
      });

      return sock.sendMessage(from, {
        text: teks,
        mentions
      });
    }

    // .hidetag
    if (cmd === ".hidetag") {
      if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, {
          text: "🗿 Khusus grup."
        });
      }

      const group = await sock.groupMetadata(from);
      const mentions = group.participants.map(v => v.id);

      return sock.sendMessage(from, {
        text: text.replace(".hidetag", "").trim() || "🗿",
        mentions
      });
    }
    // .afk
    if (cmd === ".afk") {
      const alasan = text.replace(".afk", "").trim() || "AFK";

      afkUsers[from] = true;

      return sock.sendMessage(from, {
        text: `😴 AFK Aktif\nAlasan: ${alasan}`
      });
    }

    if (afkUsers[from] && cmd !== ".afk") {
      delete afkUsers[from];

      await sock.sendMessage(from, {
        text: "😎 AFK dinonaktifkan."
      });
    }

    // .cekganteng
    if (cmd === ".cekganteng") {
      const persen = Math.floor(Math.random() * 100) + 1;

      return sock.sendMessage(from, {
        text: `😎 Tingkat Kegantengan\n\n${persen}/100 ⭐`
      });
    }

    // .rate
    if (cmd === ".rate") {
      const isi = text.replace(".rate", "").trim();

      const nilai = Math.floor(Math.random() * 100) + 1;

      return sock.sendMessage(from, {
        text: `📊 Rating ${isi}\n\n${nilai}/100 ⭐`
      });
    }

    // .truth
    if (cmd === ".truth") {
      const list = [
        "Siapa orang terakhir yang kamu chat?",
        "Pernah suka teman sendiri?",
        "Rahasia yang belum pernah kamu ceritakan?"
      ];

      return sock.sendMessage(from, {
        text: "🎲 TRUTH\n\n" +
          list[Math.floor(Math.random() * list.length)]
      });
    }

    // .dare
    if (cmd === ".dare") {
      const list = [
        "Tag teman favoritmu 🗿",
        "Kirim 😂 10 kali",
        "Ganti nama grup 1 menit"
      ];

      return sock.sendMessage(from, {
        text: "🎲 DARE\n\n" +
          list[Math.floor(Math.random() * list.length)]
      });
    }

    // .qc sticker
    if (cmd === ".qc") {
      const isi = text.replace(".qc", "").trim();

      const sticker = new Sticker(
        Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
<rect width="100%" height="100%" fill="white"/>
<text x="50%" y="50%" text-anchor="middle" font-size="35">${isi}</text>
</svg>
`),
        {
          pack: "Whttapp",
          author: "rissgg71-web"
        }
      );

      return sock.sendMessage(from, {
        sticker: await sticker.toBuffer()
      });
    }

    // .brat sticker
    if (cmd === ".brat") {
      const isi = text.replace(".brat", "").trim();

      const sticker = new Sticker(
        Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
<rect width="100%" height="100%" fill="white"/>
<text x="50%" y="50%" text-anchor="middle" font-size="45">${isi}</text>
</svg>
`),
        {
          pack: "BRAT",
          author: "Whttapp"
        }
      );

      return sock.sendMessage(from, {
        sticker: await sticker.toBuffer()
      });
    }
    });
}

startBot();
