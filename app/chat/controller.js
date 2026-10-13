const {
  doc, collection, getDoc, setDoc, writeBatch, serverTimestamp,
  query, where, orderBy, limit, startAfter, getDocs, updateDoc
} = require("firebase/firestore");
const { db, colUser, colChat } = require("../../db/firebase.js");

const getChatId = (a, b) => [a, b].sort().join("_");

module.exports = {
  // Mulai chat (atau ambil yang sudah ada)
  openChat: async (req, res) => {
    try {
      const me = req.user.id;
      const { targetHash } = req.body;

      if (!targetHash || targetHash === me) {
        return res.status(400).json({ message: "Invalid target" });
      }

      const targetSnap = await getDoc(doc(colUser, targetHash));
      if (!targetSnap.exists()) {
        return res.status(404).json({ message: "User not found" });
      }
      if ((targetSnap.data().blocked || []).includes(me)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const chatId = getChatId(me, targetHash);
      const chatRef = doc(colChat, chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participants: [me, targetHash].sort(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: null,
          lastReadAt: { [me]: serverTimestamp(), [targetHash]: serverTimestamp() },
          muted: { [me]: false, [targetHash]: false }
        });
      }

      res.status(200).json({ data: { chatId } });
    } catch (error) {
      console.log(error)
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Kirim pesan
  sendMessage: async (req, res) => {
    try {
      const me = req.user.id;
      const { chatId } = req.params;
      const { text } = req.body;

      if (!text?.trim()) {
        return res.status(400).json({ message: "Text is required" });
      }

      const chatRef = doc(colChat, chatId);
      const chatSnap = await getDoc(chatRef);
      if (!chatSnap.exists()) {
        return res.status(404).json({ message: "Chat not found" });
      }
      if (!chatSnap.data().participants.includes(me)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const msgRef = doc(collection(db, "chats", chatId, "messages"));
      const batch = writeBatch(db);
      batch.set(msgRef, {
        senderId: me, type: "text", text: text.trim(),
        mediaUrl: null, replyTo: null,
        createdAt: serverTimestamp(), editedAt: null, deletedAt: null
      });
      batch.update(chatRef, {
        updatedAt: serverTimestamp(),
        lastMessage: { text: text.trim(), senderId: me, createdAt: serverTimestamp() },
        [`lastReadAt.${me}`]: serverTimestamp()
      });
      await batch.commit();

      res.status(201).json({ data: { id: msgRef.id } });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Daftar chat
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

  // Ambil pesan (pagination dengan ?before=<messageId>)
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
      res.status(200).json({ data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Tandai sudah dibaca
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