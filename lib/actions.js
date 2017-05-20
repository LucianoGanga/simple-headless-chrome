'use strict'

const debug = require('debug')('HeadlessChrome:actions')
const _ = require('lodash')

const { browserIsInitialized, sleep, fixSelector, interleaveArrayToObject, promiseTimeout } = require('./util')

/**
 * Evaluates a fn in the context of the browser
 * @param fn {function} - The function to evaluate in the browser
 * @param args {*} - The arguments to pass to the function
 */
exports.evaluate = function evaluate (fn, ...args) {
  debug(`:: evaluate => ${fn}`, ...args)
  browserIsInitialized.call(this)
  const exp = args && args.length > 0 ? `(${String(fn)}).apply(null, ${JSON.stringify(args)})` : `(${String(fn)}).apply(null)`
  return this.client.Runtime.evaluate({
    expression: exp
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
exports.goTo = async function (url, opt) {
  debug(`:: goTo => URL "${url}" | Options: ${JSON.stringify(opt, null, 2)}`)
  browserIsInitialized.call(this)

  const options = Object.assign({ timeout: this.options.loadPageTimeout }, opt)

  await this.client.Page.navigate({ url })

  if (options.timeout && typeof options.timeout) {
    await this.waitForPageToLoad(options.timeout)
  }
}

/**
 * Get the value of an element.
 * @param {string} selector - The target selector
 * @return {object} - Object containing type and value of the element
 */
exports.getValue = async function (selector, value) {
  debug(`:: getValue => Get value from element matching "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  try {
    const selectValue = await this.evaluate(function getValue (selector) {
      return document.querySelector(selector).value
    }, selector)
    debug(`:: getValue => Value from element matching "${selector}":`, selectValue.result)
    return selectValue.result
  } catch (err) {
    throw err
  }
}

/**
 * Set the value of an element.
 * @param {string} selector - The selector to set the value of.
 * @param {string} [value] - The value to set the selector to
 */
exports.setValue = async function (selector, value) {
  debug(`:: setValue => Set value "${value}" to element matching selector "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  // const node = await this.querySelector(selector)
  // await this.client.DOM.setNodeValue({
  //   nodeId: node.nodeId,
  //   value: value
  // })

  const result = await this.evaluate(function setValue (selector, value) {
    const element = document.querySelector(selector)
    const event = document.createEvent('HTMLEvents')
    element.value = value
    event.initEvent('change', true, true)
    element.dispatchEvent(event)
  }, selector, value)

  if (_.get(result, 'result.className') === 'TypeError') {
    const error = new Error(`Couldn't set value "${value}" for element with selector "${selector}". Browser returned: ${_.get(result, 'result.description')}`)
    error.exception = _.get(result, 'exceptionDetails', {})
    throw error
  }

  debug(`:: setValue => Result of setting value in element matching selector "${selector}":`, result)
}

/**
 * Fills a selector of an input or textarea element with the passed value
 * @param selector {string} - The selector
 * @param value {string} - The value to fill the element matched in the selector
 * @param opt {object} -
 */
exports.fill = async function (selector, value) {
  debug(`:: fill => Fill selector "${selector}" with value "${value}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const node = await this.querySelector(selector)

  const nodeAttrs = interleaveArrayToObject((await this.client.DOM.getAttributes(node)).attributes)
  const { className: htmlObjectType } = (await this.client.DOM.resolveNode(node)).object

  const type = nodeAttrs.type
  const supportedTypes = ['color', 'date', 'datetime', 'datetime-local', 'email', 'hidden', 'month', 'number', 'password', 'range', 'search', 'tel', 'text', 'time', 'url', 'week']
  // Check https://developer.mozilla.org/en-US/docs/Web/API for more info about HTML Objects
  const isValidInput = htmlObjectType === 'HTMLInputElement' && (typeof type === 'undefined' || supportedTypes.indexOf(type) !== -1)
  const isTextArea = htmlObjectType === 'HTMLTextAreaElement'

  if (isTextArea || isValidInput) {
    await this.setValue(selector, value)
  } else {
    throw new Error(`DOM element ${selector} can not be filled`)
  }
}

/**
 * Clear an input field.
 * @param {string} selector - The selector to clear.
 */
exports.clear = async function (selector) {
  debug(`:: clear => Clear the field of the selector "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)
  await this.setValue(selector, '')
}

/**
 * Returns the node associated to the passed selector
 * @param {string} selector - The selector to find
 * @return {NodeId Object} - NodeId Object (+info: https://chromedevtools.github.io/devtools-protocol/tot/DOM/#type-NodeId)
 */
exports.querySelector = async function (selector) {
  debug(`:: querySelector => Get element from selector "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const DOM = this.client.DOM

  try {
    const ret = await DOM.getDocument()
    const node = await DOM.querySelector({
      nodeId: ret.root.nodeId,
      selector
    })
    return node
  } catch (err) {
    throw new Error(`Can not query selector ${selector}`, err)
  }
}

/**
 * Focus on an element matching the selector
 * @param {string} selector - The selector to find the element
 */
exports.focus = async function (selector) {
  debug(`:: clear => Clear the field of the selector "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  try {
    const node = await this.querySelector(selector)
    await this.client.DOM.focus({ nodeId: node.nodeId })
  } catch (err) {
    throw new Error(`Can not focus to ${selector}`, err)
  }
}

/**
 * Simulate a keypress on a selector
 * @param {string} selector - The selctor to type into.
 * @param {string} text - The text to type.
 * @param {object} options - Lets you send keys like control & shift
 */
exports.type = async function (selector, text, opts) {
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
    await this.clear(selector)
  }

  // Focus on the selector
  await this.focus(selector)

  // Type on the selector
  for (let key of text.split('')) {
    await this.keyboardEvent(options.eventType, key, null, null, modifiers)
  }
}

/**
 * Select a value in an html select element.
 * @param {string} selector - The identifier for the select element.
 * @param {string} value - The value to select.
 */
exports.select = async function (selector, value) {
  debug(`:: select => ${(typeof value !== 'undefined') ? 'Set select value to "' + value + '"' : 'Get select value'} in the select matching selector "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  if (typeof value !== 'undefined') {
    await this.setValue(selector, value)
  } else {
    await this.getValue(selector, value)
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
  return promiseTimeout(await new Promise((resolve, reject) => {
    const listener = () => {
      this.removeListener('pageLoaded', listener)
      resolve(true)
    }
    this.on('pageLoaded', listener)
  }), timeout || this.options.loadPageTimeout)
}

/**
 * Fire a mouse event.
 * @param {string} [type=mousePressed] - Type of the mouse event. Allowed values: mousePressed, mouseReleased, mouseMoved.
 * @param {number} [x=null] - X coordinate of the event relative to the main frame's viewport.
 * @param {number} [y=null] - Y coordinate of the event relative to the main frame's viewport. 0 refers to the top of the viewport and Y increases as it proceeds towards the bottom of the viewport.
 * @param {number} [modifier=0] - Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0).
 * @param {string} [button=left] - Mouse button (default: "none"). Allowed values: none, left, middle, right.
 * @see {@link https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchMouseEvent}
 */
exports.mouseEvent = async function (type, x, y, modifiers, button) {
  debug(`:: mouseEvent => Type "${type}" | (${x}; ${y}) | Modifiers: "${modifiers}" | Button: ${button}`)
  browserIsInitialized.call(this)

  type = (typeof type === 'undefined') ? 'click' : type
  x = (typeof x === 'undefined') ? null : x
  y = (typeof y === 'undefined') ? null : y
  button = (typeof button === 'undefined') ? 'left' : button

  await this.page.sendEvent(type, x, y, button)
}

/**
 * Click on a selector by firing a 'click event'
 * @param {string} [selector]
 */
exports.click = async function (selector) {
  debug(`:: click => Click selector "${selector}"`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  await this.evaluate(function clickElement (selector) {
    document.querySelector(selector).click()
  }, selector)
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
 * Checks if an element matches the selector
 * @param {string} selector - The selector string
 */
exports.exist = async function exist (selector) {
  debug(`:: exist => Exist element with selector "${selector}"?`)
  browserIsInitialized.call(this)
  selector = fixSelector(selector)

  const exist = this.evaluate(selector => !!document.querySelector(selector), selector)

  debug(`:: exist => Exist: "${exist}"`)

  return exist
}

/**
 * Checks if an element matching a selector is visible
 * @param {string} selector - The selector string
 */
exports.visible = async function visible (selector) {
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
