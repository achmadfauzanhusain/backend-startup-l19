const express = require('express');
const router = express.Router();
const { isLoginUser } = require("../middleware/auth")
const { createPost, toggleLike, checkIsLiked } = require("./controller")

router.post("/create", isLoginUser, createPost)
router.post("/:postId/like", isLoginUser, toggleLike)
router.get("/:postId/like/status", isLoginUser, checkIsLiked)

module.exports = router