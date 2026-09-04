const { runTransaction, where, addDoc, getDocs, doc, increment, arrayUnion, arrayRemove, serverTimestamp, query } = require("firebase/firestore");
const { db, colUser, colPost } = require("../../db/firebase.js")

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
                likesCount: 0,
                createdAt: serverTimestamp()
            })
            res.status(201).json({ message: "successfully posted!", data: docRef.id})
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    toggleLike: async(req, res) => {
        try {
            const { postId } = req.params
            const userId = req.user.id

            const userRef = doc(colUser, userId)
            const postRef = doc(colPost, postId)

            const result = await runTransaction(db, async(transaction) => {
                const userDoc = await transaction.get(userRef)
                const likedPosts = userDoc.data().likedPosts || []
                const alreadyLiked = likedPosts.includes(postId)

                if(alreadyLiked) {
                    transaction.update(postRef, { likesCount: increment(-1) })
                    transaction.update(userRef, { likedPosts: arrayRemove(postId) })
                    return "unliked"
                } else {
                    transaction.update(postRef, { likesCount: increment(1) })
                    transaction.update(userRef, { likedPosts: arrayUnion(postId) })
                    return "liked"
                }
            })
            res.status(201).json({ message: result })
        } catch (error) {
            console.error(error)
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    checkIsLiked: async(req, res) => {
        try {
            const { postId } = req.params
            const userId = req.user.id

            const userSnap = await getDoc(doc(colUser, userId))
            const likedPosts = userSnap.data().likedPosts || []

            const isLiked = likedPosts.includes(postId)
            res.status(200).json({ isLiked })
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    getAllPosts: async (req, res) => {
        try {
            const querySnapshot = await getDocs(colPost)
            const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            res.status(200).json({ data: posts })
        } catch (error) {
            console.error('getAllPosts error:', error)
            res.status(500).json({ message: 'Internal Server Error' })
        }
    },
    getPersonalPosts: async (req, res) => {
        try {
            const { userId } = req.params;

            const q = query(
                colPost,
                where("user", "==", userId),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);

            const personalPosts = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            res.status(200).json({ data: personalPosts });
        } catch (error) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
}