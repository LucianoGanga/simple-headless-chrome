const HeadlessChrome = require('../')
const test = require('tap').test

test('Headless Chrome', async function (group) {
  const browser = new HeadlessChrome({
    headless: true
  })
  await browser.init()

  group.test('example.com', async function (t) {
    // see available actions https://git.io/vQKpy
    await browser.goTo('https://example.com')
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
