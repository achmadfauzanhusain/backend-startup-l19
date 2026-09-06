const { runTransaction, where, addDoc, getDoc, getDocs, doc, increment, arrayUnion, arrayRemove, serverTimestamp, query, orderBy } = require("firebase/firestore");
const { colServer } = require("../../db/firebase.js")

module.exports = {
    createServer: async(req, res) => {
        try {
            const { serverName, desc, category } = req.body

            if(!serverName || !desc || !category) {
                return res.status(400).json({ message: "u must fill in all!" })
            }

            const docRef = await addDoc(colServer, {
                serverName,
                desc,
                category,
                owner: req.user.id,
                createdAt: serverTimestamp(),
                members: 0
            })
            res.status(201).json({ message: "successfully created!", data: docRef.id})
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" })
        }
    },
    getAllServers: async(req, res) => {
        try {
            const querySnapshot = await getDocs(colServer)
            const servers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            res.status(200).json({ data: servers })
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" })
        }
    },
    getDetailServer: async(req, res) => {
        try {
            const { idServer } = req.params

            const docRef = doc(colServer, idServer);
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
    myServers: async(req, res) => {
        try {
            const q = query(
                colServer,
                where("owner", "==", req.user.id)
            )

            const querySnapshot = await getDocs(q)
            const myServers = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))

            res.status(200).json({ data: myServers })
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" })
        }
    }
}