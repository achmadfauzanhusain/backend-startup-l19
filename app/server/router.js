const express = require('express');
const router = express.Router();
const { createServer, getAllServers, getDetailServer, myServers } = require("./controller")
const { isLoginUser } = require('../middleware/auth');

router.get("/all", getAllServers)
router.get("/:idServer", getDetailServer)
router.post('/create', isLoginUser, createServer)
router.get("/my/server", isLoginUser, myServers)

module.exports = router