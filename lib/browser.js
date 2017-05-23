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
  chrome: {
    host: 'localhost',
    port: 0, // Chrome instance port (defaults to 0 to generate a random port)
    remote: false
  },
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

  /**
   * Initializates a new Chrome instance and controls it
   */
  async init () {
    // Launch a new Chrome instance
    this.chromeInstance = await _launchChrome({
      headless: this.options.headless,
      port: this.options.chrome.port
    })

    /**
     * Attach the Chrome Debugging Protocol
     * This attaches the CDP to the Port used by the created Chrome instance
     * @See https://chromedevtools.github.io/devtools-protocol/ for more info
     */
    await _attachCdpToChrome.call(this, this.options.chrome.host, this.chromeInstance.port, this.options.chrome.remote)

    return this
  }

  /**
   * Controls a remote instance
   */
  async debugRemoteChromeInstance (host = 'localhost', port = 9222, remote = false) {
    /**
     * Attach the Chrome Debugging Protocol
     * This attaches the CDP to the Port used by the created Chrome instance
     * @See https://chromedevtools.github.io/devtools-protocol/ for more info
     */
    await _attachCdpToChrome.call(this, this.options.chrome.host, this.options.chrome.port, this.options.chrome.remote)
  }

  /**
   * Tells if the browser instance is initializated
   */
  isInitialized () {
    return !!this.client
  }

  /**
   * Closes the browser instance
   * @param {boolean} exit Indicates if chromeInstance must be killed with SIGHUP
   */
  async close (exit = false) {
    debug('Closing browser client...')
    try {
      this.client.close()
      exit && await this.chromeInstance.kill('SIGHUP')
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
 * Attaches to the Chrome Debugging Protocol (CDP) of a given host:port combination
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

  this.client.on('error', (err) => {
    // cannot connect to the remote endpoint
    console.log('hola hola hola, que tal?')
    throw err
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

  return this.client
}
