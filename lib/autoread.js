// Auto Read Messages & Status (Story/WhatsApp Status)
// Script untuk membaca chat dan status secara otomatis
// Bisa di-on/off dengan command .read

const autoReadState = {}; // Simpan status auto read per user

async function setupAutoRead(sock) {
  /**
   * Event: messages.upsert
   * Membaca semua pesan chat yang masuk (jika auto read aktif)
   */
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      for (const message of messages) {
        // Jangan baca pesan dari bot sendiri
        if (message.key.fromMe) continue;

        const jid = message.key.remoteJid;

        // Cek apakah auto read aktif untuk user/group ini
        if (!autoReadState[jid]) continue;

        // Baca pesan individual chat
        if (jid && !jid.endsWith("@g.us")) {
          await sock.readMessages([message.key]);
          console.log(`✅ Chat dibaca dari: ${jid}`);
        }

        // Baca pesan group (jika auto read diaktifkan di group)
        if (jid && jid.endsWith("@g.us")) {
          await sock.readMessages([message.key]);
          console.log(`✅ Pesan grup dibaca: ${jid}`);
        }
      }
    } catch (error) {
      console.error("❌ Error auto read messages:", error.message);
    }
  });

  /**
   * Event: messages.update
   * Menangkap status/story yang masuk
   */
  sock.ev.on("messages.update", async (updates) => {
    try {
      for (const { key, update } of updates) {
        const jid = key.remoteJid;

        // Cek apakah auto read aktif
        if (!autoReadState[jid]) continue;

        // Check jika status/story masuk
        if (key.remoteJid === "status@broadcast" || update.status === "READ") {
          continue;
        }

        // Baca status yang masuk
        try {
          await sock.readMessages([key]);
          console.log(`✅ Status dibaca: ${key.remoteJid}`);
        } catch (err) {
          // Status sudah terbaca atau error lainnya
        }
      }
    } catch (error) {
      console.error("❌ Error auto read status:", error.message);
    }
  });

  console.log("✅ Auto Read sistem siap! Gunakan .read on/off");
}

/**
 * Handle command .read
 */
async function handleReadCommand(sock, from, text) {
  const args = text.split(" ")[1]?.toLowerCase();

  if (!args) {
    return sock.sendMessage(from, {
      text: `📖 AUTO READ COMMAND

Gunakan:
• .read on     → Aktifkan auto read
• .read off    → Nonaktifkan auto read
• .read status → Cek status auto read`,
    });
  }

  if (args === "on") {
    autoReadState[from] = true;
    return sock.sendMessage(from, {
      text: "✅ Auto Read Diaktifkan\n\n📖 Chat dan Status akan dibaca otomatis",
    });
  }

  if (args === "off") {
    autoReadState[from] = false;
    return sock.sendMessage(from, {
      text: "❌ Auto Read Dinonaktifkan",
    });
  }

  if (args === "status") {
    const status = autoReadState[from] ? "✅ AKTIF" : "❌ NONAKTIF";
    return sock.sendMessage(from, {
      text: `📊 Status Auto Read: ${status}`,
    });
  }

  return sock.sendMessage(from, {
    text: "❌ Command tidak dikenali. Gunakan: .read on/off/status",
  });
}

module.exports = { setupAutoRead, handleReadCommand };
