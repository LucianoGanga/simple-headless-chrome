const HeadlessChrome = require('../../')
const test = require('tap').test

test('Headless Chrome - Basic navigation', async function (group) {
  group.comment(`Initializating HeadlessChrome...`)
  const browser = new HeadlessChrome({
    headless: true
  })

  await browser.init()
  const mainTab = await browser.newTab()

  group.test('example.net', async function (t) {
    const exampleDomain = 'http://example.net'
    await mainTab.goTo(exampleDomain)

    const mainTabEvaluate = await mainTab.evaluate(() => document.title)

    t.equal(mainTabEvaluate.result.value, 'Example Domain', `Page title is "${mainTabEvaluate.result.value}"`)

    t.end()
  })

  group.tearDown(async () => {
    // true = kill with SIGHUP
    // https://git.io/vQKpP
    await browser.close(true)
  })
})
