const jwt = require("jsonwebtoken");
const { colUser } = require("../../db/firebase");
const { 
    getDocs,
    where, query 
} = require("firebase/firestore");
const { jwtKey } = require("../../config");

module.exports = {
    isLoginUser: async (req, res, next) => {
        try {
            const token = req.headers.authorization ? req.headers.authorization.replace("Bearer ", "") : null;
            const data = jwt.verify(token, jwtKey);

            const q = query(colUser, where("id", "==", data.user.id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                throw new Error("ur not authorized yet!");
            }

            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            req.user = { id: userDoc.id, ...userData };
            req.token = token;

            next();
        } catch (err) {
            res.status(401).json({
                error: 'Not authorized to access this'
            });
        }
    }
}