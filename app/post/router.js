const express = require('express');
const router = express.Router();
const { createPost } = require("./controller")

router.post("/create", createPost)

module.exports = router