const express = require('express');
const router = express.Router();
const { isLoginUser } = require("../middleware/auth")
const { createPost } = require("./controller")

router.post("/create", isLoginUser, createPost)

module.exports = router