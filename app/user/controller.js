const crypto = require("crypto");
const { getDoc, getDocs, doc, updateDoc, query, where, serverTimestamp } = require("firebase/firestore");
const { colUser, colServer, colPost } = require("../../db/firebase.js")

// Validasi public key RSA (format SPKI DER dalam base64, minimal 2048-bit)
const isValidRsaPublicKey = (b64) => {
    try {
        if (typeof b64 !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return false;
        const key = crypto.createPublicKey({
            key: Buffer.from(b64, "base64"),
            format: "der",
            type: "spki"
        });
        return key.asymmetricKeyType === "rsa" &&
            key.asymmetricKeyDetails.modulusLength >= 2048;
    } catch {
        return false;
    }
};

module.exports = {
    dataUser: async(req, res) => {
        try {
            const { hashAddress } = req.params;

            const docRef = doc(colUser, hashAddress);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                return res.status(404).json({ message: "Data not found" });
            }

            const personalData = { id: docSnap.id, ...docSnap.data() };

            res.status(200).json({ data: personalData });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" })
        }
    },
    editProfile: async(req, res) => {
        try {
            const { displayName, bio, nameLink1, link1, nameLink2, link2, nameLink3, link3 } = req.body

            const userRef = doc(colUser, req.user.id)
            await updateDoc(userRef, { 
                displayName: displayName ? displayName : "",
                bio: bio ? bio : "",
                nameLink1: nameLink1 ? nameLink1 : "",
                link1: link1 ? link1 : "",
                nameLink2 : nameLink2 ? nameLink2 : "",
                link2: link2 ? link2 : "",
                nameLink3: nameLink3 ? nameLink3 : "",
                link3: link3 ? link3 : ""
            })
            res.status(200).json({ message: 'Profile updated successfully' })
        } catch(error) {
            console.log(error)
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    setPublicKey: async(req, res) => {
        try {
            const { publicKey } = req.body; // SPKI DER, base64

            if (!isValidRsaPublicKey(publicKey)) {
                return res.status(400).json({ message: "Invalid RSA public key (min 2048-bit, SPKI base64)" });
            }

            await updateDoc(doc(colUser, req.user.id), {
                publicKey,
                publicKeyUpdatedAt: serverTimestamp()
            });
            res.status(200).json({ message: "Public key saved" });
        } catch(error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    getPublicKey: async(req, res) => {
        try {
            const { hashAddress } = req.params;
            const snap = await getDoc(doc(colUser, hashAddress));

            if (!snap.exists() || !snap.data().publicKey) {
                return res.status(404).json({ message: "Public key not found" });
            }
            res.status(200).json({ data: { publicKey: snap.data().publicKey } });
        } catch(error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    search: async(req, res) => {
        try {
            const { q } = req.query;
            
            const userQuery = query(colUser, where("displayName", ">=", q), where("displayName", "<=", q + "\uf8ff"));
            const postQuery = query(colPost, where("caption", ">=", q), where("caption", "<=", q + "\uf8ff"));
            const serverQuery = query(colServer, where("serverName", ">=", q), where("serverName", "<=", q + "\uf8ff"));

            const [userSnapshot, postSnapshot, serverSnapshot] = await Promise.all([
                getDocs(userQuery),
                getDocs(postQuery),
                getDocs(serverQuery)
            ]);

            const users = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const posts = postSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const servers = serverSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            res.status(200).json({ data: { users, posts, servers } });
        } catch(error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}