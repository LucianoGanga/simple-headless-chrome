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
const chromeInstance = require('lighthouse/chrome-launcher')
const CDP = require('chrome-remote-interface')
const setupHandlers = require('./setupHandlers')
const setupViewport = require('./setupViewport')
const setupActions = require('./setupActions')

const defaultOptions = {
  headless: true,
  launchChrome: true, // If false, only connects CDP to the Chrome instance in host:port
  chrome: {
    host: 'localhost',
    port: 0, // Chrome instance port (defaults to 0 to generate a random port)
    remote: false
  },
  loadPageTimeout: 60000,
  browserLog: false,
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
    this.host = this.options.chrome.host
    this.port = this.options.chrome.port
  }

  /**
   * Initializates a new Chrome instance and controls it
   * @return - A browser tab instance, with all the actions
   */
  async init () {
    if (this.options.launchChrome) {
      // Launch a new Chrome instance and update the instance port
      this.chromeInstance = await _launchChrome({
        headless: this.options.headless,
        port: this.options.chrome.port
      })
      this.port = this.chromeInstance.port
    }

    await _attachCdpToChrome.call(this, this.host, this.port, this.options.chrome.remote)
  }

  /**
   * Tells if the browser instance is initializated
   */
  isInitialized () {
    return !!this.client
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
   * Closes the browser target/tab
   * @param {boolean} exit Indicates if chromeInstance must be killed with SIGHUP
   */
  async close (killChromeInstance = false) {
    debug(`:: close => Closing the browser target/tab.`)
    try {
      this.client.close()
      killChromeInstance && await this.chromeInstance.kill('SIGHUP')
      debug(`:: close => Browser target/tab closed correctly!`)
    } catch (err) {
      throw err
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

/**
 * Launches a debugging instance of Chrome on port 9222.
 * @param {boolean=} headless True (default) to launch Chrome in headless mode.
 *     Set to false to launch Chrome normally.
 * @return {object} - Chrome instance data
 *    @property {number} pid - The Process ID used by the Chrome instance
 *    @property {number} port - The port used by the Chrome instance
 *    @property {async fn} kill - Fn to kill the Chrome instance
 */
async function _launchChrome ({ headless = true, port = 0 }) {
  debug(`Launching Chrome instance. Headless: ${headless === true ? 'YES' : 'NO'}`)

  const chromeOptions = {
    port: port,
    autoSelectChrome: true, // False to manually select which Chrome install.
    additionalFlags: ['--disable-gpu', headless ? '--headless' : '']
  }

  const instance = await chromeInstance.launch(chromeOptions)
  if (!instance) {
    throw new Error(`Can't not launch Chrome!`)
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

  const { Network, Page, DOM, CSS } = this.client = await new CDP({
    host: host,
    port: port,
    remote: remote
  })

  debug('CDP prepared! Setting up browser abrstraction...')

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
