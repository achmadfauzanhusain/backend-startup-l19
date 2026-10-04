const express = require('express');
const router = express.Router();
const { isLoginUser } = require('../middleware/auth');
const { dataUser, editProfile, search } = require('./controller');

router.get('/search', search);
router.put('/profile', isLoginUser, editProfile);
router.get('/:hashAddress', dataUser)

module.exports = router