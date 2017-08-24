const HeadlessChrome = require('../../')
const test = require('tap').test

test('Headless Chrome - Tabs', async function (group) {
  group.comment(`Initializing HeadlessChrome...`)
  const browser = new HeadlessChrome({
    headless: true
  })
  await browser.init()

  const tabA = await browser.newTab({ privateTab: false })
  const tabB = await browser.newTab({ privateTab: true })
  let targets = 0

  group.test('Open 2 tabs', async function (t) {
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

    // information on number of tabs, for next tests
    const { targetInfos } = await browser.client.Target.getTargets()
    targets = targetInfos.length
  })

  group.test('Close tab A', async function (t) {
    const id = tabA.getId()
    await tabA.close()
    const { targetInfos } = await browser.client.Target.getTargets()
    t.equal(targetInfos.length, --targets, 'tab A is closed')
    t.equal(browser.getTab(id), undefined, 'and is not in tabs list')
  })

  group.test('Close tab B', async function (t) {
    const id = tabB.getId()
    await tabB.close()
    const { targetInfos } = await browser.client.Target.getTargets()
    t.equal(targetInfos.length, --targets, 'tab B is closed')
    t.equal(browser.getTab(id), undefined, 'and is not in tabs list')
  })

  group.tearDown(async () => {
    // true = kill with SIGHUP
    // https://git.io/vQKpP
    await browser.close(true)
  })
})
