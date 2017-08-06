'use strict'

const debug = require('debug')('HeadlessChrome:tab')

const EventEmitter = require('events')

const chrome = require('./chrome')
const setupHandlers = require('./setupHandlers')
const setupViewport = require('./setupViewport')
const setupActions = require('./setupActions')

class Tab extends EventEmitter {
  constructor (host, port, tabOptions, browserInstance) {
    super()
    EventEmitter.call(this)
    this._host = host
    this._port = port
    this._tabOptions = tabOptions
    this._browser = browserInstance

    // Get the browser actions options
    this.options = {
      browser: browserInstance.options.browser,
      deviceMetrics: browserInstance.options.deviceMetrics
    }
  }

  async init () {
    debug(`:: init => Initializating new tab...`)
    const { Target } = this._browser.client

    /**
     * Creates new tab and assign it with CDP
     */
    try {
      const params = {
        url: this._tabOptions.startingUrl
      }

      /**
       * Creates private BrowserContext (if needed)
       * NOTE: private tabs can only be created in headless mode
       */
      if (this._tabOptions.privateTab) {
        if (!this._browser.options.headless) {
          throw new Error(`Can't open a private target/tab if browser is not in headless mode`)
        }
        this._privateTab = params.browserContextId = await Target.createBrowserContext()
      }

      // Create the new target (tab)
      this._target = await Target.createTarget(params)

      // Get the target/tab ID
      this._targetId = this._target.targetId

      // Attach the tab to the CDP
      debug(`:: init => Attaching tab "${this._targetId}" to the CDP...`)
      this.client = await chrome.attachCdpToTarget(this._host, this._port, this._targetId)

      // Setup Actions, Handlers and Viewport
      debug(`:: init => Preparing Actions, Handlers and Viewport for tab "${this._targetId}"...`)
      await setupHandlers.call(this)
      await setupViewport.call(this)
      setupActions.call(this)

      debug(`:: init => Tab "${this._targetId}" initialized successfully!`)

      return this
    } catch (err) {
      debug(`:: init => Could not initialize new target/tab. Error code: ${err.code}`, err)
      if (this._targetId) {
        Target.closeTarget(this._targetId)
      }
      if (this._privateTab) {
        Target.disposeBrowserContext(this._privateTab)
      }
      throw err
    }
  }

  /**
   * Tells if the target/tab is initializated
   */
  isInitialized () {
    return !!this.client
  }

  /**
   * Tells if the target/tab is a private tab
   */
  isPrivate () {
    return (typeof this._privateTab !== 'undefined')
  }

  /**
   * Tells the targe/tab ID
   */
  getId () {
    return this._targetId
  }

  /**
   * Tells the private tab BrowserContext id
   */
  getBrowserContextId () {
    if (this._privateTab) {
      return this._privateTab.browserContextId
    }
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

  async close () {
    debug(`:: close => Closing target/tab "${this._targetId}"...`)
    if (!this.isInitialized()) {
      throw new Error(`Cannot close a tab that it's not initialized`)
    }
    const { Target } = this._browser.client
    const tabId = this.getId()
    try {
      await Target.closeTarget({ targetId: tabId })

      // If it was a private tab, we need to dispose the browser context too
      if (this.isPrivate()) {
        const tabContextId = this.getBrowserContextId()
        await Target.disposeBrowserContext({browserContextId: tabContextId})
      }

      this._closedAt = (new Date()).toISOString()
      this.client = false

      // Tell the browser instance that a target/tab was closed
      this._browser._closeTarget(tabId)

      debug(`:: close => Target/tab "${this._targetId}" closed successfully!`)
      return true
    } catch (error) {
      error.message = `There was a problem closing target/tab. ${error.message}`
      error.tabId = tabId
      throw error
    }
  }

  /**
   * Logs a text in the console
   * @param {string} text - The text to log
   */
  log (text) {
    console.log(`[Tab ID: ${this._targetId}] ${text}`)
    return this
  }

  /**
   * Logs a text in the console, only in debug mode
   * @param {string} text - The text to log
   */
  debugLog (text) {
    debug(`[Tab ID: ${this._targetId}] ${text}`)
    return this
  }
}

module.exports = Tab
