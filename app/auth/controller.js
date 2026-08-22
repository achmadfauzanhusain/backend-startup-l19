const { buildPoseidon } = require('circomlibjs');
const snarkjs = require('snarkjs');
const path = require('path');
const fs = require('fs');

module.exports = {
    register: async(req, res) => {
        try {
            
        } catch (error) {
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }
}