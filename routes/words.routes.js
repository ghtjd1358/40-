const express = require('express');
const router = express();

const controller = require('../controllers/word.controller');

router.get('/', controller.getAddWord);

router.post('/addword', controller.addWord);

router.get('/keyboard', controller.getKeyboard);



module.exports = router;