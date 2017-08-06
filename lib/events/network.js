'use strict'

const debug = require('debug')('HeadlessChrome:events:Network')

/**
 * Register all the Network events of the Chrome DevTools Protocol
 * URL: https://chromedevtools.github.io/devtools-protocol/tot/Network/
 */
module.exports = async function () {
  const Network = this.client.Network

  const events = [
    'resourceChangedPriority',
    'requestWillBeSent',
    'requestServedFromCache',
    'responseReceived',
    'dataReceived',
    'loadingFinished',
    'loadingFailed',
    'webSocketWillSendHandshakeRequest',
    'webSocketHandshakeResponseReceived',
    'webSocketCreated',
    'webSocketClosed',
    'webSocketFrameReceived',
    'webSocketFrameError',
    'webSocketFrameSent',
    'eventSourceMessageReceived',
    'requestIntercepted'
  ]

  for (let eventName of events) {
    Network[eventName]((...params) => {
      debug(`-- Network.${eventName}: `, ...params)
      this.emit(`Network.${eventName}`, ...params)
    })
  }
}
