const HeadlessChrome = require('../../')
const test = require('tap').test

test('Headless Chrome - Tabs', async function (group) {
  group.comment(`Initializating HeadlessChrome...`)
  const browser = new HeadlessChrome({
    headless: true
  })
  await browser.init()

  group.test('Open 2 tabs', async function (t) {
    const tabA = await browser.newTab({ privateTab: false })
    const tabB = await browser.newTab({ privateTab: false })

    // Navigate main tab to exampleDomain
    const exampleDomain = 'http://example.net'
    await tabA.goTo(exampleDomain)

    // Navigate second tab to Google
    const google = 'http://google.com'
    await tabB.goTo(google)

    // Get main tab title
    const tabAEvaluate = await tabA.evaluate(() => document.title)
    t.equal(tabAEvaluate.result.value, 'Example Domain', `tabA got to example.net`)

    // Get second tab title
    const tabBEvaluate = await tabB.evaluate(() => document.title)
    t.equal(tabBEvaluate.result.value, 'Google', 'tabB got to google.com')

    t.end()
  })

  group.tearDown(async () => {
    // true = kill with SIGHUP
    // https://git.io/vQKpP
    await browser.close(true)
  })
})
