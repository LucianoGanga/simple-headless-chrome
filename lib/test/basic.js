const HeadlessChrome = require('../../')
const test = require('tap').test

test('Headless Chrome - Basic navigation', async function (group) {
  group.comment(`Initializating HeadlessChrome...`)
  const browser = new HeadlessChrome({
    headless: false
  })

  await browser.init({
    startNewFirstTab: false
  })

  const tab = await browser.newTab()

  group.test('example.net', async function (t) {
    const exampleDomain = 'http://example.net'
    t.comment(`Navigating to ${exampleDomain}...`)
    await tab.goTo(exampleDomain)
    t.comment(`Getting page title...`)
    const result = await tab.evaluate(() => document.title)

    t.equal(result.result.value, 'Example Domain', `Page title is "${result.result.value}"`)

    t.end()
  })

  group.tearDown(async () => {
    // true = kill with SIGHUP
    // https://git.io/vQKpP
    await browser.close(true)
  })
})
