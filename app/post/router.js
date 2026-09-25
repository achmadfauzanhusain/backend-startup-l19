const express = require('express');
const router = express.Router();
const { isLoginUser } = require("../middleware/auth")
const { createPost, toggleLike, checkIsLiked, getAllPosts, getPersonalPosts, getServerPosts } = require("./controller")

router.post("/create", isLoginUser, createPost)
router.post("/:postId/like", isLoginUser, toggleLike)
router.get("/:postId/like/status", isLoginUser, checkIsLiked)
router.get("/all", getAllPosts)
router.get("/:userId", getPersonalPosts)
router.get("/server/:idServer", getServerPosts)

module.exports = router