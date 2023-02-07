const express = require('express')
const router = express.Router()
const AuthController = require('../controllers/Authenticator')

router.get('/generarToken/', AuthController.generateToken);
router.post('/usarToken/', AuthController.useToken);

module.exports = router