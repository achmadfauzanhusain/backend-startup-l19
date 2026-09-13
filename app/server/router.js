const express = require('express');
const router = express.Router();
const { createServer, getAllServers, getDetailServer, myServers, joinedServers, serverPost } = require("./controller")
const { isLoginUser } = require('../middleware/auth');

router.get("/all", getAllServers)
router.get("/:idServer", getDetailServer)
router.post('/create', isLoginUser, createServer)
router.get("/my/server", isLoginUser, myServers)
router.get("/joined/:hashAddress", joinedServers)
router.post("/:idServer/create", isLoginUser, serverPost)

module.exports = router