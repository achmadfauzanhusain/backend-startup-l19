const crypto = require("crypto");
const {
  doc, collection, getDoc, setDoc, writeBatch, serverTimestamp,
  query, where, orderBy, limit, startAfter, getDocs, updateDoc
} = require("firebase/firestore");
const { db, colUser, colChat } = require("../../db/firebase.js");

const getChatId = (a, b) => [a, b].sort().join("_");

const MAX_CIPHERTEXT_B64 = 16 * 1024; // batas ukuran ciphertext (base64)
const AES_GCM_IV_BYTES = 12;

const isBase64 = (s) =>
  typeof s === "string" && s.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(s);

const byteLen = (b64) => Buffer.from(b64, "base64").length;

// Validasi bentuk payload terenkripsi dari client
const validateEncryptedPayload = ({ ciphertext, iv, keys }, participants) => {
  if (!isBase64(ciphertext) || ciphertext.length > MAX_CIPHERTEXT_B64) return false;
  if (!isBase64(iv) || byteLen(iv) !== AES_GCM_IV_BYTES) return false;
  if (!keys || typeof keys !== "object") return false;

  const keyOwners = Object.keys(keys).sort();
  if (keyOwners.join("|") !== [...participants].sort().join("|")) return false;

  return keyOwners.every((id) => {
    const k = keys[id];
    if (!isBase64(k)) return false;
    const len = byteLen(k);
    return len >= 256 && len <= 512; // RSA-2048 .. RSA-4096
  });
};

module.exports = {
  openChat: async (req, res) => {
    try {
      const me = req.user.id;
      const { targetHash } = req.body;

      if (!targetHash || targetHash === me) {
        return res.status(400).json({ message: "Invalid target" });
      }

      const [meSnap, targetSnap] = await Promise.all([
        getDoc(doc(colUser, me)),
        getDoc(doc(colUser, targetHash))
      ]);

      if (!targetSnap.exists()) {
        return res.status(404).json({ message: "User not found" });
      }
      if ((targetSnap.data().blocked || []).includes(me)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Kedua pihak wajib punya public key agar chat bisa dienkripsi
      if (!meSnap.exists() || !meSnap.data().publicKey) {
        return res.status(400).json({
          code: "PUBLIC_KEY_REQUIRED",
          message: "Register your public key first"
        });
      }
      if (!targetSnap.data().publicKey) {
        return res.status(409).json({
          code: "TARGET_NO_PUBLIC_KEY",
          message: "Target user has not set up encryption yet"
        });
      }

      const chatId = getChatId(me, targetHash);
      const chatRef = doc(colChat, chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [me, targetHash].sort(),
          encrypted: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: null,
          lastReadAt: { [me]: serverTimestamp(), [targetHash]: serverTimestamp() },
          muted: { [me]: false, [targetHash]: false }
        });
      }

      res.status(200).json({
        data: {
          chatId,
          publicKeys: {
            [me]: meSnap.data().publicKey,
            [targetHash]: targetSnap.data().publicKey
          }
        }
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getChatKeys: async (req, res) => {
    try {
      const me = req.user.id;
      const { chatId } = req.params;

      const chatSnap = await getDoc(doc(colChat, chatId));
      if (!chatSnap.exists()) return res.status(404).json({ message: "Chat not found" });

      const participants = chatSnap.data().participants;
      if (!participants.includes(me)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const snaps = await Promise.all(participants.map((id) => getDoc(doc(colUser, id))));
      const publicKeys = {};
      snaps.forEach((s, i) => {
        if (s.exists() && s.data().publicKey) publicKeys[participants[i]] = s.data().publicKey;
      });

      res.status(200).json({ data: { publicKeys } });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  sendMessage: async (req, res) => {
    try {
      const me = req.user.id;
      const { chatId } = req.params;
      const { ciphertext, iv, keys } = req.body;

      const chatRef = doc(colChat, chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        return res.status(404).json({ message: "Chat not found" });
      }

      const participants = chatSnap.data().participants;
      if (!participants.includes(me)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!validateEncryptedPayload({ ciphertext, iv, keys }, participants)) {
        return res.status(400).json({ message: "Invalid encrypted payload" });
      }

      // Cek block dari lawan bicara
      const otherId = participants.find((p) => p !== me);
      const otherSnap = await getDoc(doc(colUser, otherId));
      if (otherSnap.exists() && (otherSnap.data().blocked || []).includes(me)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const payload = { ciphertext, iv, keys };

      const msgRef = doc(collection(db, "chats", chatId, "messages"));
      const batch = writeBatch(db);
      batch.set(msgRef, {
        senderId: me, type: "text", encrypted: true,
        ...payload,
        mediaUrl: null, replyTo: null,
        createdAt: serverTimestamp(), editedAt: null, deletedAt: null
      });
      batch.update(chatRef, {
        updatedAt: serverTimestamp(),
        // preview juga terenkripsi; client yang mendekripsi
        lastMessage: { ...payload, encrypted: true, senderId: me, createdAt: serverTimestamp() },
        [`lastReadAt.${me}`]: serverTimestamp()
      });
      await batch.commit();

      res.status(201).json({ data: { id: msgRef.id } });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  listChats: async (req, res) => {
    try {
      const q = query(colChat,
        where("participants", "array-contains", req.user.id),
        orderBy("updatedAt", "desc"));
      const snap = await getDocs(q);
      res.status(200).json({ data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getMessages: async (req, res) => {
    try {
      const me = req.user.id;
      const { chatId } = req.params;
      const { before } = req.query;

      const chatSnap = await getDoc(doc(colChat, chatId));
      if (!chatSnap.exists()) return res.status(404).json({ message: "Chat not found" });
      if (!chatSnap.data().participants.includes(me)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const msgCol = collection(db, "chats", chatId, "messages");
      const constraints = [orderBy("createdAt", "desc"), limit(30)];
      if (before) {
        const cursor = await getDoc(doc(msgCol, before));
        if (cursor.exists()) constraints.push(startAfter(cursor));
      }

      const snap = await getDocs(query(msgCol, ...constraints));

      // Kembalikan hanya kunci milik user ini (bukan kunci lawan bicara)
      const data = snap.docs.map((d) => {
        const m = d.data();
        const { keys, ...rest } = m;
        return { id: d.id, ...rest, key: keys ? keys[me] || null : null };
      });

      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
  markRead: async (req, res) => {
    try {
      const me = req.user.id;
      const { chatId } = req.params;

      const chatRef = doc(colChat, chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) return res.status(404).json({ message: "Chat not found" });
      if (!chatSnap.data().participants.includes(me)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await updateDoc(chatRef, { [`lastReadAt.${me}`]: serverTimestamp() });
      res.status(200).json({ message: "OK" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}