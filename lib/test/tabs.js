const HeadlessChrome = require('../../')
const test = require('tap').test

test('Headless Chrome - Tabs', async function (group) {
  const browser = new HeadlessChrome({headless: true})
  const tabA = await browser.init({privateTab: true})
  const tabB = await browser.newTab({privateTab: false})

  group.test('default tab', async function (t) {
    await browser.goTo('https://www.google.com')
    await tabA.goTo('https://example.com')
    const result = await browser.evaluate(() => document.title)

    t.equal(result.result.value, 'Example Domain', 'Page title is "Example Domain"')
    t.end()
  })

  group.test('two Tabs', async function (t) {
    await tabA.goTo('https://example.com')
    await tabB.goTo('https://www.google.com')
    const resultA = await tabA.evaluate(() => document.title)
    const resultB = await tabB.evaluate(() => document.title)

    t.equal(resultA.result.value, 'Example Domain', 'tabA got to example.com')
    t.equal(resultB.result.value, 'Google', 'tabB got to google.com')
  })

  group.tearDown(async () => {
    // true = kill with SIGHUP
    // https://git.io/vQKpP
    await browser.exit()
  })
})
