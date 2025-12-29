const express = require('express');
const registerFunction = require('../controllers/register');
const middlewares = require("../controllers/middlewares");
const router = express.Router();

//==========================================================================================================
router.get('/register',middlewares.isUserLoggedIn , registerFunction.getRegisterPage);

router.get('/register-password',middlewares.isUserLoggedIn,registerFunction.returnToHomePage);

router.post('/register-password',middlewares.isUserLoggedIn, registerFunction.postRegisterPasswordPage);

//==========================================================================================================
module.exports = router;
