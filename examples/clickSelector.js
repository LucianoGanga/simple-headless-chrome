const HeadlessChrome = require('../index')

const browser = new HeadlessChrome({
  headless: false
})
async function navigateWebsite () {
  try {
    await browser.init()
    const mainTab = await browser.newTab({
      privateTab: false
    })
    await mainTab.goTo('https://github.com/LucianoGanga/simple-headless-chrome/issues/44')

    await mainTab.click('#js-repo-pjax-container > div.pagehead.repohead.instapaper_ignore.readability-menu.experiment-repo-nav > div:nth-child(2) > nav > span:nth-child(3) a')
    await mainTab.log('Wait 10 seconds so you can see that the click worked. Now it should be in the Pull Request tab 😀 ')
    await mainTab.wait(10000)
    await browser.close()
  } catch (err) {
    console.log('ERROR!', err)
  }
}
navigateWebsite()
