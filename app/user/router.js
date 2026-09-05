const express = require('express');
const router = express.Router();
const { isLoginUser } = require('../middleware/auth');
const { editProfile } = require('./controller');

router.put('/profile', isLoginUser, editProfile);

module.exports = router