const HeadlessChrome = require('../index')

const browser = new HeadlessChrome({
  headless: true
})
async function navigateWebsite () {
  await browser.init()
  const mainTab = await browser.newTab({
    privateTab: false
  })
  await mainTab.goTo('https://github.com/LucianoGanga/simple-headless-chrome')

  await browser.close()
}
navigateWebsite()
