const express = require('express');
const router = express.Router();
const { isLoginUser } = require('../middleware/auth');
const { dataUser, editProfile, search } = require('./controller');

router.get('/search', search);
router.get('/:hashAddress', dataUser)
router.put('/profile', isLoginUser, editProfile);

module.exports = router