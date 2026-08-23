const { buildPoseidon } = require('circomlibjs');
const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');

const { colUser } = require("../../db/firebase.js")
const { addDoc, setDoc, doc, getDocs, getDoc, query, where } = require("firebase/firestore")

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
    }
}