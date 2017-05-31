'use strict'

/**
 * Checks if the browser is initialized. Exits the process if it's not
 */
exports.browserIsInitialized = function browserIsInitialized () {
  if (!this.isInitialized()) {
    console.error('HeadlessChrome is not ready; call browser.init() before requesting other actions')
    process.exit(1)
  }
}

/**
 * As the selectors may contain colons, it's necessary to escape them in order to correctly match an element
 * @param {string} selector - The selector string
 * @return {string} - The selector with colons escaped (One backslash to escape the ':' for CSS, and other to escape the first one for JS)
 */
exports.fixSelector = function fixSelector (selector) {
  return selector.replace(/\\/g, '').replace(/:/g, '\\:')
}

/**
 * Creates some delay
 * @param {number} delay - Delay in miliseconds
 * @return {promise} - The promise that will solve after the delay
 */
const sleep = exports.sleep = function (delay) {
  return new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Runs a promise and throws an error if it's not resolved before the timeout
 * @param {promise} promise - The promise to run
 * @param {number} timeout - The timeout time, in ms
 */
exports.promiseTimeout = function (promise, timeout) {
  return Promise.race([promise, sleep(timeout).then(() => {
    const err = new Error('[Headless Chrome] Timeout after ' + timeout + ' ms')
    err.code = 'TIMEOUT'
    throw err
  })])
}

/**
 * Transforms an interleave array into a key - value object
 * @param {array} interleaveArray - The interleave array
 * @return {object} - The key value object
 */
exports.interleaveArrayToObject = function (interleaveArray) {
  let attributes = {}
  for (let i = 0; i < interleaveArray.length; i++) {
    let key = interleaveArray[i]
    let value = interleaveArray[++i]
    attributes[key] = value
  }
  return attributes
}

/**
 * Given an object, transforms it's properties to a URL encoded string
 * @param {object} object - The object to transform
 * @return {string} - The URL Enconded object
 */
exports.objectToEncodedUri = function (object) {
  var encodedString = ''
  for (var prop in object) {
    if (object.hasOwnProperty(prop)) {
      if (encodedString.length > 0) {
        encodedString += '&'
      }
      encodedString += encodeURI(prop + '=' + object[prop])
    }
  }
  return encodedString
}
