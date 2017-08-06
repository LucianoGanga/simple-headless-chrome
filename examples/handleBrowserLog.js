const HeadlessChrome = require('../index')

const browser = new HeadlessChrome({
  headless: false,
  browser: {
    /**
     * Call the HeadlessChrome instance with a custom fn in browser.browserLog.
     * You can also pass a boolean "true" and will do the same trick, but using the
     * default log handling fn from simple-headless-chrome
     */
    browserLog: function (d) {
      switch (d.entry.level) {
        case 'verbose':
          console.log(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry)
          break
        case 'info':
          console.info(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry)
          break
        case 'warning':
          console.warn(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry)
          break
        case 'error':
          console.error(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry)
          break
        default:
          console.log(`Browser says: [${d.entry.source}] ${d.entry.text}`, d.entry)
          break
      }
    }
  }
})
async function navigateWebsite () {
  try {
    await browser.init()
    const mainTab = await browser.newTab({
      privateTab: false
    })
    await mainTab.goTo('https://www.facebook.com')

    await mainTab.goTo('https://www.example.org')

    await browser.close()
  } catch (err) {
    console.log('ERROR!', err)
  }
}
navigateWebsite()
