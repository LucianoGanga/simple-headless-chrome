'use strict'

const debug = require('debug')('HeadlessChrome:browser')

/**
 * Created by: Luciano A. Ganga
 * Inspired by:
 *    - Doffy (https://github.com/qieguo2016/doffy)
 *    - Horseman (https://github.com/johntitus/node-horseman)
 * More Info:
 * https://developers.google.com/web/updates/2017/04/headless-chrome
 * https://chromedevtools.github.io/devtools-protocol
 * https://github.com/cyrus-and/chrome-remote-interface
 */
const chromeLauncher = require('chrome-launcher')
const CDP = require('chrome-remote-interface')
const merge = require('deepmerge')

const { sleep } = require('./util')

const defaultOptions = {
  headless: true,
  disableGPU: true,
  launchChrome: true, // If false, only connects CDP to the Chrome instance in host:port
  chrome: {
    host: 'localhost',
    port: 0, // Chrome instance port (defaults to 0 to generate a random port)
    remote: false,
    launchAttempts: 3,
    userDataDir: null,
    handleSIGINT: true,
    flags: ['--enable-logging'],
    noSandbox: false
  },
  maxTabs: Infinity,
  loadPageTimeout: 60000,
  loadSelectorInterval: 500,
  loadSelectorTimeout: 60000,
  browserLog: false,
  deviceMetrics: {
    width: 1024,
    height: 768,
    deviceScaleFactor: 0,
    mobile: false,
    fitWindow: false
  }
}

class HeadlessChrome {
  constructor (options = {}) {
    // deep merge in order to prevent total override of default params
    this.options = merge(defaultOptions, options)
    this.host = this.options.chrome.host
  }

  /**
   * Initializates a Chrome instance and opens a new tab
   * If it exceeds the maxTabs defined by user, returns undefined
   * @param {boolean} private Indicates a private tab (supported only in Headless mode)
   * @return - A browser tab instance, with all the actions
   */
  async init ({privateTab = false} = {}) {
    if (this.options.launchChrome) {
      // Launch a new Chrome instance and update the instance port
      this.chromeInstance = await _launchChrome({
        startingUrl: 'about:blank',
        headless: this.options.headless,
        disableGPU: this.options.disableGPU,
        port: this.options.chrome.port,
        userDataDir: this.options.chrome.userDataDir,
        launchAttempts: this.options.chrome.launchAttempts,
        chromeFlags: this.options.chrome.flags,
        handleSIGINT: this.options.chrome.handleSIGINT
      })
      this.port = this.chromeInstance.port
    }

    try {
      this.browser = await _attachCdpToChrome(this.host, this.port, this.options.chrome.remote)
      this.tabs = []

      // supoort default tab within the main class to support all actions
      Object.assign(this, await this.newTab({privateTab}))

      return this
    } catch (err) {
      await this.chromeInstance.kill()
      throw err
    }
  }

  /**
   * Initializates a new Chrome tab and controls it.
   * If it exceeds the maxTabs defined by user, returns undefined
   * @param {boolean} privateTab Indicates a private tab (supported only in Headless mode)
   * @return - A browser tab instance, with all the actions
   */
  async newTab ({privateTab = false} = {}) {
  /**
    * don't open tab if maxTabs reached, and not open private tab if not headless
    */
    if (Object.keys(this.tabs).length >= this.options.maxTabs) return
    if (privateTab && !this.options.headless) return

    debug(':: newTab => Opening a new tab in browser.')

    /**
     * creates private BrowserContext
     */
    const {Target} = this.browser
    let browserContextId
    if (privateTab) browserContextId = await this.browser.Target.createBrowserContext()

    /**
     * creates new tab and assign it with CDP
     */
    try {
      let params = {}
      params.url = 'about:blank'
      if (browserContextId) params.browserContextId = browserContextId
      const {targetId} = await Target.createTarget(params)
      const tab = this.tabs[targetId] = new Tab({
        id: targetId,
        host: this.host,
        port: this.port,
        options: this.options
      })
      await tab.init()

      if (privateTab) tab.privateTab = browserContextId
      debug('created new tab, and going to attach CDP')
      return tab
    } catch (err) {
      debug(`could not create a new target. Error code: ${err.code}`, err)
      if (targetId) Target.closeTarget(targetId)
      if (privateTab) Target.disposeBrowserContext(browserContextId)
      throw err
    }
  }

  getTab (tabId) {
    return this.tabs[tabId]
  }

  /**
   * Lists all the open tabs ids
   */
  async listTabs () {
    let array = []
    for (let key in this.tabs) {
      array.push(this.tabs[key].id)
    }
    return array
  }

  /**
   * Lists all the private tabs ids
   * only in headless mode
   */
  listPrivateTabs () {
    if (!this.options.headless) return

    let array = []
    for (let key in this.tabs) {
      if (this.tabs[key].privateTab) array.push(this.tabs[key].id)
    }
    return array
  }

  /**
   * Closes the main tab
   * @return {boolean} true if closed successfully
   */
  async close (killChromeInstance = false) {
    debug(`:: close => Closing the main browser target/tab.`)
    try {
      if (!typeof this.client || !this.client) return false

      await closeTab(this.client.id)
      delete this.client
      if (killChromeInstance) await exit()
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Closes the target/tab
   * @param {string} the tab id to close
   * @return {boolean} true if the tab closed successfully
   */
  async closeTab (tabId) {
    debug(`:: close => Closing the browser target/tab.`)
    try {
      await this.browser.Target.closeTarget({tabId})
      if (this.tabs[tabId].isPrivate()) { this.browser.Target.disposeBrowserContext(this.tabs[tabId].getBrowserContextId()) }
      delete this.tabs[tabId]
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Exit the Chrome instance
   * @return {boolean} true if exited successfully
   */
  async exit () {
    if (!this.options.launchChrome) return
    try {
      await this.browser.close()
      this.browser = null
      delete this.tabs
      await this.chromeInstance.kill('SIGHUP')
      return true
    } catch (err) {
      return false
    }
  }

  /**
   * Logs a text in the console
   * @param {string} text - The text to log
   */
  log (text) {
    console.log(text)
    return this
  }

  /**
   * Logs a text in the console, only in debug mode
   * @param {string} text - The text to log
   */
  debugLog (text) {
    debug(text)
    return this
  }
}

module.exports = HeadlessChrome

const EventEmitter = require('events')
const setupHandlers = require('./setupHandlers')
const setupViewport = require('./setupViewport')
const setupActions = require('./setupActions')

class Tab extends EventEmitter {
  constructor ({id, host, port, options}) {
    super()
    EventEmitter.call(this)
    this.id = id
    this.host = host
    this.port = port
    this.options = options
  }

  async init () {
    this.client = await _attachCdpToTab(this.host, this.port, this.id)
    await _attachSettings.call(this)
  }

/**
 * Tells if the tab is initializated
 */
  isInitialized () {
    return !!this.client
  }

/**
 * Tells if the tab is a private tab
 */
  isPrivate () {
    return typeof this.privateTab
  }

/**
 * Tells the tab id
 */
  getId () {
    return this.id
  }

/**
 * Tells the private tab BrowserContext id
 */
  getBrowserContextId () {
    if (typeof this.privateTab) return this.privateTab
    else return undefined
  }

  /**
   * Support attaching actions
   * @param {String} name - Method name
   * @param {Function} fn - Method implementation
   */
  addAction (name, fn) {
    if (typeof fn === 'function') {
      this[name] = fn
    }
    return this
  }
}

/**
 * Launches a debugging instance of Chrome on port 9222.
 * @param {boolean=} headless True (default) to launch Chrome in headless mode.
 *     Set to false to launch Chrome normally.
 * @return {object} - Chrome instance data
 *    @property {number} pid - The Process ID used by the Chrome instance
 *    @property {number} port - The port used by the Chrome instance
 *    @property {string} userDataDir - The userDataDir used by the Chrome instance
 *    @property {async fn} kill - Fn to kill the Chrome instance
 */
async function _launchChrome ({ headless = true, disableGPU = true, noSandbox = false, port = 0, userDataDir, launchAttempts, handleSIGINT, chromeFlags }) {
  debug(`Launching Chrome instance. Headless: ${headless === true ? 'YES' : 'NO'}`)

  const chromeOptions = {
    port: port,
    handleSIGINT: handleSIGINT,
    userDataDir: userDataDir,
    chromeFlags: chromeFlags
  }

  if (disableGPU) { chromeOptions.chromeFlags.push('--disable-gpu') }
  if (headless) { chromeOptions.chromeFlags.push('--headless') }
  if (noSandbox) { chromeOptions.chromeFlags.push('--no-sandbox') }

  let attempt = 0
  let instance

  while (!instance && attempt++ < launchAttempts) {
    debug(`Launching Chrome. Attempt ${attempt}/${launchAttempts}...`)
    try {
      instance = await chromeLauncher.launch(chromeOptions)
    } catch (err) {
      debug(`Can't launch Chrome in attempt ${attempt}/${launchAttempts}. Error code: ${err.code}`, err)
      if (err.code === 'EAGAIN' || err.code === 'ECONNREFUSED') {
        await sleep(1000 * attempt)
        if (attempt >= launchAttempts) {
          throw err
        }
      } else {
        throw err
      }
    }
  }

  if (!instance) {
    throw new Error(`Can't launch Chrome! (attempts: ${attempt - 1}/${launchAttempts})`)
  }

  debug(`Chrome instance launched in port "${instance.port}", pid "${instance.pid}"`)

  return instance
}

/**
 * Attach the Chrome Debugging Protocol to a Chrome instance in given host:port combination
 * Attaching CDP allows the use of a wide browser's methods.
 * @See https://chromedevtools.github.io/devtools-protocol/ for more info
 * @param {string} host - The host of the Chrome instance
 * @param {number} port - The port number of the Chrome instance
 * @param {boolean} remote - A boolean indicating whether the protocol must be fetched remotely or if the local version must be used
 */

async function _attachCdpToChrome (host = 'localhost', port = 9222, remote = false) {
  debug(`Preparing Chrome Debugging Protocol (CDP) for host "${host}" and port "${port}"...`)
  try {
    let browser
    if (process.platform === 'win32') browser = await CDP({host, port, remote})
    else browser = await CDP({target: `ws://${host}:${port}/devtools/browser`})

    debug('CDP prepared for browser')
    return browser
  } catch (err) {
    debug(`Couldnt connect CDP to browser`)
    throw err
  }
}

async function _attachCdpToTab (host, port, targetId) {
  debug(`Preparing Chrome Debugging Protocol (CDP) for Tab "${targetId}"...`)
  try {
    const client = await CDP({target: targetId, host, port})
    /**
     * Enable Domains "Network", "Page", "DOM" and "CSS" in the client
     */
    await Promise.all([
      client.Network.enable(),
      client.Page.enable(),
      client.DOM.enable(),
      client.CSS.enable()
    ])

    debug('CDP prepared for tab!')

    return client
  } catch (err) {
    debug(`Couldnt connect CDP to tab`)
    throw err
  }
}

async function _attachSettings () {
  debug(`Preparing Handlers for Tab...`)
  /**
   * Setup handlers
   */
  setupHandlers.call(this)

  /**
   * Setup viewport
   */
  await setupViewport.call(this)

  /**
   * Setup Actions
   */
  setupActions.call(this)

  debug('All handlers and actions were correctly binded to the tab')
}
