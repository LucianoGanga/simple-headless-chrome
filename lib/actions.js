/* global XMLHttpRequest */
'use strict'

const debug = require('debug')('HeadlessChrome:actions')

const Promise = require('bluebird')
const fs = require('mz/fs')
const _ = require('lodash')

const {
  browserIsInitialized,
  sleep,
  fixSelector,
  interleaveArrayToObject,
  promiseTimeout,
  objectToEncodedUri
} = require('./util')

/**
 * Injects JavaScript in the page
 *
 * Modules available: jQuery, jquery, jQuery.slim and jquery.slim
 * @example inject('jquery')
 *
 * You can use jsdelivr to inject any npm or github package in the page
 * @example inject('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js')
 * @example inject('https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js')
 *
 * You can inject a local Javascript file
 * @example inject('./custom-file.js')
 * @example inject(__dirname + '/path/to/file.js')
 *
 * Note: the path will be resolved with `require.resolve()` so you can include
 * files that are in `node_modules` simply by installing them with NPM
 * @example inject('jquery/dist/jquery.min')
 * @example inject('lodash/dist/lodash.min')
 *
 * @param {string} moduleOrScript - Javascript code, file, url or name of the
 * module to inject.
 */
exports.inject = async function inject (moduleOrScript) {
  debug(`:: inject => Inject "${moduleOrScript}" on the root document...`)
  browserIsInitialized.call(this)

  if (moduleOrScript.slice(0, 8) === 'https://' || moduleOrScript.slice(0, 7) === 'http://') {
    return this.injectRemoteScript(moduleOrScript)
  } else {
    switch (moduleOrScript) {
      // TODO: Inject modules from local file
      case 'jquery':
      case 'jQuery':
        return this.evaluateAsync(function () {
          return new Promise((resolve, reject) => {
            if (typeof window.jQuery === 'undefined') {
              const script = document.createElement('script')
              script.src = 'https://code.jquery.com/jquery-3.2.1.min.js'
              script.onload = resolve
              script.onerror = reject
              document.head.appendChild(script)
            } else {
              resolve()
            }
          })
        })

      case 'jquery.slim':
      case 'jQuery.slim':
        return this.evaluateAsync(function () {
          return new Promise((resolve, reject) => {
            if (typeof window.jQuery === 'undefined') {
              const script = document.createElement('script')
              script.src = 'https://code.jquery.com/jquery-3.2.1.slim.min.js'
              script.onload = resolve
              script.onerror = reject
              document.head.appendChild(script)
            } else {
              resolve()
            }
          })
        })

      default:
        const file = require.resolve(moduleOrScript)
        const buff = await fs.readFile(file)
        return this.injectScript(buff.toString())
    }
  }
}

/**
 * Injects a remote script in the page
 * @example injectRemoteScript(https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js)
 * @param {string} src - Url to remote JavaScript file
 */
exports.injectRemoteScript = async function injectRemoteScript (src) {
  debug(`:: injectRemoteScript => Inject "${src}" on the root document...`)
  browserIsInitialized.call(this)
  const result = await this.evaluateAsync(function (src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }, src)
  debug(`:: injectRemoteScript => script "${src}" was injected successfully!`)

  return result
}

/**
 * Injects code in the DOM as script tag
 * @param {string} script - Code to be injected and evaluated in the DOM
 */
exports.injectScript = async function injectScript (script) {
  debug(`:: injectScript => Injecting "${script.slice(0, 10)}..." on the root document...`)
  browserIsInitialized.call(this)
  const result = await this.evaluate(function (text) {
    const script = document.createElement('script')
    script.text = text
    document.head.appendChild(script)
  }, script)
  debug(`:: injectScript => script "${script.slice(0, 10)}..." was injected successfully!`)

  return result
}

/**
 * Evaluates a fn in the context of the browser
 * @param fn {function} - The function to evaluate in the browser
 * @param args {*} - The arguments to pass to the function
 */
exports.evaluate = async function evaluate (fn, ...args) {
  debug(`:: evaluate => ${fn}`, ...args)
  browserIsInitialized.call(this)
  const exp = args && args.length > 0 ? `(${String(fn)}).apply(null, ${JSON.stringify(args)})` : `(${String(fn)}).apply(null)`
  const result = await this.client.Runtime.evaluate({
    expression: exp,
    returnByValue: true
  })
  debug(`:: evaluate => Function ${fn} evaluated successfully!`, result)

  return result
}

/**
 * Evaluates an async fn in the context of the browser
 * @param fn {function} - The function to evaluate in the browser
 * @param args {*} - The arguments to pass to the function
 */
exports.evaluateAsync = async function evaluate (fn, ...args) {
  debug(`:: evaluate => ${fn}`, ...args)
  browserIsInitialized.call(this)
  const exp = args && args.length > 0 ? `(${String(fn)}).apply(null, ${JSON.stringify(args)})` : `(${String(fn)}).apply(null)`
  return this.client.Runtime.evaluate({
    expression: exp,
    returnByValue: true,
    awaitPromise: true
  })
}

/**
 * Evaluates a fn in the context of a passed node
 * @param {NodeObject} node - The Node Object used to get the context
 * @param fn {function} - The function to evaluate in the browser
 * @param args {*} - The arguments to pass to the function
 */
exports.evaluateOnNode = async function evaluateOnNode (node, fn, ...args) {
  debug(`:: evaluateOnNode => Evaluate on node "${node.nodeId}", fn: ${fn}`, ...args)
  browserIsInitialized.call(this)
  const exp = args && args.length > 0 ? `function() {(${String(fn)}).apply(null, ${JSON.stringify(args)})}` : `function() {(${String(fn)}).apply(null)}`

  const resolvedNode = await this.client.DOM.resolveNode(node)

  return this.client.Runtime.callFunctionOn({
    objectId: resolvedNode.object.objectId,
    functionDeclaration: exp
  })
}

/**
 * Navigates to a URL
 * @param {string} url - The URL to navigate to
 * @param {object} options - The options object.
 * options:
 *    @property {number} timeout - Time in ms that this method has to wait until the
 * "pageLoaded" event is triggered. If the value is 0 or false, it means that it doesn't
 * have to wait after calling the "Page.navigate" method
 */
exports.goTo = async function (url, opt = {}) {
  debug(`:: goTo => URL "${url}" | Options: ${JSON.stringify(opt, null, 2)}`)
  browserIsInitialized.call(this)

  const options = Object.assign({
    timeout: this.options.browser.loadPageTimeout
  }, opt)

  if (options.bypassCertificate) {
    this.client.Security.certificateError(({eventId}) => {
      this.client.Security.handleCertificateError({
        eventId,
        action: 'continue'
      })
    })

    this.client.Security.setOverrideCertificateErrors({override: true})
  }

  await this.client.Page.navigate({ url })

  if (options.timeout && typeof options.timeout) {
    await this.waitForPageToLoad(options.timeout)
  }
  debug(`:: goTo => URL "${url}" navigated!`)
}

/**
 * Get the value of an Node.
 * @param {NodeObject} node - The Node Object
 * @return {object} - Object containing type and value of the element
 */
exports.getNodeValue = async function (node) {
  debug(`:: getNodeValue => Get value from Node "${node.nodeId}"`)
  browserIsInitialized.call(this)

  const nodeAttrs = interleaveArrayToObject((await this.client.DOM.getAttributes(node)).attributes)
  const value = nodeAttrs.value
  debug(`:: getNodeValue => Value from Node "${node.nodeId}":`, value)
  return value
}

/**
 * Get the value of an element.
 * @param {string} selector - The target selector
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {object} - Object containing type and value of the element
 */
exports.getValue = async function (selector, frameId) {
  debug(`:: getValue => Get value from element matching "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const node = await this.querySelector(selector, frameId)
  const { className: htmlObjectType } = (await this.client.DOM.resolveNode(node)).object

  let value
  // If the node object type is HTMLTextAreaElement, then get the value from the console.
  /**
   * TODO: Take the value from the DOM Node. For some reason, there're some pages where is not possible
   * to get the textarea value, as its nodeId refreshes all the time
   */
  if (htmlObjectType === 'HTMLTextAreaElement') {
    // Escape selector for onConsole use
    selector = selector.replace(/\\/g, '\\')
    const textareaEvaluate = await this.evaluate(function (selector) {
      return document.querySelector(selector).value
    }, selector)
    value = textareaEvaluate.result.value
  } else {
    value = await this.getNodeValue(node)
  }
  debug(`:: getValue => Value from element matching "${selector}":`, value)
  return value
}

/**
 * Set the value of an element.
 * @param {NodeObject} node - The Node Object
 * @param {string} value - The value to set the node to (it may be an array of values when the node is a multiple "HTMLSelectElement")
 */
exports.setNodeValue = async function (node, value) {
  debug(`:: setNodeValue => Set node value "${value}" to node "${node.nodeId}"`)
  browserIsInitialized.call(this)

  const { className: htmlObjectType } = (await this.client.DOM.resolveNode(node)).object

  if (htmlObjectType === 'HTMLSelectElement') {
    const selectOptions = await this.client.DOM.querySelectorAll({
      nodeId: node.nodeId,
      selector: 'option'
    })

    // Ensure the selectedValuesArray is an array
    let selectedValuesArray = value
    if (!Array.isArray(value)) {
      selectedValuesArray = [value]
    }

    // Iterate over all the options of the select
    for (let option of selectOptions.nodeIds) {
      const optionValue = await this.getNodeValue({nodeId: option})
      if (selectedValuesArray.indexOf(optionValue) > -1) {
        // If the option value is in the list of selectedValues, then set the "selected" property
        await this.client.DOM.setAttributeValue({
          nodeId: option,
          name: 'selected',
          value: 'true'
        })
      } else {
        // Otherwise, remove the "selected" property
        await this.client.DOM.removeAttribute({
          nodeId: option,
          name: 'selected'
        })
      }
    }
  } else {
    await this.client.DOM.setAttributeValue({
      nodeId: node.nodeId,
      name: 'value',
      value: value
    })
  }
}

/**
 * Set the value of an element.
 * @param {string} selector - The selector to set the value of.
 * @param {string} [value] - The value to set the selector to
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.setValue = async function (selector, value, frameId) {
  debug(`:: setValue => Set value "${value}" to element matching selector "${selector}" in frame "${frameId || 'root'}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const node = await this.querySelector(selector, frameId)
  const { className: htmlObjectType } = (await this.client.DOM.resolveNode(node)).object

  // If the node object type is HTMLTextAreaElement, then get the value from the console.
  /**
   * TODO: Take the value from the DOM Node. For some reason, there're some pages where is not possible
   * to get the textarea value, as its nodeId refreshes all the time
   */
  if (htmlObjectType === 'HTMLTextAreaElement') {
    // Escape selector for onConsole use
    selector = selector.replace(/\\/g, '\\')
    await this.evaluate(function (selector, value) {
      document.querySelector(selector).value = value
    }, selector, value)
  } else {
    await this.setNodeValue(node, value)
  }
}

/**
 * Fills a selector of an input or textarea element with the passed value
 * @param {string} selector  - The selector
 * @param {string} value - The value to fill the element matched in the selector
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.fill = async function (selector, value, frameId) {
  debug(`:: fill => Fill selector "${selector}" with value "${value}" in frame "${frameId || 'root'}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const node = await this.querySelector(selector, frameId)

  const nodeAttrs = interleaveArrayToObject((await this.client.DOM.getAttributes(node)).attributes)
  const { className: htmlObjectType } = (await this.client.DOM.resolveNode(node)).object

  const type = nodeAttrs.type
  const supportedTypes = ['color', 'date', 'datetime', 'datetime-local', 'email', 'hidden', 'month', 'number', 'password', 'range', 'search', 'tel', 'text', 'time', 'url', 'week']
  // Check https://developer.mozilla.org/en-US/docs/Web/API for more info about HTML Objects
  const isValidInput = htmlObjectType === 'HTMLInputElement' && (typeof type === 'undefined' || supportedTypes.indexOf(type) !== -1)
  const isTextArea = htmlObjectType === 'HTMLTextAreaElement'

  if (isTextArea || isValidInput) {
    await this.setNodeValue(node, value)
  } else {
    throw new Error(`DOM element ${selector} can not be filled`)
  }
}

/**
 * Clear an input field.
 * @param {string} selector - The selector to clear.
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.clear = async function (selector, frameId) {
  debug(`:: clear => Clear the field of the selector "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)
  const node = await this.querySelector(selector, frameId)
  await this.setNodeValue(node, '')
}

/**
 * Returns the node associated to the passed selector
 * @param {string} selector - The selector to find
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {NodeId Object} - NodeId Object (+info: https://chromedevtools.github.io/devtools-protocol/tot/DOM/#type-NodeId)
 */
exports.querySelector = async function (selector, frameId) {
  debug(`:: querySelector => Get element from selector "${selector}" in frame "${frameId || 'root'}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const DOM = this.client.DOM

  try {
    const document = (frameId) ? await DOM.getFlattenedDocument() : await DOM.getDocument()
    let node = (frameId) ? _.find(document.nodes, { frameId: frameId }) : document.root

    // If the node is an iFrame, the #document node is in the contentDocument attribute of the node
    if (node.nodeName === 'IFRAME' && node.contentDocument) {
      node = node.contentDocument
    }

    return await DOM.querySelector({
      nodeId: node.nodeId,
      selector
    })
  } catch (err) {
    err.name = `Can not query selector ${selector} in frame "${frameId || 'root'}": ${err.name}`
    throw err
  }
}

/**
 * Focus on an element matching the selector
 * @param {string} selector - The selector to find the element
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.focus = async function (selector, frameId) {
  debug(`:: focus => Focusing on selector "${selector}" in frame "${frameId || 'root'}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  try {
    const node = await this.querySelector(selector, frameId)
    await this.client.DOM.focus({ nodeId: node.nodeId })
  } catch (err) {
    throw new Error(`Can not focus to ${selector}. Error: ${err}`)
  }
}

/**
 * Simulate a keypress on a selector
 * @param {string} selector - The selector to type into.
 * @param {string} text - The text to type.
 * @param {string} frameId - The FrameID where the selector should be searched
 * @param {object} options - Lets you send keys like control & shift
 */
exports.type = async function (selector, text, frameId, opts) {
  const options = Object.assign({
    reset: false, // Clear the field first
    eventType: 'char' // Enum: [ 'keyDown', 'keyUp', 'rawKeyDown', 'char' ]
  }, opts)

  debug(`:: type => Type text "${text}" in selector "${selector}" | Options: ${JSON.stringify(options, null, 2)}`)
  selector = fixSelector(selector)
  function computeModifier (modifierString) {
    const modifiers = {
      'ctrl': 0x04000000,
      'shift': 0x02000000,
      'alt': 0x08000000,
      'meta': 0x10000000,
      'keypad': 0x20000000
    }
    let modifier = 0
    const checkKey = function (key) {
      if (key in modifiers) {
        return
      }
      debug(key + 'is not a supported key modifier')
    }
    if (!modifierString) {
      return modifier
    }

    const keys = modifierString.split('+')
    keys.forEach(checkKey)
    return keys.reduce(function (acc, key) {
      return acc | modifiers[key]
    }, modifier)
  }

  const modifiers = computeModifier(options && options.modifiers)

  // Clear the field in the selector, if needed
  if (options.reset) {
    await this.clear(selector, frameId)
  }

  // Focus on the selector
  await this.focus(selector, frameId)

  function isSpecialChar (key) {
    if (key === '\r') {
      return true
    }
  }

  // Type on the selector
  for (let key of text.split('')) {
    if (isSpecialChar(key)) {
      await this.keyboardEvent('rawKeyDown', '', modifiers, 13)
      await this.keyboardEvent(options.eventType, '\r', modifiers)
      await this.keyboardEvent('keyUp', '', modifiers, 13)
    } else {
      await this.keyboardEvent(options.eventType, key, modifiers)
    }
  }
}
/**
 * Types text (doesn't matter where it is)
 * @param {string} text - The text to type.
 * @param {object} options - Lets you send keys like control & shift
 */
exports.typeText = async function (text, opts) {
  const options = Object.assign({
    reset: false, // Clear the field first
    eventType: 'char' // Enum: [ 'keyDown', 'keyUp', 'rawKeyDown', 'char' ]
  }, opts)

  debug(`:: typeText => Type text "${text}" | Options: ${JSON.stringify(options, null, 2)}`)
  function computeModifier (modifierString) {
    const modifiers = {
      'ctrl': 0x04000000,
      'shift': 0x02000000,
      'alt': 0x08000000,
      'meta': 0x10000000,
      'keypad': 0x20000000
    }
    let modifier = 0
    const checkKey = function (key) {
      if (key in modifiers) {
        return
      }
      debug(key + 'is not a supported key modifier')
    }
    if (!modifierString) {
      return modifier
    }

    const keys = modifierString.split('+')
    keys.forEach(checkKey)
    return keys.reduce(function (acc, key) {
      return acc | modifiers[key]
    }, modifier)
  }

  const modifiers = computeModifier(options && options.modifiers)

  function isSpecialChar (key) {
    if (key === '\r') {
      return true
    }
  }

  // Type on the selector
  for (let key of text.split('')) {
    if (isSpecialChar(key)) {
      await this.keyboardEvent('rawKeyDown', '', modifiers, 13)
      await this.keyboardEvent(options.eventType, '\r', modifiers)
      await this.keyboardEvent('keyUp', '', modifiers, 13)
    } else {
      await this.keyboardEvent(options.eventType, key, modifiers)
    }
  }
}

/**
 * Select a value in an html select element.
 * @param {string} selector - The identifier for the select element.
 * @param {string} value - The value to select.
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.select = async function (selector, value, frameId) {
  debug(`:: select => ${(typeof value !== 'undefined') ? 'Set select value to "' + value + '"' : 'Get select value'} in the select matching selector "${selector}" for frame "${frameId || 'root'}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const node = await this.querySelector(selector, frameId)

  if (typeof value !== 'undefined') {
    return this.setNodeValue(node, value)
  } else {
    return this.getNodeValue(node)
  }
}

/**
 * Fire a key event.
 * @param {string} [type=keypress] - The type of key event.
 * @param {string} [key=null] - The key to use for the event.
 * @param {number} [modifier=0] - The keyboard modifier to use.
 * @see {@link https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchKeyEvent}
 */
exports.keyboardEvent = async function (type, key, modifier, windowsVirtualKeyCode = 0) {
  debug(`:: keyboardEvent => Event type "${type}" | Key "${key}" | Modifier: "${modifier}"`)
  browserIsInitialized.call(this)

  type = (typeof type === 'undefined') ? 'char' : type
  key = (typeof key === 'undefined') ? null : key
  modifier = modifier || 0

  const parameters = {
    type: type,
    modifiers: modifier,
    text: key
  }
  if (windowsVirtualKeyCode) {
    parameters.windowsVirtualKeyCode = windowsVirtualKeyCode
    parameters.nativeVirtualKeyCode = windowsVirtualKeyCode
  }
  await this.client.Input.dispatchKeyEvent(parameters)
}

/**
 * Waits certain amount of ms
 * @param {number} time - Ammount of ms to wait
 */
exports.wait = async function (time) {
  debug(`:: wait => Waiting ${time} ms...`)
  browserIsInitialized.call(this)

  return sleep(time)
}

/**
 * Binding callback to handle console messages
 *
 * @param listener is a callback for handling console message
 *
 */
exports.onConsole = async function (listener) {
  debug(`:: onConsole => Binding new listener to console`)
  browserIsInitialized.call(this)

  this.on('onConsoleMessage', listener)
}

/**
 * Waits for a page to finish loading. Throws error after timeout
 * @param {number} timeout - The timeout in ms. (Default: "loadPageTimeout" property in the browser instance options)
 */
exports.waitForPageToLoad = async function (timeout) {
  debug(`:: waitForPageToLoad => Waiting page load...`)
  browserIsInitialized.call(this)

  return promiseTimeout(new Promise((resolve, reject) => {
    const listener = () => {
      debug(`:: waitForPageToLoad => Page loaded!`)
      this.removeListener('pageLoaded', listener)
      resolve(true)
    }
    this.on('pageLoaded', listener)
  }), timeout || this.options.browser.loadPageTimeout)
}

/**
 * Waits for all the frames in the page to finish loading. Returns the list of frames after that
 * @param {regexp|string} url - The URL that must be waited for load
 * @return {object} - List of frames, with childFrames
 */
exports.waitForFrameToLoad = async function (url, timeout) {
  if (!url) {
    throw new Error(`"url" parameter must be passed `)
  }
  debug(`:: waitForFramesToLoad => Waiting page frame ${url} load...`)
  browserIsInitialized.call(this)

  const frames = await this.getFrames()
  let frame = _.find(frames, function (f) {
    if ((typeof url === 'string' && f.url === url) || (typeof url !== 'string' && f.url.match(url))) {
      return f
    }
  })

  if (!frame) {
    frame = await promiseTimeout(new Promise((resolve, reject) => {
      const listener = (data) => {
        debug(`:: waitForPageToLoad => Page loaded!`)
        this.removeListener('frameNavigated', listener)
        if ((typeof url === 'string' && data.frame.url === url) || (typeof url !== 'string' && data.frame.url.match(url))) {
          resolve(data.frame)
        }
      }
      this.on('frameNavigated', listener)
    }), timeout || this.options.browser.loadPageTimeout)
  }

  return frame
}

/**
 * Waits for a selector to finish loading. Throws error after timeout
 * @param {string} selector - The identifier for the select element.
 * @param {number} interval - The interval in ms. (Default: "loadPageTimeout" property in the browser instance options)
 * @param {number} timeout - The timeout in ms. (Default: "loadPageTimeout" property in the browser instance options)
 */
exports.waitForSelectorToLoad = async function (selector, interval, timeout) {
  debug(`:: waitForSelectorToLoad => Waiting selector "${selector}" load...`)
  browserIsInitialized.call(this)

  const startDate = (new Date()).getTime()
  while (true) {
    const exists = await this.exist(selector)

    if (exists === true) {
      debug(`:: waitForSelectorToLoad => Selector "${selector}" loaded!`)
      return
    }

    debug(`:: waitForSelectorToLoad => Selector "${selector}" hasn't loaded yet. Waiting ${interval || this.options.browser.loadSelectorInterval}ms...`)
    await sleep(interval || this.options.browser.loadSelectorInterval)

    const diff = ((new Date()).getTime()) - startDate
    if (diff > (timeout || this.options.browser.loadSelectorTimeout)) {
      debug(`:: waitForSelectorToLoad => Timeout while trying to wait for selector "${selector}".`)
      throw new Error(`Timeout while trying to wait for selector "${selector}"`)
    }
  }
}

/**
 * Fire a mouse event.
 * @param {string} [type=mousePressed] - Type of the mouse event. Allowed values: mousePressed, mouseReleased, mouseMoved.
 * @param {number} [x=0] - X coordinate of the event relative to the main frame's viewport.
 * @param {number} [y=0] - Y coordinate of the event relative to the main frame's viewport. 0 refers to the top of the viewport and Y increases as it proceeds towards the bottom of the viewport.
 * @param {number} [modifier=0] - Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0).
 * @param {string} [button=left] - Mouse button (default: "none"). Allowed values: none, left, middle, right.
 * @see {@link https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchMouseEvent}
 */
exports.mouseEvent = async function ({ type = 'mousePressed', x = 0, y = 0, modifiers = 0, button = 'left', clickCount = 1 }) {
  debug(`:: mouseEvent => Type "${type}" | (${x}; ${y}) | Modifiers: "${modifiers}" | Button: ${button}`)
  browserIsInitialized.call(this)

  await this.client.Input.dispatchMouseEvent({ type, x, y, button, modifiers, clickCount })
}

/**
 * Click on a selector by firing a 'click event' directly in the element of the selector
 * @param {string} selector - Selector of the element to click
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.click = async function (selector, frameId) {
  debug(`:: click => Click event on selector "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const node = await this.querySelector(selector, frameId)
  await this.evaluateOnNode(node, function clickElement (selector) {
    document.querySelector(selector).click()
  }, selector)
}

/**
 * Clicks left button hover the centroid of the element matching the passed selector
 * @param {string} [selector]
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.clickOnSelector = async function (selector, frameId) {
  debug(`:: clickOnSelector => Mouse click in centroid of element with selector "${selector}" for frame "${frameId || 'root'}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const node = await this.querySelector(selector, frameId)
  const nodeCentroid = await this.getNodeCentroid(node.nodeId)
  await this.mouseEvent({
    type: 'mousePressed',
    x: nodeCentroid.x,
    y: nodeCentroid.y
  })
  await this.mouseEvent({
    type: 'mouseReleased',
    x: nodeCentroid.x,
    y: nodeCentroid.y
  })
}

/**
 * Calculates the centroid of a node by using the boxModel data of the element
 * @param {string} nodeId - The Node Id
 * @return {object} - { x, y } object with the coordinates
 */
exports.getNodeCentroid = async function (nodeId) {
  debug(`:: getNodeCentroid => Get centroid coordinates for node "${nodeId}"`)
  browserIsInitialized.call(this)
  const boxModel = await this.client.DOM.getBoxModel({ nodeId: nodeId })

  return {
    x: parseInt((boxModel.model.content[0] + boxModel.model.content[2] + boxModel.model.content[4] + boxModel.model.content[6]) / 4),
    y: parseInt((boxModel.model.content[1] + boxModel.model.content[3] + boxModel.model.content[5] + boxModel.model.content[7]) / 4)
  }
}

/**
 * Get the browser cookies
 * @return {object} - Object with all the cookies
 */
exports.getCookies = async function () {
  debug(`:: getCookies => Return the browser cookies`)
  browserIsInitialized.call(this)

  return this.client.Network.getCookies()
}

/**
 * Set the browser cookies
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {string} url - The request-URI to associate with the setting of the cookie.
 * @param {{
 *    @property {object} options - Options object
 *    @property {string} [domain] - If omitted, the cookie becomes a host-only cookie
 *    @property {string} [path] - Defaults to the path portion of the url parameter
 *    @property {boolean} [secure] - Defaults to false.
 *    @property {boolean} [httpOnly] - Defaults to false.
 *    @property {string} [sameSite] - Represents the cookie's 'SameSite' status: https://tools.ietf.org/html/draft-west-first-party-cookies
 *    @property {number} [expirationDate] - If omitted, cookie becomes a session cookie
 * }} options - additional options for setting the cookie (more info here: https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-setCookie)
 * @return {boolean} - True if successfully set cookie
 */
exports.setCookie = async function (name, value, options = {}) {
  debug(`:: setCookie => Setting browser cookie "${name}" with value "${value}". Additional options: ${options}`)
  browserIsInitialized.call(this)

  const setCookieOptions = Object.assign({ name, value }, options)

  return this.client.Network.setCookie(setCookieOptions)
}

/**
 * Clear the browser cookies
 */
exports.clearBrowserCookies = async function () {
  debug(`:: clearBrowserCookies => Clearing browser cookies`)
  browserIsInitialized.call(this)

  return this.client.Network.clearBrowserCookies()
}

/**
 * Checks if an element matches the selector
 * @param {string} selector - The selector string
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {boolean} - Boolean indicating if element of selector exists or not
 */
// TODO: make use of the "frameId" parameter in this fn, and avoid using this.evaluate()
exports.exist = async function (selector, frameId) {
  debug(`:: exist => Exist element with selector "${selector}" for frame "${frameId || 'root'}"?`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const exist = await this.evaluate(selector => !!document.querySelector(selector), selector)

  debug(`:: exist => Exist: "${exist.result.value}"`)

  return exist.result.value
}

/**
 * Checks if an element matching a selector is visible
 * @param {string} selector - The selector string
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {boolean} - Boolean indicating if element of selector is visible or not
 */
// TODO: make use of the "frameId" parameter in this fn, and avoid using this.evaluate()
exports.visible = async function (selector, frameId) {
  debug(`:: visible => Visible element with selector "${selector}" for frame "${frameId || 'root'}"?`)
  browserIsInitialized.call(this)

  const visible = this.evaluate(selector => {
    const el = document.querySelector(selector)
    let style
    try {
      style = window.getComputedStyle(el, null)
    } catch (e) {
      return false
    }
    if (style.visibility === 'hidden' || style.display === 'none') {
      return false
    }
    if (style.display === 'inline' || style.display === 'inline-block') {
      return true
    }
    return el.clientHeight > 0 && el.clientWidth > 0
  }, selector)

  debug(`:: visible => Visible: "${visible.result.value}"`)

  return visible.result.value
}

/**
 * Takes a screenshot of the page and returns it as a string
 * @param {object} captureOptions - Options object
 * Options properties:
 *    @property {string} [format] - Image compression format (defaults to png). Allowed values: jpeg, png.
 *    @property {integer} [quality] - Compression quality from range [0..100] (jpeg only).
 *    @property {ViewPort} [clip] - Capture the screenshot of a given viewport/region only (https://chromedevtools.github.io/devtools-protocol/tot/Page/#type-Viewport)
 *    @property {boolean} [fromSurface] - Capture the screenshot from the surface, rather than the view. Defaults to false. EXPERIMENTAL
 *    @property {string}  [selector] - The selector to be captured. If empty, will capture the page
 *    @property {boolean}   [fullPage] - If true, captures the full page height
 * @param {boolean} returnBinary - If true, returns as binary. Otherwise, returns a base64 string
 * @return {string} - Binary or Base64 string with the image data
 */
exports.getScreenshot = async function ({
  format = 'png',
  quality,
  clip = {
    x: 0,
    y: 0,
    width: this.options.deviceMetrics.width,
    height: this.options.deviceMetrics.height,
    scale: this.options.deviceMetrics.deviceScaleFactor
  },
  fromSurface,
  selector,
  fullPage
 }, returnBinary = false) {
  debug(`:: getScreenshot => Taking a screenshot of the ${selector ? 'selector "' + selector + '"' : 'page'}. Returning as ${returnBinary ? 'binary' : 'base64'} string`)
  browserIsInitialized.call(this)

  format = format.toLowerCase()
  if (format === 'jpg') {
    format = 'jpeg'
  }

  // Validate screenshot format
  if (format !== 'jpeg' && format !== 'png') {
    throw new Error(`Invalid format "${format}" for the screenshot. Allowed values: "jpeg" and "png".`)
  }

  const screenshotSettings = {
    format,
    quality,
    fromSurface: true
  }

  // If fullPage parameter is on, then resize the screen to full size
  if (fullPage === true) {
    screenshotSettings.clip = await this.resizeFullScreen()
  }

  // If there's no clip, setup a default clip
  if (selector) {
    screenshotSettings.clip = await this.getSelectorViewport(selector)
  }

  let screenshot = (await this.client.Page.captureScreenshot(screenshotSettings)).data

  if (returnBinary) {
    screenshot = Buffer.from(screenshot, 'base64')
  }
  debug(`:: getScreenshot => Screenshot took!`)

  return screenshot
}

/**
 * Saves a screenshot of the page
 * @param {string} fileName - Path and Name of the file (without the extension)
 * @param {object} captureOptions - Options object
 * Options properties:
 *    @property {string} format - Image compression format (defaults to png). Allowed values: jpeg, png.
 *    @property {integer} quality - Compression quality from range [0..100] (jpeg only).
 *    @property {ViewPort} clip - Capture the screenshot of a given region only (https://chromedevtools.github.io/devtools-protocol/tot/Page/#type-Viewport)
 *    @property {boolean} fromSurface - Capture the screenshot from the surface, rather than the view. Defaults to false. EXPERIMENTAL
 *    @property {string}  [selector] - The selector to be captured. If empty, will capture the page
 *    @property {boolean}   [fullPage] - If true, captures the full page height
 * @return {string} - Binary or Base64 string with the image data
 */
exports.saveScreenshot = async function (fileName = `screenshot-${Date.now()}`, { format = 'png', quality, clip, fromSurface, selector, fullPage } = {}) {
  debug(`:: saveScreenshot => Saving a screenshot of the  ${selector ? 'selector "' + selector + '"' : 'page'}...`)
  browserIsInitialized.call(this)

  format = format.toLowerCase()
  if (format === 'jpg') {
    format = 'jpeg'
  }

  // Validate screenshot format
  if (format !== 'jpeg' && format !== 'png') {
    throw new Error(`Invalid format "${format}" for the screenshot. Allowed values: "jpeg" and "png".`)
  }
  
  const screenshot = await this.getScreenshot({
    format,
    quality,
    clip,
    fromSurface,
    selector,
    fullPage
  }, true)

  await fs.writeFile(`${fileName}.${format}`, screenshot)
  debug(`:: saveScreenshot => Screenshot saved!`)
  return `${fileName}.${format}`
}

/**
 * Prints the page to PDF
 * @param {{
 *    @property {boolean} landscape - Paper orientation. Defaults to false.
 *    @property {boolean} displayHeaderFooter - Display header and footer. Defaults to false.
 *    @property {boolean} printBackground - Print background graphics. Defaults to false.
 *    @property {number} scale - Scale of the webpage rendering. Defaults to 1.
 *    @property {number} paperWidth - Paper width in inches. Defaults to 8.5 inches.
 *    @property {number} paperHeight - Paper height in inches. Defaults to 11 inches.
 *    @property {number} marginTop - Top margin in inches. Defaults to 1cm (~0.4 inches).
 *    @property {number} marginBottom - Bottom margin in inches. Defaults to 1cm (~0.4 inches).
 *    @property {number} marginLeft - Left margin in inches. Defaults to 1cm (~0.4 inches).
 *    @property {number} marginRight - Right margin in inches. Defaults to 1cm (~0.4 inches).
 *    @property {string} pageRanges - Paper ranges to print, e.g., '1-5, 8, 11-13'. Defaults to the empty string, which means print all pages.
 * }} options - Options object
 * @param {boolean} returnBinary - If true, returns as binary. Otherwise, returns a base64 string
 * @return {string} - Binary or Base64 string with the PDF data
 */
exports.printToPDF = async function (options = {}, returnBinary = false) {
  debug(`:: printToPDF => Printing page to PDF with options: ${JSON.stringify(options, null, 2)}. Returning as ${returnBinary ? 'binary' : 'base64'} string`)
  browserIsInitialized.call(this)
  let pdf = (await this.client.Page.printToPDF(options)).data

  if (returnBinary) {
    pdf = Buffer.from(pdf, 'base64')
  }

  return pdf
}

/**
 * Saves a PDF file of the page
 * @param {string} fileName - Path and Name of the file
 * @param {{
 *    @property {boolean} landscape - Paper orientation. Defaults to false.
 *    @property {boolean} displayHeaderFooter - Display header and footer. Defaults to false.
 *    @property {boolean} printBackground - Print background graphics. Defaults to false.
 *    @property {number} scale - Scale of the webpage rendering. Defaults to 1.
 *    @property {number} paperWidth - Paper width in inches. Defaults to 8.5 inches.
 *    @property {number} paperHeight - Paper height in inches. Defaults to 11 inches.
 *    @property {number} marginTop - Top margin in inches. Defaults to 1cm (~0.4 inches).
 *    @property {number} marginBottom - Bottom margin in inches. Defaults to 1cm (~0.4 inches).
 *    @property {number} marginLeft - Left margin in inches. Defaults to 1cm (~0.4 inches).
 *    @property {number} marginRight - Right margin in inches. Defaults to 1cm (~0.4 inches).
 *    @property {string} pageRanges - Paper ranges to print, e.g., '1-5, 8, 11-13'. Defaults to the empty string, which means print all pages.
 * }} options - PDF options
 */
exports.savePdf = async function (fileName = `pdf-${Date.now()}`, options = {}) {
  debug(`:: savePdf => Saving a PDF of the page...`)
  browserIsInitialized.call(this)

  await fs.writeFile(`${fileName}.pdf`, await this.printToPDF(options, true))
  debug(`:: savePdf => PDF saved!`)
  return `${fileName}.pdf`
}

/**
 * Get the Viewport of the element matching a selector
 * @param {string} selector - The selector string
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {Viewport} - Object with the viewport properties (https://chromedevtools.github.io/devtools-protocol/tot/Page/#type-Viewport)
 */
exports.getSelectorViewport = async function (selector, frameId) {
  debug(`:: getSelectorViewport => Getting viewport for element with selector "${selector}" for frame "${frameId || 'root'}"?`)
  browserIsInitialized.call(this)

  selector = fixSelector(selector)

  const node = await this.querySelector(selector, frameId)

  const boxModel = await this.client.DOM.getBoxModel({ nodeId: node.nodeId })

  const viewport = {
    x: boxModel.model.margin[0],
    y: boxModel.model.margin[1],
    width: boxModel.model.width,
    height: boxModel.model.height,
    scale: this.options.deviceMetrics.deviceScaleFactor
  }

  debug(`:: getSelectorViewport => Viewport: "${JSON.stringify(viewport)}"`)

  return viewport
}

/**
 * Get the list of frames in the loaded page
 * @return {object} - List of frames, with childFrames
 */
exports.getFrames = async function () {
  debug(`:: getFrames => Getting frames list`)
  browserIsInitialized.call(this)
  const frames = []
  const resourceTree = await this.client.Page.getResourceTree()
  frames.push(resourceTree.frameTree.frame)
  _.each(resourceTree.frameTree.childFrames, (frameObj) => {
    frames.push(frameObj.frame)
  })
  return frames
}

/**
 * Resize viewports of the page to full screen size
 */
exports.resizeFullScreen = async function () {
  debug(`:: resizeFullScreen => Resizing viewport to full screen size`)
  const {DOM, Emulation} = this.client

  const {root: {nodeId: documentNodeId}} = await DOM.getDocument()
  const {nodeId: bodyNodeId} = await DOM.querySelector({
    selector: 'body',
    nodeId: documentNodeId
  })
  const deviceMetrics = await this.options.deviceMetrics
  const { model: { height } } = await DOM.getBoxModel({ nodeId: bodyNodeId })

  await Emulation.setDeviceMetricsOverride({
    width: deviceMetrics.width,
    height: height,
    deviceScaleFactor: deviceMetrics.deviceScaleFactor,
    mobile: deviceMetrics.mobile,
    fitWindow: deviceMetrics.fitWindow
  })
  await this.client.Emulation.setVisibleSize({
    width: deviceMetrics.width,
    height: height
  })

  await Emulation.setPageScaleFactor({ pageScaleFactor: deviceMetrics.deviceScaleFactor })

  const fullPageViewport = {
    x: 0,
    y: 0,
    width: deviceMetrics.width,
    height: height,
    scale: deviceMetrics.deviceScaleFactor
  }

  return fullPageViewport
}

/**
 * Accepts or dismisses a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload)
 * @param {boolean} [accept=true] - Whether to accept or dismiss the dialog
 * @param {string} [promptText] - The text to enter into the dialog prompt before accepting. Used only if this is a prompt dialog.
 */
exports.handleDialog = async function (accept = true, promptText = '') {
  debug(`:: handleDialog => Handling dialog on the page...`)
  browserIsInitialized.call(this)
  await this.client.Page.handleJavaScriptDialog({
    accept,
    promptText
  })
  debug(`:: handleDialog => Dialog handled!`)
}

/**
 * Post data from the browser context
 * @param {string} url - The URL or path to POST to
 * @param {object} [data] - The data object to be posted
 * @param {object} [options] - Options of the request
 * @return {object} - Request status and data
 */
exports.post = async function (url, data = {}, options = {}) {
  debug(`:: post => Posting on URL "${url}" data: ${JSON.stringify(data, null, 2)} with options ${options}...`)
  browserIsInitialized.call(this)

  if (!url) {
    throw new Error(`An URL must be supplied in order to make the POST request`)
  }

  let requestData = data
  if (typeof data === 'object') {
    requestData = objectToEncodedUri(data)
  }

  const requestOptions = Object.assign({
    contentType: 'application/x-www-form-urlencoded',
    timeout: this.options.browser.loadPageTimeout
  }, options)

  return this.evaluateAsync(function (url, data, options) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.setRequestHeader('Content-Type', options.contentType)
      xhr.onload = function (e) {
        resolve({
          responseText: xhr.responseText,
          status: xhr.status,
          response: xhr.response,
          responseType: xhr.responseType,
          responseURL: xhr.responseURL,
          statusText: xhr.statusText,
          responseXML: xhr.responseXML,
          readyState: xhr.readyState
        })
      }
      xhr.onerror = function (e) {
        const error = new Error(`Error while making request POST to URL "${url}"`)
        error.requestData = data
        error.options = options
        error.response = {
          responseText: xhr.responseText,
          status: xhr.status,
          response: xhr.response,
          responseType: xhr.responseType,
          responseURL: xhr.responseURL,
          statusText: xhr.statusText,
          responseXML: xhr.responseXML,
          readyState: xhr.readyState
        }
        reject(error)
      }
      data ? xhr.send(data) : xhr.send()
    })
  }, url, requestData, requestOptions)
}
