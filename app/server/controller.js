const { runTransaction, where, addDoc, getDoc, getDocs, doc, increment, arrayUnion, arrayRemove, serverTimestamp, query, orderBy, documentId } = require("firebase/firestore");
const { colServer, colUser, colPost } = require("../../db/firebase.js")

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
    },
    joinedServers: async (req, res) => {
        try {
            const { hashAddress } = req.params
            const docRef = doc(colUser, hashAddress)
            const docSnap = await getDoc(docRef)

            if (!docSnap.exists()) {
                return res.status(404).json({ message: "Data not found" })
            }

            const personalData = { id: docSnap.id, ...docSnap.data() }
            const joinedServers = personalData.servers

            if (!Array.isArray(joinedServers) || joinedServers.length === 0) {
                return res.status(200).json({ data: [] })
            }

            const q = query(
                colServer,
                where(documentId(), "in", joinedServers)
            )

            const snapshot = await getDocs(q)
            const servers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

            res.status(200).json({ data: servers })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: "Internal Server Error" })
        }
    },
    serverPost: async(req, res) => {
        try {
            const { idServer } = req.params
            const { caption } = req.body

            if(!caption) {
                return res.status(400).json({ message: "u must fill in all!" })
            }

            const userRef = doc(colUser, req.user.id)
            const userSnap = await getDoc(userRef)

            const serverRef = doc(colServer, idServer)
            const serverSnap = await getDoc(serverRef)

            if(!serverSnap) {
                return res.status(404).json({ message: "Server not found" })
            }
            const serverData = serverSnap.data()

            if (!userSnap.exists()) {
                return res.status(404).json({ message: "User not found" })
            }

            // cek apakah user sudah join server ini
            const userData = userSnap.data()
            console.log(userData.hash)
            const joinedServers = Array.isArray(userData.servers) ? userData.servers : []

            if (!joinedServers.includes(idServer) || serverData.owner != userData.hash) {
                return res.status(403).json({ message: "u must join the server first!" })
            }
            
            const docRef = await addDoc(colPost, {
                user: req.user.id,
                caption,
                comments: [],
                likesCount: 0,
                server: idServer,
                createdAt: serverTimestamp()
            })
            res.status(201).json({ message: "successfully posted!", data: docRef.id})
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" })
        }
    }
}