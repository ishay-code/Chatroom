const express = require('express');
const registerFunction = require('../controllers/register');
const loginFunction = require('../controllers/login');
const mainFunction = require('../controllers/main');
const middlewares = require('../controllers/middlewares');
const router = express.Router();

//==========================================================================================================
router.get('/main',  mainFunction.getMainPage);

router.post('/main', mainFunction.postMainPage);

//==========================================================================================================
router.get('/register',middlewares.isUserLoggedIn , registerFunction.getRegisterPage);

router.get('/',middlewares.isUserLoggedIn , loginFunction.getLoginPage);

router.get('/login',middlewares.isUserLoggedIn , loginFunction.getLoginPage);

router.post('/login',middlewares.isUserLoggedIn , loginFunction.postLoginPage);

//==========================================================================================================

module.exports = router;
