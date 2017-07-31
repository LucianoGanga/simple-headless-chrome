const HeadlessChrome = require('../index')

const browser = new HeadlessChrome({
  headless: false
})
async function navigateWebsite () {
  await browser.init()
  
  //Open a new Tab 
  const mainTab = await browser.newTab({ privateTab: false })
  
  // Navigate to a URL
  await mainTab.goTo('https://github.com/LucianoGanga/simple-headless-chrome')

  // Resize the viewport to full screen size (One use is to take full size screen shots)
  // await browser.resizeFullScreen()

  // Take a screenshot
  await mainTab.saveScreenshot('./google')

  // Close the browser
  await browser.close()
}
navigateWebsite()
