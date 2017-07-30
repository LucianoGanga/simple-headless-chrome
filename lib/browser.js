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
const merge = require('deepmerge')

const chrome = require('./chrome')
const Tab = require('./Tab')

const defaultOptions = {
  headless: true,
  launchChrome: true, // If false, only connects CDP to the Chrome instance in host:port
  chrome: {
    host: 'localhost',
    port: 0, // Chrome instance port (defaults to 0 to generate a random port)
    remote: false,
    launchAttempts: 3,
    userDataDir: null,
    disableGPU: true,
    handleSIGINT: true,
    flags: ['--enable-logging'],
    noSandbox: false
  },
  tabs: {
    maxTabs: Infinity,
    startingUrl: 'about:blank' // Default starting URL for all the tabs
  },
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
    // Deep merge in order to prevent total override of default params
    this.options = merge(defaultOptions, options)
    this.host = this.options.chrome.host
    this._tabs = [] // TODO: This array must be initialized with the list of tabs of the attached Chrome instance (if the chrome instance is not new but a remote one with existing tabs, this should be autocompleted from that instance)
    this._closedTabs = [] // This keeps track of closed tab ids

    // Add warning and support for old options syntax
    if (typeof this.options.disableGPU !== 'undefined') {
      console.warn(`[simple-headless-chrome] Parameter "disableGPU" is now inside the "chrome" property of the options object. This will be moved in the next version of simple-headless-chrome `)
      this.options.chrome.disableGPU = this.options.disableGPU
    }
  }

  /**
   * Initializates a Chrome instance and opens a new tab
   * If it exceeds the maxTabs defined by user, returns undefined
   * @param {boolean} private Indicates a private tab (supported only in Headless mode)
   * @return - A browser tab instance, with all the actions
   */
  async init ({ privateTab = false, startNewFirstTab = true } = {}) {
    if (this.options.launchChrome) {
      // Launch a new Chrome instance and update the instance port
      const initializationOptions = this.options.chrome
      this.chromeInstance = await chrome.launch(this.options.headless, initializationOptions)
      this.port = this.chromeInstance.port
    }

    try {
      // Attach the Chrome Debugging Protocol to the chrome instance
      this.client = await chrome.attachCdpToBrowser(this.host, this.port, this.options.chrome.remote)

      /**
       * Create the first browser tab and append all the actions to the main class
       * NOTE: this is only to support versions =< 3.2.0 of this module. This will
       * be deprecated in a future version.
       * Check https://github.com/LucianoGanga/simple-headless-chrome/blob/master/release-notes.md
       * for more information about this
       */
      if (startNewFirstTab) {
        Object.assign(this, await this.newTab({
          privateTab,
          startingUrl: this.options.tabs.startingUrl
        }))
      }

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
  async newTab ({ privateTab = false, startingUrl = 'about:blank' } = {}) {
    debug(`:: newTab => Opening a new tab in browser. Private tab: ${privateTab}`)

    /**
     * Don't open tab if maxTabs reached, and not open private tab if not headless
     */
    if (Object.keys(this._tabs).length >= this.options.chrome.maxTabs) {
      const error = new Error(`Can't open new tab. Max tabs limit reached`)
      error.maxTabs = this.options.chrome.maxTabs
      error.openedTabs = Object.keys(this._tabs).length
      throw error
    }

    // Create and initialize the new tab
    const tab = new Tab(this.host, this.port, {
      privateTab,
      startingUrl
    }, this)

    await tab.init()

    this._tabs[tab.getId()] = tab
  }

  async newContext () {

  }

  getTab (tabId) {
    debug(`:: getTab => Getting tab ${tabId}`)
    return this._tabs[tabId]
  }

  /**
   * Lists all the open tabs ids
   */
  async listTabs () {
    debug(`:: listTabs => Listing all tabs`)
    let array = []
    for (let key in this._tabs) {
      array.push(this._tabs[key].id)
    }
    return array
  }

  /**
   * Lists all the private targets/tabs ids
   * only in headless mode
   */
  listPrivateTabs () {
    debug(`:: listPrivateTabs => Listing all private tabs...`)
    if (!this.options.headless) {
      debug(`:: listPrivateTabs => Can't list private tabs without headless mode!`)
      return
    }

    let array = []
    for (let key in this._tabs) {
      if (this._tabs[key].privateTab) array.push(this._tabs[key].id)
    }
    debug(`:: listPrivateTabs => "${array.length}" private tabs found.`)
    return array
  }

  /**
   * Closes the main tab
   * @return {boolean} true if closed successfully
   */
  async close (killChromeInstance = false) {
    debug(`:: close => Closing the main browser target/tab...`)

    try {
      if (!this.tabId) {
        debug(`:: close => There's no tabId. Cannot close main tab.`)
        throw new Error(`Cannot close main tab.`)
      }
      this.closeTab(this.tabId)
      if (killChromeInstance) await this.exit()
      return true
    } catch (err) {
      debug(`:: close => There was an error when trying to close the target/tab`, err)
      throw err
    }
  }

  /**
   * Exit the Chrome instance
   * @return {boolean} true if exited successfully
   */
  async exit () {
    if (!this.options.launchChrome) return
    try {
      await this.client.close()
      this.client = null
      delete this._tabs
      await this.chromeInstance.kill('SIGHUP')
      return true
    } catch (err) {
      throw err
    }
  }

  /**
   * PRIVATE METHOD - Erases all the information of a closed target/tab.
   * @param {string} the target/tab ID that was closed
   */
  async _closeTarget (tabId) {
    const target = this._browser._tabs[tabId]

    // Save information about the closed tab
    this._browser._closedTabs.push({
      id: tabId,
      closedAt: target.closedAt,
      instance: target
    })

    // Remove the tab from the active tabs list
    delete this._browser._tabs[tabId]
  }

  /**
   * Logs a text in the console
   * @param {string} text - The text to log
   */
  log (text) {
    console.warn(`Method log() was removed from the browser instance since v3.3.0. You can call it from the target/tab instance`)
    return this
  }

  /**
   * Logs a text in the console, only in debug mode
   * @param {string} text - The text to log
   */
  debugLog (text) {
    console.warn(`Method log() was removed from the browser instance since v3.3.0. You can call it from the target/tab instance`)
    return this
  }
}

module.exports = HeadlessChrome
