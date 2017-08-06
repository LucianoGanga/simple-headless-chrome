const HeadlessChrome = require('../index')

const browser = new HeadlessChrome({
  headless: true
})
async function navigateWebsite () {
  try {
    await browser.init()
    const mainTab = await browser.newTab({
      privateTab: false
    })
    await mainTab.goTo('https://github.com/LucianoGanga/simple-headless-chrome')

    await browser.close()
  } catch (err) {
    console.log('ERROR!', err)
  }
}
navigateWebsite()
