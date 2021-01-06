var express = require('express');
var router = express.Router();
var meituanController = require('../controller/meituanController')


// 账号密码登录
router.post('/login', meituanController.Login);

// 领红包
// router.post('/getLuckyMoney', meituanController.getLuckyMoney);

// 随机再来一单
// router.post('/randomBuyAgain', meituanController.randomBuyAgain);

module.exports = router;
