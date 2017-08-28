const HeadlessChrome = require('../index')

const browser = new HeadlessChrome({
  headless: false
})
async function navigateWebsite () {
  try {
    await browser.init()
    // Open a new Tab
    const mainTab = await browser.newTab({ privateTab: false })

    await mainTab.startScreencast()

    await mainTab.saveScreencast('./examples/screencast/simple-headless-chrome')

    // Navigate to a URL
    await mainTab.goTo('http://infobae.com')

    await mainTab.wait(15000)

    await mainTab.stopScreencast()

    // Close the browser
    await browser.close()
  } catch (err) {
    console.log('ERROR!', err)
  }
}
navigateWebsite()
