const HeadlessChrome = require('../index')

const browser = new HeadlessChrome({
  headless: false // If you turn this off, you can actually see the browser navigate with your instructions
  // see above if using remote interface
})
async function navigateWebsite () {
  await browser.init()
  // Navigate to a URL
  await browser.goTo('http://www.google.com')

  // Resize the viewport to full screen size (One use is to take full size screen shots)
  // await browser.resizeFullScreen()

  // Take a screenshot
  await browser.saveScreenshot('./google')

  // Close the browser
  await browser.close()
}
navigateWebsite()
