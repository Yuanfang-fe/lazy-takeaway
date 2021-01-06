# lazy-takeaway
美团自动点外卖脚本，利用puppeteer从最近订单中随机重新下单

# 初衷
这个程序的初衷是为了节省点外卖的时间（选择困难症用户），但又因为网页版的有些优惠不支持，所有变得有些鸡肋

# 运行
在main.js 中配置相关的账号信息，运行 node main.js 即可下单，然后在手机App里面可以看到会有一个待支付订单，完成支付即可。

# 配置

```
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
```


<video id="video" controls="" preload="none" autoplay>
  <source id="mp4" src="./demo.mp4" type="video/mp4">
</video>
