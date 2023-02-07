const express = require('express')
const router = express.Router()
const UserController = require('../controllers/User')

router.post('/registrar', UserController.register)
//router.post('/usarToken', UserController.useToken)

module.exports = router