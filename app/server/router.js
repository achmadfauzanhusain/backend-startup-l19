const express = require('express');
const router = express.Router();
const { createServer, getAllServers, getDetailServer } = require("./controller")
const { isLoginUser } = require('../middleware/auth');

router.get("/all", getAllServers)
router.get("/:idServer", getDetailServer)
router.post('/create', isLoginUser, createServer)

module.exports = router