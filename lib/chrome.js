'use strict'

const debug = require('debug')('HeadlessChrome:chrome')

const chromeLauncher = require('chrome-launcher')
const CDP = require('chrome-remote-interface')
const { sleep } = require('./util')

/**
 * Launches a debugging instance of Chrome on port 9222.
 * @param {boolean=} headless True (default) to launch Chrome in headless mode.
 *     Set to false to launch Chrome normally.
 * @param {{ port: number,
 *    handleSIGINT: boolean,
 *    userDataDir: string,
 *    chromeFlags: Array,
 *    launchAttempts: number,
 *    disableGPU: boolean,
 *    noSandbox: boolean
 *  }} options
 * @return {object} - Chrome instance data
 *    @property {number} pid - The Process ID used by the Chrome instance
 *    @property {number} port - The port used by the Chrome instance
 *    @property {string} userDataDir - The userDataDir used by the Chrome instance
 *    @property {async fn} kill - Fn to kill the Chrome instance
 */
module.exports.launch = async function (headless, options = {}) {
  debug(`Launching Chrome instance. Headless: ${headless === true ? 'YES' : 'NO'}`)

  const chromeOptions = {
    port: options.port,
    handleSIGINT: options.handleSIGINT,
    userDataDir: options.userDataDir,
    chromeFlags: options.flags
  }

  if (headless) { chromeOptions.chromeFlags.push('--headless') }
  if (options.disableGPU) { chromeOptions.chromeFlags.push('--disable-gpu') }
  if (options.noSandbox) { chromeOptions.chromeFlags.push('--no-sandbox') }

  let attempt = 0
  let instance

  const launchAttempts = options.launchAttempts

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
 * @return {object} - CDP Client object
 */
module.exports.attachCdpToBrowser = async function (host = 'localhost', port = 9222, remote = false) {
  debug(`Preparing Chrome Debugging Protocol (CDP) for host "${host}" and port "${port}"...`)
  try {
    let client
    // if (process.platform === 'win32') {
    client = await CDP({ host, port, remote })
    // } else {
    //   client = await CDP({ target: `ws://${host}:${port}/devtools/browser` })
    // }

    /**
     * Enable Domains "Network", "Page", "DOM" and "CSS" in the client
     */
    await Promise.all([
      client.Network.enable(),
      client.Page.enable(),
      client.DOM.enable(),
      client.CSS.enable()
    ])

    debug('CDP prepared for browser')
    return client
  } catch (err) {
    debug(`Couldnt connect CDP to browser`)
    throw err
  }
}

/**
 * Attach the Chrome Debugging Protocol to a target in given host:port + targetId combination
 * Attaching CDP allows the use of a wide browser's methods.
 * @See https://chromedevtools.github.io/devtools-protocol/ for more info
 * @param {string} host - The host of the Chrome instance
 * @param {number} port - The port number of the Chrome instance
 * @param {string} targetId - The targetId to be attached
 * @return {object} - CDP client object
 */
module.exports.attachCdpToTarget = async function (host, port, targetId) {
  debug(`Preparing Chrome Debugging Protocol (CDP) for Tab "${targetId}"...`)
  try {
    const client = await CDP({ target: targetId, host, port })
    /**
     * Enable Domains "Network", "Page", "DOM" and "CSS" in the client
     */
    await Promise.all([
      client.Network.enable(),
      client.Page.enable(),
      client.DOM.enable(),
      client.CSS.enable()
    ])

    debug(`CDP prepared for tab "${targetId}"!`)

    return client
  } catch (err) {
    debug(`Couldnt connect CDP to tab "${targetId}"`)
    throw err
  }
}
