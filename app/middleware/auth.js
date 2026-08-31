const jwt = require("jsonwebtoken");
const { colUser } = require("../../db/firebase");
const { 
    getDoc, doc
} = require("firebase/firestore");
const { jwtKey } = require("../../config");

module.exports = {
    isLoginUser: async (req, res, next) => {
        try {
            const token = req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : null;
            const data = jwt.verify(token, jwtKey);

            // data.hash, bukan data.id — sesuai payload saat sign token
            const userDocRef = doc(colUser, data.hash);
            const userDoc = await getDoc(userDocRef);
            console.log(userDoc.data())

            if (!userDoc.exists()) {
                throw new Error("ur not authorized yet!");
            }

            req.user = { id: userDoc.id, ...userDoc.data() };
            req.token = token;

            next();
        } catch (err) {
            res.status(401).json({
                message: 'Not authorized to access this'
            });
        }
    }
}