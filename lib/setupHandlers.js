'use strict'

const debug = require('debug')('HeadlessChrome:handlers')

module.exports = function setupHandlers () {
  debug(`Setting up handlers...`)
  const Network = this.client.Network
  const Page = this.client.Page

  Network.requestWillBeSent((params) => {
    // debug(`:: requestWillBeSent: `, params)
  })

  Page.loadEventFired((...params) => {
    // console.log('======== loadEventFired ========\r\n', ...params);
    // console.log('======== loadEventFired ========');
    // Page.addScriptToEvaluateOnLoad
    this.emit('pageLoaded', ...params)
  })

  Page.domContentEventFired(() => {
    // console.log('======== domContentEventFired ========', data);
    // console.log('======== domContentEventFired ========');
  })

  Page.frameNavigated(() => {
    // console.log('======== frameNavigated  ========');
  })

  Page.frameStartedLoading(() => {
    // console.log('======== frameStartedLoading  ========');
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
