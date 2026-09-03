const { colUser } = require("../../db/firebase.js")

module.exports = {
    editProfile: async(req, res) => {
        try {
            const { displayName, bio, link1, link2, link3 } = req.body

            const userRef = doc(colUser, req.user.id)
            await updateDoc(userRef, { 
                displayName, 
                bio, 
                link1, 
                link2, 
                link3 
            })
            res.status(200).json({ message: 'Profile updated successfully' })
        } catch(error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}