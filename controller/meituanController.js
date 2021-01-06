const puppeteer = require('puppeteer');
const { body, validationResult } = require("express-validator");

exports.Login = [
  body("phone", "缺少参数用户名").isLength({ min: 1 }).trim(),
  body("password", "缺少参数密码").isLength({ min: 1 }).trim(),
  function (req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return apiResponse.ErrorResponse(res, errors.array()[0].msg);
      } else {
        const { phone, password, headless = true, devtools = false, rules } = req.body;
        openBrowser({
          phone,
          password,
          headless,
          devtools,
          rules,
          userAgent: 'imeituan/11.4.401 (iPhone; iOS 14.3; Scale/2.00)'
        })
      }
    } catch(error) {
      console.log(error)
      const isStr = typeof error === "string";
      return apiResponse.ErrorResponse(res, isStr ? error : error.message);
    }
  }
]

// 浏览器打开美团
async function openBrowser(options) {
  let args = ["--no-sandbox"];
  const browser = await puppeteer.launch({
    // executablePath:
    //   os.platform() === "darwin"
    //     ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    //     : "chrome.exe",
    ignoreHTTPSErrors: true,
    headless: options.headless, // 是否关闭图形化界面
    devtools: options.devtools,
    args
  });
  const page = await browser.newPage();
  page.setUserAgent(options.userAgent);

  await page.setViewport({
    width: 375,
    height: 667,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: false,
  });


  console.log("进入登录页");
  const url = "https://passport.meituan.com/useraccount/ilogin";

  await page.goto(url, {
    timeout: 0
  });
  
  await page.type('#phoneNumInput', options.phone, {
    delay: 50
  })

  await page.click('#toAccountLogin', {
    delay: 0
  })

  await page.type('#accountInput', options.phone, {
    delay: 50
  }) 

  await page.type('#accountPwInput', options.password, {
    delay: 50
  })

  console.log('点击登录')
  await Promise.all([
    page.waitForNavigation(),
    page.click('#accountLogin')
  ]);
  
  await page.waitForTimeout(500);

  await page.waitForSelector("#account > header > div.nav-wrap-right > a:nth-child(1)")

  console.log('点击首页')
  await Promise.all([
    page.waitForNavigation(),
    page.tap('#account > header > div.nav-wrap-right > a:nth-child(1)')
  ]);
  await page.waitForSelector("#index > dl > dd > ul.icon-list.page.current > li:nth-child(5) > a")

  console.log('点击外卖')
  await Promise.all([
    page.waitForNavigation(),
    page.tap('#index > dl > dd > ul.icon-list.page.current > li:nth-child(5) > a')
  ]);

  await page.waitForSelector("#wm-container > div > div > div._3dTUWYHHKToiGQVU_vBFG6 > div > a:nth-child(2)");
  
  console.log('点击订单')
  await Promise.all([
    page.waitForNavigation(),
    page.tap('#wm-container > div > div > div._3dTUWYHHKToiGQVU_vBFG6 > div > a:nth-child(2)')
  ]);

  let list = [];//订单列表
  let pageNo = 1;
  let filterList = []

  /* 页面滚动方法 */
  async function scrollPage() {
    /*执行js代码（滚动页面）*/
    await page.evaluate((pageNo) => {
      const selector = "#wm-container > div > div > div._3SdhyvCnU7gBI8-9aO-ZtS";
      console.log('pageNo===>'+pageNo)
      /* 这里作的是渐进滚动，若是一次性滚动则不会触发获取新数据的监听 */
      for (var y = 0; y <= 2080 * pageNo; y += 100) {
        document.querySelector(selector).scrollTo(0, y);
      }
    }, pageNo)
    pageNo++;
  }

  await page.on('response',
    function (response) {
      return new Promise((resolve, reject)=> {
        const url = response.url();
        if (url.includes('https://i.waimai.meituan.com/openh5/order/list')) {
          // 获取订单列表
          console.log(url)  //显示响应的 URL，字符串
          if (response.ok()) {
            response.text().then(async (body) => {
              const jsonBody = JSON.parse(body)
              if (jsonBody.code === 0) {
                const data = jsonBody.data;
                const { orderList, isEnd } = data;
                list = list.concat(orderList)
                if (list.length < 30 && !isEnd) {
                  // 滚动加载
                  scrollPage();
                }
                if ((list.length && pageNo == 3) || isEnd) {
                  // list 规则筛选
                  filterList = filterListByRules(list, options.rules);
                  // 随机抽取一单
                  const orderId = randomOrderId(filterList);
                  // 点击 orderId 的 “再来一单”
                  clickBuyAgainBtn(page, orderId)
                  
                }
              }
            })
          }
        } 
        else if (url.includes('https://i.waimai.meituan.com/openh5/poi/food')){
          // 点击“再来一单”，判断是否能下单（商家有可能下线或者暂停营业）
          if (response.ok()) {
            response.text().then(async (body) => {
              const jsonBody = JSON.parse(body)
              if (jsonBody.code === 1) {
                console.log(jsonBody.msg)
                console.log('重新抽取');
                const orderId = randomOrderId(filterList);
                // 页面返回上一页
                await page.goBack();
                // 点击 orderId 的 “再来一单”
                clickBuyAgainBtn(page, orderId)
              } else if (jsonBody.code === 0){
                // 这里可以判断配送费如果过多，再重新抽取订单
                
                // 点击结算
                clickJieSuan(page)
                
                // 点击提交订单
                clickSubmitOrder(page)
                resolve()
              }
            })
          }
        }
      })
      
    }
  );
  
  function filterListByRules(list, rules){
    console.log('列表规则过滤')
    let filters = [];
    // 价格筛选
    filters = list.filter(item => {
      return item.totalPrice <= rules.price.highest && item.totalPrice >= rules.price.lowest;
    })
    .filter(item=> {
      // 订单早晚时间筛选
      const time = item.orderTime.split(' ')[1];
      return time >= rules.time.Earliest && time <= rules.time.Latest;
    })
    .filter(item=>{
      // 订单最近XX天内筛选
      const now = new Date().getTime();
      return item.orderTimeSec * 1000 >= (now - (rules.time.recent * 24 * 60 * 60 * 1000));
    })
    .filter(item => {
      // 筛选不选的商家
      return !rules.ignore.shopNameList.includes(item.shopName)
    })

    // 时间筛选
    return filters;
  }
}

function randomOrderId(list) {
  console.log('随机抽取一单')
  const orderId = list[Math.round(Math.random() * (list.length - 1))].orderId
  return orderId
}

async function clickBuyAgainBtn(page, orderId) {
  console.log('点击再来一单按钮')

  const selector = `#wm-container > div > div > div > ul > li > div[data-mtorderviewid="${orderId}"] > p > a:nth-child(2)`;
  await page.waitForSelector(selector)

  await Promise.all([
    page.waitForNavigation(),
    page.tap(selector)
  ]);
}

async function clickJieSuan(page) {
  console.log('点击结算')
  const selector = `#cart > div:nth-child(3) > div:nth-child(3)`;
  
  await page.waitForSelector(selector)

  await Promise.all([
    page.waitForNavigation(),
    page.tap(selector)
  ]);
}

async function clickSubmitOrder(page) {
  console.log('点击结算')
  const selector = '#wm-container > div > div > div > div > div > div > div > div > button > span > span';

  await page.waitForSelector(selector)

  await Promise.all([
    page.waitForNavigation(),
    page.tap(selector)
  ]);
}