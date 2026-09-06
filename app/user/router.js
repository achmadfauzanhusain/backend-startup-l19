const express = require('express');
const router = express.Router();
const { isLoginUser } = require('../middleware/auth');
const { dataUser, editProfile } = require('./controller');

router.get('/:hashAddress', dataUser)
router.put('/profile', isLoginUser, editProfile);

module.exports = router