const express = require('express');
const router = express.Router();
const { isLoginUser } = require("../middleware/auth")
const { createPost, toggleLike, checkIsLiked, getAllPosts, getPersonalPosts } = require("./controller")

router.post("/create", isLoginUser, createPost)
router.post("/:postId/like", isLoginUser, toggleLike)
router.get("/:postId/like/status", isLoginUser, checkIsLiked)
router.get("/all", getAllPosts)
router.get("/:userId", getPersonalPosts)

module.exports = router