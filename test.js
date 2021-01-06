const { default: axios } = require("axios");

axios({
  method: 'post',
  url: 'http://localhost:2222/meituan/login',
  data: {
    phone: 'xxx', // 美团账号
    password: 'xxx', // 美团密码
    headless: false,
    devtools: true,
    rules: {
      // 能接受的价格
      price: {
        // 最低订单价
        lowest: 13,
        // 最高订单价
        highest: 25,
        // 配送费不能超过XX元
        // sendMoney: 5,
      },
      time: {
        // 一天当中的最早时间(早上10点)
        Earliest: '08:00',
        // 一天当中最晚时间 (晚上6点，避免下夜宵的订单) 
        Latest: '18:00',
        // 最近xx天内的订单
        recent: 60
      },
      // 不想点的商家和商品
      ignore: {
        shopNameList: ['新白鹿餐厅（西城广场店）'],
        // productNameList: ['煎饼']
      }
    }
  }
}).then(res=>{
  console.log('111')
})