const HeadlessChrome = require('../../')
const test = require('tap').test

test('Headless Chrome - inject methods', async function (group) {
  group.comment(`Initializating HeadlessChrome...`)
  const browser = new HeadlessChrome({
    headless: false
  })

  await browser.init()
  const mainTab = await browser.newTab()

  group.test('#inject(module)', async function (t) {
    await mainTab.goTo('https://httpbin.org/')
    await mainTab.inject('jquery.slim')
    const result = await mainTab.evaluate(() => !!window.jQuery)

    t.equal(result.result.value, true, `module injection`)
    t.end()
  })

  group.test('#inject(remoteScript)', async function (t) {
    await mainTab.goTo('https://httpbin.org/')
    await mainTab.inject('https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.slim.min.js')
    const result = await mainTab.evaluate(() => !!window.jQuery)

    t.equal(result.result.value, true, `remote script injection`)
    t.end()
  })

  group.test('#inject(localFile)', async function (t) {
    await mainTab.goTo('https://httpbin.org/')
    await mainTab.inject('jquery/dist/jquery.slim.min.js')
    const result = await mainTab.evaluate(() => !!window.jQuery)

    t.equal(result.result.value, true, `local file injection`)
    t.end()
  })

  group.test('#injectScript(script)', async function (t) {
    await mainTab.goTo('https://httpbin.org/')
    await mainTab.injectScript('window.jQuery = true')
    const result = await mainTab.evaluate(() => !!window.jQuery)

    t.equal(result.result.value, true, `script injection`)
    t.end()
  })

  group.tearDown(async () => {
    // true = kill with SIGHUP
    // https://git.io/vQKpP
    await browser.close(true)
  })
})
