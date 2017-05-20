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
const EventEmitter = require('events')
const { ChromeLauncher } = require('lighthouse/lighthouse-cli/chrome-launcher')
const CDP = require('chrome-remote-interface')

const setupHandlers = require('./setupHandlers')
const setupViewport = require('./setupViewport')
const setupActions = require('./setupActions')

const defaultOptions = {
  headless: true,
  loadPageTimeout: 60000,
  deviceMetrics: {
    width: 1024,
    height: 768,
    deviceScaleFactor: 0,
    mobile: false,
    fitWindow: false
  }
}

class HeadlessChrome extends EventEmitter {
  constructor (options) {
    super()
    EventEmitter.call(this)
    this.options = Object.assign(defaultOptions, options)
  }

  async init () {
    debug('Launching HeadlessChrome.')
    this.chromeLauncher = await launchChrome({ headless: this.options.headless })
    if (!this.chromeLauncher) {
      throw new Error(`Can't not launch Chrome!`)
    }

    /**
     * Setup the Chrome Debugging Protocol
     * @See https://chromedevtools.github.io/devtools-protocol/ for more info
     */
    debug('Preparing Chrome Debugging Protocol (CDP)...')
    const { Network, Page, DOM, CSS } = this.client = await CDP()

    this.client.on('error', (err) => {
      // cannot connect to the remote endpoint
      throw err
    })

    debug('CDP prepared! Setting browser abrstraction up...')

    /**
     * Enable Domains "Network", "Page", "DOM" and "CSS" in the client
     */
    await Promise.all([
      Network.enable(),
      Page.enable(),
      DOM.enable(),
      CSS.enable()
    ])

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

    debug('CDP setting up completed! All handlers and actions were correctly binded to the browser')
    return this
  }

  /**
   * Tells if the browser instance is initializated
   */
  isInitialized () {
    return !!this.client
  }

  /**
   * Closes the browser instance
   * @param {boolean} exit Indicates if chromeLauncher must be killed with SIGHUP
   */
  async close (exit = false) {
    debug('Closing browser client...')
    try {
      this.client.close()
      exit && await this.chromeLauncher.kill('SIGHUP')
      debug('Browser closed!')
    } catch (err) {
      throw err
    }
    return this
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

/**
 * Launches a debugging instance of Chrome on port 9222.
 * @param {boolean=} headless True (default) to launch Chrome in headless mode.
 *     Set to false to launch Chrome normally.
 * @return {Promise<ChromeLauncher>}
 */
async function launchChrome ({ headless = true }) {
  debug(`Start Chrome instance headless: ${headless}`)
  const launcher = new ChromeLauncher({
    port: 9222,
    autoSelectChrome: true, // False to manually select which Chrome install.
    additionalFlags: ['--disable-gpu', headless ? '--headless' : '']
  })

  try {
    await launcher.run()
  } catch (err) {
    // Kill Chrome if there's an error
    await launcher.kill()
    throw err
  }
  return launcher
}
