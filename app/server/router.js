const express = require('express');
const router = express.Router();
const { createServer } = require("./controller")
const { isLoginUser } = require('../middleware/auth');

router.post('/create', isLoginUser, createServer)

module.exports = router