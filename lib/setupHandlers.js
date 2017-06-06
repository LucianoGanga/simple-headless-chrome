'use strict'

const debug = require('debug')('HeadlessChrome:handlers')

module.exports = async function setupHandlers () {
  debug(`Setting up handlers...`)
  const Network = this.client.Network
  const Page = this.client.Page

  /**
   * Prepare the browser console events, if needed
   */
  if (typeof this.options.browserLog === 'function') {
    debug(`-- Browser Log status: ON! Log Entries will be received in the passed custom fn: ${this.options.browserLog}`)
    await this.client.browserLog.enable()
    this.client.Log.entryAdded(entry => this.options.browserLog(entry.entry))
  } else if (this.options.browserLog === true) {
    debug(`-- Browser Log status: ON`)
    await this.client.Log.enable()
    this.client.Log.entryAdded(_browserLog)
  } else {
    debug(`-- Browser Log status: OFF`)
  }

  Network.requestWillBeSent((...params) => {
    debug(`-- Network.requestWillBeSent: `, ...params)
    this.emit('requestWillBeSent', ...params)
  })

  Page.loadEventFired((...params) => {
    debug('-- Page.loadEventFired \r\n', ...params)
    // Page.addScriptToEvaluateOnLoad
    this.emit('pageLoaded', ...params)
  })

  Page.domContentEventFired((...params) => {
    debug('-- Page.domContentEventFired \r\n', ...params)
    this.emit('domContentEventFired', ...params)
  })

  Page.frameAttached((...params) => {
    debug('-- Page.frameAttached: ', ...params)
    this.emit('frameAttached', ...params)
  })

  Page.frameNavigated((...params) => {
    debug('-- Page.frameNavigated: ', ...params)
    this.emit('frameNavigated', ...params)
  })

  Page.frameStartedLoading((...params) => {
    debug('-- Page.frameStartedLoading', ...params)
    this.emit('frameStartedLoading', ...params)
  })

  /**
   * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) is about to open.
   * @param {string} message - Message that will be displayed by the dialog.
   * @param {string} type - Dialog type (Allowed values: alert, confirm, prompt, beforeunload)
   */
  Page.javascriptDialogOpening((...params) => {
    debug('-- Page.javascriptDialogOpening', ...params)
    this.emit('dialogOpening', ...params)
  })

  /**
   * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) has been closed.
   * @return {boolean} result - Whether dialog was confirmed.
   */
  Page.javascriptDialogClosed((...params) => {
    debug('-- Page.javascriptDialogClosed', ...params)
    this.emit('dialogClosed', ...params)
  })

  this.client.DOM.documentUpdated((...params) => {
    debug('-- DOM.documentUpdated', ...params)
    this.emit('documentUpdated', ...params)
  })
}

// exports.on = function (eventType, callback) {
//   var self = this
// return this.ready.then(function () {
//   switch (eventType) {
//  /**
//   * Horseman events
//   */
//   case 'timeout':
//     self.page.onTimeout = callback
//     break
//   case 'tabCreated':
//     self.onTabCreated = callback
//     break
//   case 'tabClosed':
//     self.onTabClosed = callback
//     break

//    /**
//     * PhantomJS events
//     */
//    // Callback horseman needs to mess with
//   case 'resourceTimeout':
//     self.page.onResouceTimeout = function (request) {
//   callback.apply(this, arguments)
//    // A resourceTimeout is a timeout
//   setTimeout(function () {
//   self.page.onTimeout('resourceTimneout', request)
// }, 0)
// }
//     break
//   case 'urlChanged':
//     self.page.onUrlChanged = function (targetUrl) {
//   self.targetUrl = targetUrl
//   return callback.apply(this, arguments)
// }
//     break
//   case 'resourceReceived':
//     self.page.onResourceReceived = function (response) {
//   self.responses[response.url] = response.status
//   return callback.apply(this, arguments)
// }
//     break
//   case 'pageCreated':
//     self.page.onPageCreated2 = callback
//     break
//   case 'loadFinished':
//     self.page.onLoadFinished2 = callback
//     break
//    // Others
//   default:
//     var pageEvent = 'on' +
//    eventType.charAt(0).toUpperCase() + eventType.slice(1)
//     self.page[pageEvent] = callback
// }

//   debug('.on() ' + eventType + ' set.')
// })
// }

function _browserLog (d) {
  switch (d.entry.level) {
    case 'verbose':
      console.log(`Browser says: [${d.entry.source}] ${d.entry.text}`, d.entry)
      break
    case 'info':
      console.info(`Browser says: [${d.entry.source}] ${d.entry.text}`, d.entry)
      break
    case 'warning':
      console.warn(`Browser says: [${d.entry.source}] ${d.entry.text}`, d.entry)
      break
    case 'error':
      console.error(`Browser says: [${d.entry.source}] ${d.entry.text}`, d.entry)
      break
  }
}
