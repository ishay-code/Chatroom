//==========================================================================================================
var express = require('express');
var router = express.Router();
const mainFunctions = require("../controllers/main");

//=========================================================================================================
router.get("/verifyUserSession", mainFunctions.verifyUserSession);

//=========================================================================================================
router.use(mainFunctions.requireAuth);

router.get('/message', mainFunctions.getAllMessages);

router.delete('/message/:id', mainFunctions.deleteMessage);

router.put('/message/:id', mainFunctions.updateMessage);

router.post('/message', mainFunctions.createMessage);

router.get("/verifyUserSession",mainFunctions.verifyUserSession);

router.get("/logout",mainFunctions.logout);

router.get("/searchMessagesByText", mainFunctions.getMessagesByText);

router.get('/checkMessages', mainFunctions.checkMessages);

//=========================================================================================================
module.exports = router;
