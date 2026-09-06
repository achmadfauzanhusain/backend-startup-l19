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
                createdAt: serverTimestamp()
            })
            res.status(201).json({ message: "successfully created!", data: docRef.id})
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" })
        }
    }
}