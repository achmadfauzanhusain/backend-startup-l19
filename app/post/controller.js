
const { addDoc } = require("firebase/firestore");
const { colPost } = require("../../db/firebase.js")

module.exports = {
    createPost: async(req, res) => {
        try {
            const { caption } = req.body

            if(!caption) {
                return res.status(400).json({ message: "u must fill in all!" })
            }
            const docRef = await addDoc(colPost, {
                user: req.user.id,
                caption,
                comments: [],
                likesCount: 0
            })
            res.status(201).json({ message: "successfully posted!", data: docRef.id})
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}