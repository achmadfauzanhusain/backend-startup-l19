const express = require('express');
const router = express.Router();
const { isLoginUser } = require('../middleware/auth');
const { dataUser, editProfile, search, setPublicKey, getPublicKey } = require('./controller');

router.get('/search', search);
router.put('/profile', isLoginUser, editProfile);
router.put('/publickey', isLoginUser, setPublicKey);
router.get('/:hashAddress/publickey', getPublicKey);
router.get('/:hashAddress', dataUser)

module.exports = router