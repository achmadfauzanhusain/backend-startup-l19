const express = require('express');
const router = express.Router();
const { isLoginUser } = require('../middleware/auth');
const { listChats, openChat, getMessages, sendMessage, markRead } = require("./controller")

router.get('/chats', isLoginUser, listChats);
router.post('/chats', isLoginUser, openChat);
router.get('/chats/:chatId/messages', isLoginUser, getMessages);
router.post('/chats/:chatId/messages', isLoginUser, sendMessage);
router.put('/chats/:chatId/read', isLoginUser, markRead);

module.exports = router