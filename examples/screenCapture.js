const HeadlessChrome = require('../index')

const browser = new HeadlessChrome({
  headless: false
})
async function navigateWebsite () {
  await browser.init()
  // Navigate to a URL
  await browser.goTo('https://github.com/LucianoGanga/simple-headless-chrome')

  // Resize the viewport to full screen size (One use is to take full size screen shots)
  // await browser.resizeFullScreen()

  // Take a screenshot
  await browser.saveScreenshot('./google')

  // Close the browser
  await browser.close()
}
navigateWebsite()
