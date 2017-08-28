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
    console.log(await mainTab.savePdf('./examples/simple-headless-chrome-pdf'))

    // Close the browser
    // await browser.close()
  } catch (err) {
    console.log('ERROR!', err)
  }
}
navigateWebsite()
