const HeadlessChrome = require('../../')
const test = require('tap').test

test('Headless Chrome - Basic navigation', async function (group) {
  group.comment(`Initializating HeadlessChrome...`)
  const browser = new HeadlessChrome({
    headless: true
  })
  await browser.init()

  group.test('example.net', async function (t) {
    const exampleDomain = 'http://example.net'
    t.comment(`Navigating to ${exampleDomain}...`)
    await browser.goTo(exampleDomain)
    t.comment(`Getting page title...`)
    const result = await browser.evaluate(() => document.title)

    t.equal(result.result.value, 'Example Domain', 'Page title is "Example Domain"')

    t.end()
  })

  group.tearDown(async () => {
    // true = kill with SIGHUP
    // https://git.io/vQKpP
    await browser.close(true)
  })
})
