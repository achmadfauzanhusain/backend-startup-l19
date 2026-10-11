const { buildPoseidon } = require('circomlibjs');
const snarkjs = require('snarkjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { jwtKey, salt } = require('../../config/index.js');

const { colUser } = require("../../db/firebase.js")
const { setDoc, doc, getDoc } = require("firebase/firestore");

const vKey = JSON.parse(fs.readFileSync(path.join(__dirname, "../../zk/verification-key.json")))

module.exports = {
    register: async(req, res) => {
        try {
            const { address } = req.body;

            if (!address) {
                return res.status(400).json({ message: 'Address is required' });
            }

            const poseidon = await buildPoseidon();
            const F = poseidon.F;

            const addressBigInt = BigInt(address);
            const saltBigInt = BigInt('0x' + salt) % F.p;

            const hashValue = poseidon([addressBigInt, saltBigInt]);
            const hash = F.toString(hashValue);

            const userDocRef = doc(colUser, hash); // hash sbg document ID
            const existingDoc = await getDoc(userDocRef);

            if (existingDoc.exists()) {
                return res.status(409).json({ message: 'Hash already registered' });
            }

            await setDoc(userDocRef, { 
                hash,
                likedPosts: [],
                servers: []
            });

            res.status(200).json({ message: "Registered Successfully!", data: hash });
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    login: async(req, res) => {
        try {
            const { address } = req.body

            if(!address) {
                return res.status(400).json({ message: 'address is empty!' })
            }

            const poseidon = await buildPoseidon();
            const F = poseidon.F;

            const addressBigInt = BigInt(address);
            const saltBigInt = BigInt('0x' + salt) % F.p;

            const hashValue = poseidon([addressBigInt, saltBigInt]);
            const hash = F.toString(hashValue);

            const userDocRef = doc(colUser, hash);
            const existingDoc = await getDoc(userDocRef);

            if (!existingDoc.exists()) {
                return res.status(404).json({ message: 'address not registered!' });
            } else {
                const token = jwt.sign({
                    hash: hash
                }, jwtKey)
                res.status(200).json({ message: "Login Successfully!", data: token });
            }
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}