const { getDoc, doc } = require("firebase/firestore");
const { colUser } = require("../../db/firebase.js")

module.exports = {
    dataUser: async(req, res) => {
        try {
            const { hashAddress } = req.params;

            const docRef = doc(colUser, hashAddress); // hashAddress = document ID
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
            const { displayName, bio, link1, link2, link3 } = req.body

            const userRef = doc(colUser, req.user.id)
            await updateDoc(userRef, { 
                displayName: displayName ? displayName : "",
                bio: bio ? bio : "",
                link1: link1 ? link1 : "",
                link2: link2 ? link2 : "",
                link3: link3 ? link3 : ""
            })
            res.status(200).json({ message: 'Profile updated successfully' })
        } catch(error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}