const HeadlessChrome = require('../index')

const browser = new HeadlessChrome({
  headless: true
})
async function navigateWebsite () {
  try {
    await browser.init()

    // Open a new Tab
    const mainTab = await browser.newTab({ privateTab: false })

    // Navigate to a URL
    await mainTab.goTo('https://github.com/LucianoGanga/simple-headless-chrome')

    // Take a screenshot of the selector with the files
    await mainTab.saveScreenshot('./examples/simple-headless-chrome-files', {
      selector: '.file-wrap'
    })

    // Take a screenshot with the screen size
    await mainTab.saveScreenshot('./examples/simple-headless-chrome-screen')

    // Take a screenshot of the full page
    await mainTab.saveScreenshot('./examples/simple-headless-chrome-full', {
      fullPage: true
    })

    // Close the browser
    await browser.close()
  } catch (err) {
    console.log('ERROR!', err)
  }
}
navigateWebsite()
