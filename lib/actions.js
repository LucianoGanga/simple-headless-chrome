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
 * Injects a module in the page
 * @param {string} name - Name of the module to inject
 */
exports.inject = async function inject (name) {
  debug(`:: inject => Inject "${name}" on the root document...`)
  browserIsInitialized.call(this)
  switch (name) {
    case 'jQuery':
      await this.evaluate(function () {
        if (typeof window.jQuery === 'undefined') {
          // TODO: Change this script by one that evaluates jQuery directly instead of loading it from the CDN
          const script = document.createElement('script')
          script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js'
          document.getElementsByTagName('head')[0].appendChild(script)
        }
      })
      break
  }
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
  return this.client.Runtime.evaluate({
    expression: exp,
    returnByValue: true
  })
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

  const options = Object.assign({ timeout: this.options.loadPageTimeout }, opt)

  await this.client.Page.navigate({ url })

  if (options.timeout && typeof options.timeout) {
    await this.waitForPageToLoad(options.timeout)
  }
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
 * @param {string} selector - The selctor to type into.
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

  // Type on the selector
  for (let key of text.split('')) {
    await this.keyboardEvent(options.eventType, key, null, null, modifiers)
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
exports.keyboardEvent = async function (type, key, modifier) {
  debug(`:: keyboardEvent => Event type "${type}" | Key "${key}" | Modifier: "${modifier}"`)
  browserIsInitialized.call(this)

  type = (typeof type === 'undefined') ? 'char' : type
  key = (typeof key === 'undefined') ? null : key
  modifier = modifier || 0

  await this.client.Input.dispatchKeyEvent({
    type: 'char',
    modifiers: modifier,
    text: key
  })
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
  }), timeout || this.options.loadPageTimeout)
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
    }), timeout || this.options.loadPageTimeout)
  }

  return frame
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
 * @param {string} url - The request-URI to associate with the setting of the cookie.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @return {boolean} - True if successfully set cookie
 */
exports.setCookie = async function (url, name, value) {
  debug(`:: setCookies => Setting browser cookie for url ${url}`)
  browserIsInitialized.call(this)

  return this.client.Network.setCookies(url, name, value)
}

/**
 * Checks if an element matches the selector
 * @param {string} selector - The selector string
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {boolean} - Boolean indicating if element of selector exists or not
 */
// TODO: make use of the "frameId" parameter in this fn, and avoid using this.evaluate()
exports.exist = async function exist (selector, frameId) {
  debug(`:: exist => Exist element with selector "${selector}" for frame "${frameId || 'root'}"?`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const exist = this.evaluate(selector => !!document.querySelector(selector), selector)

  debug(`:: exist => Exist: "${exist}"`)

  return exist
}

/**
 * Checks if an element matching a selector is visible
 * @param {string} selector - The selector string
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {boolean} - Boolean indicating if element of selector is visible or not
 */
// TODO: make use of the "frameId" parameter in this fn, and avoid using this.evaluate()
exports.visible = async function visible (selector, frameId) {
  debug(`:: visible => Visible element with selector "${selector}" for frame "${frameId || 'root'}"?`)
  browserIsInitialized.call(this)

  return this.evaluate(selector => {
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
}

/**
 * Prints the page to PDF
 * @param {boolean} returnBinary - If true, returns as binary. Otherwise, returns a base64 string
 * @param {object} options - Options object
 * Options properties:
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
 * Takes a screenshot of the page and returns it as a string
 * @param {object} captureOptions - Options object
 * Options properties:
 *    @property {string} format - Image compression format (defaults to png). Allowed values: jpeg, png.
 *    @property {integer} quality - Compression quality from range [0..100] (jpeg only).
 *    @property {boolean} fromSurface - Capture the screenshot from the surface, rather than the view. Defaults to false. EXPERIMENTAL
 * @param {boolean} returnBinary - If true, returns as binary. Otherwise, returns a base64 string
 * @return {string} - Binary or Base64 string with the image data
 */
exports.getScreenshot = async function (captureOptions = {}, returnBinary = false) {
  debug(`:: getScreenshot => Taking a screenshot of the page. Returning as ${returnBinary ? 'binary' : 'base64'} string`)
  browserIsInitialized.call(this)

  let screenshot = (await this.client.Page.captureScreenshot(captureOptions)).data

  if (returnBinary) {
    screenshot = Buffer.from(screenshot, 'base64')
  }
  debug(`:: getScreenshot => Screenshot took!`)

  return screenshot
}

/**
 * Saves a screenshot of the page
 * @param {boolean} fileName - Path and Name of the file (without the extension)
 * @param {object} captureOptions - Options object
 * Options properties:
 *    @property {string} format - Image compression format (defaults to png). Allowed values: jpeg, png.
 *    @property {integer} quality - Compression quality from range [0..100] (jpeg only).
 *    @property {boolean} fromSurface - Capture the screenshot from the surface, rather than the view. Defaults to false. EXPERIMENTAL
 * @return {string} - Binary or Base64 string with the image data
 */
exports.saveScreenshot = async function (fileName = `screenshot-${Date.now()}`, captureOptions = {}) {
  debug(`:: saveScreenshot => Saving a screenshot of the page...`)
  browserIsInitialized.call(this)

  await fs.writeFile(`${fileName}.${captureOptions.format || 'png'}`, await this.getScreenshot(captureOptions), 'base64')
  debug(`:: saveScreenshot => Screenshot saved!`)
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
    timeout: this.options.loadPageTimeout
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
