const { buildPoseidon } = require('circomlibjs');
const snarkjs = require('snarkjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { jwtKey } = require('../../config/index.js');

const { colUser } = require("../../db/firebase.js")
const { addDoc, setDoc, doc, getDocs, getDoc, query, where } = require("firebase/firestore");

const vKey = JSON.parse(fs.readFileSync(path.join(__dirname, "../../zk/verification-key.json")))

module.exports = {
    register: async(req, res) => {
        try {
            const { address } = req.body;

            if (!address) {
                return res.status(400).json({ message: 'Address is required' });
            }

            const poseidon = await buildPoseidon();
            const hashValue = poseidon([BigInt(address)]);
            const hash = poseidon.F.toString(hashValue);

            const userDocRef = doc(colUser, hash); // hash sbg document ID
            const existingDoc = await getDoc(userDocRef);

            if (existingDoc.exists()) {
                return res.status(409).json({ message: 'Hash already registered' });
            }

            await setDoc(userDocRef, { hash });

            res.status(200).json({ message: "Registered Successfully!", data: hash });
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
    login: async(req, res) => {
        try {
            const { proof, publicSignals } = req.body

            if(!proof || !publicSignals) {
                return res.status(400).json({ message: 'you must generate a proof first' })
            }

            // check hasil hash address di database, apakah sama dengan publicSignals?
            const hash = publicSignals[0];

            const userDocRef = doc(colUser, hash);
            const existingDoc = await getDoc(userDocRef);

            if (!existingDoc.exists()) {
                return res.status(404).json({ message: 'address not registered!' });
            } else {
                const verified = await snarkjs.groth16.verify(
                    vKey,
                    publicSignals,
                    proof
                )
                if(verified) {
                    const token = jwt.sign({
                        hash: publicSignals[0]
                    }, jwtKey)
                    res.status(200).json({ message: "Login Successfully!", data: token });
                } else {
                    res.status(400).json({ message: 'Invalid proof' })
                }
            }
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}