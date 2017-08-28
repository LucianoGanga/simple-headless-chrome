/* global XMLHttpRequest */
'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var debug = require('debug')('HeadlessChrome:actions');

var Promise = require('bluebird');
var fs = require('mz/fs');
var _ = require('lodash');

var _require = require('./util'),
    browserIsInitialized = _require.browserIsInitialized,
    sleep = _require.sleep,
    fixSelector = _require.fixSelector,
    interleaveArrayToObject = _require.interleaveArrayToObject,
    promiseTimeout = _require.promiseTimeout,
    objectToEncodedUri = _require.objectToEncodedUri;

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


exports.inject = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(moduleOrScript) {
    var file, buff;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            debug(`:: inject => Inject "${moduleOrScript}" on the root document...`);
            browserIsInitialized.call(this);

            if (!(moduleOrScript.slice(0, 8) === 'https://' || moduleOrScript.slice(0, 7) === 'http://')) {
              _context.next = 6;
              break;
            }

            return _context.abrupt('return', this.injectRemoteScript(moduleOrScript));

          case 6:
            _context.t0 = moduleOrScript;
            _context.next = _context.t0 === 'jquery' ? 9 : _context.t0 === 'jQuery' ? 9 : _context.t0 === 'jquery.slim' ? 10 : _context.t0 === 'jQuery.slim' ? 10 : 11;
            break;

          case 9:
            return _context.abrupt('return', this.evaluateAsync(function () {
              return new Promise(function (resolve, reject) {
                if (typeof window.jQuery === 'undefined') {
                  var script = document.createElement('script');
                  script.src = 'https://code.jquery.com/jquery-3.2.1.min.js';
                  script.onload = resolve;
                  script.onerror = reject;
                  document.head.appendChild(script);
                } else {
                  resolve();
                }
              });
            }));

          case 10:
            return _context.abrupt('return', this.evaluateAsync(function () {
              return new Promise(function (resolve, reject) {
                if (typeof window.jQuery === 'undefined') {
                  var script = document.createElement('script');
                  script.src = 'https://code.jquery.com/jquery-3.2.1.slim.min.js';
                  script.onload = resolve;
                  script.onerror = reject;
                  document.head.appendChild(script);
                } else {
                  resolve();
                }
              });
            }));

          case 11:
            file = require.resolve(moduleOrScript);
            _context.next = 14;
            return fs.readFile(file);

          case 14:
            buff = _context.sent;
            return _context.abrupt('return', this.injectScript(buff.toString()));

          case 16:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function inject(_x) {
    return _ref.apply(this, arguments);
  }

  return inject;
}();

/**
 * Injects a remote script in the page
 * @example injectRemoteScript(https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js)
 * @param {string} src - Url to remote JavaScript file
 */
exports.injectRemoteScript = function () {
  var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(src) {
    var result;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            debug(`:: injectRemoteScript => Inject "${src}" on the root document...`);
            browserIsInitialized.call(this);
            _context2.next = 4;
            return this.evaluateAsync(function (src) {
              return new Promise(function (resolve, reject) {
                var script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
              });
            }, src);

          case 4:
            result = _context2.sent;

            debug(`:: injectRemoteScript => script "${src}" was injected successfully!`);

            return _context2.abrupt('return', result);

          case 7:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  function injectRemoteScript(_x2) {
    return _ref2.apply(this, arguments);
  }

  return injectRemoteScript;
}();

/**
 * Injects code in the DOM as script tag
 * @param {string} script - Code to be injected and evaluated in the DOM
 */
exports.injectScript = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(script) {
    var result;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            debug(`:: injectScript => Injecting "${script.slice(0, 10)}..." on the root document...`);
            browserIsInitialized.call(this);
            _context3.next = 4;
            return this.evaluate(function (text) {
              var script = document.createElement('script');
              script.text = text;
              document.head.appendChild(script);
            }, script);

          case 4:
            result = _context3.sent;

            debug(`:: injectScript => script "${script.slice(0, 10)}..." was injected successfully!`);

            return _context3.abrupt('return', result);

          case 7:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  function injectScript(_x3) {
    return _ref3.apply(this, arguments);
  }

  return injectScript;
}();

/**
 * Evaluates a fn in the context of the browser
 * @param fn {function} - The function to evaluate in the browser
 * @param args {*} - The arguments to pass to the function
 */
exports.evaluate = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(fn) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var exp, result;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            debug.apply(undefined, [`:: evaluate => ${fn}`].concat(_toConsumableArray(args)));
            browserIsInitialized.call(this);
            exp = args && args.length > 0 ? `(${String(fn)}).apply(null, ${JSON.stringify(args)})` : `(${String(fn)}).apply(null)`;
            _context4.next = 5;
            return this.client.Runtime.evaluate({
              expression: exp,
              returnByValue: true
            });

          case 5:
            result = _context4.sent;

            debug(`:: evaluate => Function ${fn} evaluated successfully!`, result);

            return _context4.abrupt('return', result);

          case 8:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  function evaluate(_x4) {
    return _ref4.apply(this, arguments);
  }

  return evaluate;
}();

/**
 * Evaluates an async fn in the context of the browser
 * @param fn {function} - The function to evaluate in the browser
 * @param args {*} - The arguments to pass to the function
 */
exports.evaluateAsync = function () {
  var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(fn) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    var exp;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            debug.apply(undefined, [`:: evaluate => ${fn}`].concat(_toConsumableArray(args)));
            browserIsInitialized.call(this);
            exp = args && args.length > 0 ? `(${String(fn)}).apply(null, ${JSON.stringify(args)})` : `(${String(fn)}).apply(null)`;
            return _context5.abrupt('return', this.client.Runtime.evaluate({
              expression: exp,
              returnByValue: true,
              awaitPromise: true
            }));

          case 4:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  function evaluate(_x5) {
    return _ref5.apply(this, arguments);
  }

  return evaluate;
}();

/**
 * Evaluates a fn in the context of a passed node
 * @param {NodeObject} node - The Node Object used to get the context
 * @param fn {function} - The function to evaluate in the browser
 * @param args {*} - The arguments to pass to the function
 */
exports.evaluateOnNode = function () {
  var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(node, fn) {
    for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
      args[_key3 - 2] = arguments[_key3];
    }

    var exp, resolvedNode;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            debug.apply(undefined, [`:: evaluateOnNode => Evaluate on node "${node.nodeId}", fn: ${fn}`].concat(_toConsumableArray(args)));
            browserIsInitialized.call(this);
            exp = args && args.length > 0 ? `function() {(${String(fn)}).apply(null, ${JSON.stringify(args)})}` : `function() {(${String(fn)}).apply(null)}`;
            _context6.next = 5;
            return this.client.DOM.resolveNode(node);

          case 5:
            resolvedNode = _context6.sent;
            return _context6.abrupt('return', this.client.Runtime.callFunctionOn({
              objectId: resolvedNode.object.objectId,
              functionDeclaration: exp
            }));

          case 7:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  function evaluateOnNode(_x6, _x7) {
    return _ref6.apply(this, arguments);
  }

  return evaluateOnNode;
}();

/**
 * Navigates to a URL
 * @param {string} url - The URL to navigate to
 * @param {object} options - The options object.
 * options:
 *    @property {number} timeout - Time in ms that this method has to wait until the
 * "pageLoaded" event is triggered. If the value is 0 or false, it means that it doesn't
 * have to wait after calling the "Page.navigate" method
 */
exports.goTo = function () {
  var _ref7 = _asyncToGenerator(regeneratorRuntime.mark(function _callee7(url) {
    var _this = this;

    var opt = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            debug(`:: goTo => URL "${url}" | Options: ${JSON.stringify(opt, null, 2)}`);
            browserIsInitialized.call(this);

            options = Object.assign({
              timeout: this.options.browser.loadPageTimeout
            }, opt);


            if (options.bypassCertificate) {
              this.client.Security.certificateError(function (_ref8) {
                var eventId = _ref8.eventId;

                _this.client.Security.handleCertificateError({
                  eventId,
                  action: 'continue'
                });
              });

              this.client.Security.setOverrideCertificateErrors({ override: true });
            }

            _context7.next = 6;
            return this.client.Page.navigate({ url });

          case 6:
            if (!(options.timeout && typeof options.timeout)) {
              _context7.next = 9;
              break;
            }

            _context7.next = 9;
            return this.waitForPageToLoad(options.timeout);

          case 9:
            debug(`:: goTo => URL "${url}" navigated!`);

          case 10:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function (_x9) {
    return _ref7.apply(this, arguments);
  };
}();

/**
 * Get the value of an Node.
 * @param {NodeObject} node - The Node Object
 * @return {object} - Object containing type and value of the element
 */
exports.getNodeValue = function () {
  var _ref9 = _asyncToGenerator(regeneratorRuntime.mark(function _callee8(node) {
    var nodeAttrs, value;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            debug(`:: getNodeValue => Get value from Node "${node.nodeId}"`);
            browserIsInitialized.call(this);

            _context8.t0 = interleaveArrayToObject;
            _context8.next = 5;
            return this.client.DOM.getAttributes(node);

          case 5:
            _context8.t1 = _context8.sent.attributes;
            nodeAttrs = (0, _context8.t0)(_context8.t1);
            value = nodeAttrs.value;

            debug(`:: getNodeValue => Value from Node "${node.nodeId}":`, value);
            return _context8.abrupt('return', value);

          case 10:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function (_x10) {
    return _ref9.apply(this, arguments);
  };
}();

/**
 * Get the value of an element.
 * @param {string} selector - The target selector
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {object} - Object containing type and value of the element
 */
exports.getValue = function () {
  var _ref10 = _asyncToGenerator(regeneratorRuntime.mark(function _callee9(selector, frameId) {
    var node, htmlObjectType, value, textareaEvaluate;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            debug(`:: getValue => Get value from element matching "${selector}"`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);

            _context9.next = 5;
            return this.querySelector(selector, frameId);

          case 5:
            node = _context9.sent;
            _context9.next = 8;
            return this.client.DOM.resolveNode(node);

          case 8:
            htmlObjectType = _context9.sent.object.className;
            value = void 0;
            // If the node object type is HTMLTextAreaElement, then get the value from the console.
            /**
             * TODO: Take the value from the DOM Node. For some reason, there're some pages where is not possible
             * to get the textarea value, as its nodeId refreshes all the time
             */

            if (!(htmlObjectType === 'HTMLTextAreaElement')) {
              _context9.next = 18;
              break;
            }

            // Escape selector for onConsole use
            selector = selector.replace(/\\/g, '\\');
            _context9.next = 14;
            return this.evaluate(function (selector) {
              return document.querySelector(selector).value;
            }, selector);

          case 14:
            textareaEvaluate = _context9.sent;

            value = textareaEvaluate.result.value;
            _context9.next = 21;
            break;

          case 18:
            _context9.next = 20;
            return this.getNodeValue(node);

          case 20:
            value = _context9.sent;

          case 21:
            debug(`:: getValue => Value from element matching "${selector}":`, value);
            return _context9.abrupt('return', value);

          case 23:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function (_x11, _x12) {
    return _ref10.apply(this, arguments);
  };
}();

/**
 * Set the value of an element.
 * @param {NodeObject} node - The Node Object
 * @param {string} value - The value to set the node to (it may be an array of values when the node is a multiple "HTMLSelectElement")
 */
exports.setNodeValue = function () {
  var _ref11 = _asyncToGenerator(regeneratorRuntime.mark(function _callee10(node, value) {
    var htmlObjectType, selectOptions, selectedValuesArray, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, option, optionValue;

    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            debug(`:: setNodeValue => Set node value "${value}" to node "${node.nodeId}"`);
            browserIsInitialized.call(this);

            _context10.next = 4;
            return this.client.DOM.resolveNode(node);

          case 4:
            htmlObjectType = _context10.sent.object.className;

            if (!(htmlObjectType === 'HTMLSelectElement')) {
              _context10.next = 47;
              break;
            }

            _context10.next = 8;
            return this.client.DOM.querySelectorAll({
              nodeId: node.nodeId,
              selector: 'option'
            });

          case 8:
            selectOptions = _context10.sent;


            // Ensure the selectedValuesArray is an array
            selectedValuesArray = value;

            if (!Array.isArray(value)) {
              selectedValuesArray = [value];
            }

            // Iterate over all the options of the select
            _iteratorNormalCompletion = true;
            _didIteratorError = false;
            _iteratorError = undefined;
            _context10.prev = 14;
            _iterator = selectOptions.nodeIds[Symbol.iterator]();

          case 16:
            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
              _context10.next = 31;
              break;
            }

            option = _step.value;
            _context10.next = 20;
            return this.getNodeValue({ nodeId: option });

          case 20:
            optionValue = _context10.sent;

            if (!(selectedValuesArray.indexOf(optionValue) > -1)) {
              _context10.next = 26;
              break;
            }

            _context10.next = 24;
            return this.client.DOM.setAttributeValue({
              nodeId: option,
              name: 'selected',
              value: 'true'
            });

          case 24:
            _context10.next = 28;
            break;

          case 26:
            _context10.next = 28;
            return this.client.DOM.removeAttribute({
              nodeId: option,
              name: 'selected'
            });

          case 28:
            _iteratorNormalCompletion = true;
            _context10.next = 16;
            break;

          case 31:
            _context10.next = 37;
            break;

          case 33:
            _context10.prev = 33;
            _context10.t0 = _context10['catch'](14);
            _didIteratorError = true;
            _iteratorError = _context10.t0;

          case 37:
            _context10.prev = 37;
            _context10.prev = 38;

            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }

          case 40:
            _context10.prev = 40;

            if (!_didIteratorError) {
              _context10.next = 43;
              break;
            }

            throw _iteratorError;

          case 43:
            return _context10.finish(40);

          case 44:
            return _context10.finish(37);

          case 45:
            _context10.next = 49;
            break;

          case 47:
            _context10.next = 49;
            return this.client.DOM.setAttributeValue({
              nodeId: node.nodeId,
              name: 'value',
              value: value
            });

          case 49:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this, [[14, 33, 37, 45], [38,, 40, 44]]);
  }));

  return function (_x13, _x14) {
    return _ref11.apply(this, arguments);
  };
}();

/**
 * Set the value of an element.
 * @param {string} selector - The selector to set the value of.
 * @param {string} [value] - The value to set the selector to
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.setValue = function () {
  var _ref12 = _asyncToGenerator(regeneratorRuntime.mark(function _callee11(selector, value, frameId) {
    var node, htmlObjectType;
    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            debug(`:: setValue => Set value "${value}" to element matching selector "${selector}" in frame "${frameId || 'root'}"`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);

            _context11.next = 5;
            return this.querySelector(selector, frameId);

          case 5:
            node = _context11.sent;
            _context11.next = 8;
            return this.client.DOM.resolveNode(node);

          case 8:
            htmlObjectType = _context11.sent.object.className;

            if (!(htmlObjectType === 'HTMLTextAreaElement')) {
              _context11.next = 15;
              break;
            }

            // Escape selector for onConsole use
            selector = selector.replace(/\\/g, '\\');
            _context11.next = 13;
            return this.evaluate(function (selector, value) {
              document.querySelector(selector).value = value;
            }, selector, value);

          case 13:
            _context11.next = 17;
            break;

          case 15:
            _context11.next = 17;
            return this.setNodeValue(node, value);

          case 17:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));

  return function (_x15, _x16, _x17) {
    return _ref12.apply(this, arguments);
  };
}();

/**
 * Fills a selector of an input or textarea element with the passed value
 * @param {string} selector  - The selector
 * @param {string} value - The value to fill the element matched in the selector
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.fill = function () {
  var _ref13 = _asyncToGenerator(regeneratorRuntime.mark(function _callee12(selector, value, frameId) {
    var node, nodeAttrs, htmlObjectType, type, supportedTypes, isValidInput, isTextArea;
    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            debug(`:: fill => Fill selector "${selector}" with value "${value}" in frame "${frameId || 'root'}"`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);

            _context12.next = 5;
            return this.querySelector(selector, frameId);

          case 5:
            node = _context12.sent;
            _context12.t0 = interleaveArrayToObject;
            _context12.next = 9;
            return this.client.DOM.getAttributes(node);

          case 9:
            _context12.t1 = _context12.sent.attributes;
            nodeAttrs = (0, _context12.t0)(_context12.t1);
            _context12.next = 13;
            return this.client.DOM.resolveNode(node);

          case 13:
            htmlObjectType = _context12.sent.object.className;
            type = nodeAttrs.type;
            supportedTypes = ['color', 'date', 'datetime', 'datetime-local', 'email', 'hidden', 'month', 'number', 'password', 'range', 'search', 'tel', 'text', 'time', 'url', 'week'];
            // Check https://developer.mozilla.org/en-US/docs/Web/API for more info about HTML Objects

            isValidInput = htmlObjectType === 'HTMLInputElement' && (typeof type === 'undefined' || supportedTypes.indexOf(type) !== -1);
            isTextArea = htmlObjectType === 'HTMLTextAreaElement';

            if (!(isTextArea || isValidInput)) {
              _context12.next = 23;
              break;
            }

            _context12.next = 21;
            return this.setNodeValue(node, value);

          case 21:
            _context12.next = 24;
            break;

          case 23:
            throw new Error(`DOM element ${selector} can not be filled`);

          case 24:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function (_x18, _x19, _x20) {
    return _ref13.apply(this, arguments);
  };
}();

/**
 * Clear an input field.
 * @param {string} selector - The selector to clear.
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.clear = function () {
  var _ref14 = _asyncToGenerator(regeneratorRuntime.mark(function _callee13(selector, frameId) {
    var node;
    return regeneratorRuntime.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            debug(`:: clear => Clear the field of the selector "${selector}"`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);
            _context13.next = 5;
            return this.querySelector(selector, frameId);

          case 5:
            node = _context13.sent;
            _context13.next = 8;
            return this.setNodeValue(node, '');

          case 8:
          case 'end':
            return _context13.stop();
        }
      }
    }, _callee13, this);
  }));

  return function (_x21, _x22) {
    return _ref14.apply(this, arguments);
  };
}();

/**
 * Returns the node associated to the passed selector
 * @param {string} selector - The selector to find
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {NodeId Object} - NodeId Object (+info: https://chromedevtools.github.io/devtools-protocol/tot/DOM/#type-NodeId)
 */
exports.querySelector = function () {
  var _ref15 = _asyncToGenerator(regeneratorRuntime.mark(function _callee14(selector, frameId) {
    var DOM, _document, node;

    return regeneratorRuntime.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            debug(`:: querySelector => Get element from selector "${selector}" in frame "${frameId || 'root'}"`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);

            DOM = this.client.DOM;
            _context14.prev = 4;

            if (!frameId) {
              _context14.next = 11;
              break;
            }

            _context14.next = 8;
            return DOM.getFlattenedDocument();

          case 8:
            _context14.t0 = _context14.sent;
            _context14.next = 14;
            break;

          case 11:
            _context14.next = 13;
            return DOM.getDocument();

          case 13:
            _context14.t0 = _context14.sent;

          case 14:
            _document = _context14.t0;
            node = frameId ? _.find(_document.nodes, { frameId: frameId }) : _document.root;

            // If the node is an iFrame, the #document node is in the contentDocument attribute of the node

            if (node.nodeName === 'IFRAME' && node.contentDocument) {
              node = node.contentDocument;
            }

            _context14.next = 19;
            return DOM.querySelector({
              nodeId: node.nodeId,
              selector
            });

          case 19:
            return _context14.abrupt('return', _context14.sent);

          case 22:
            _context14.prev = 22;
            _context14.t1 = _context14['catch'](4);

            _context14.t1.name = `Can not query selector ${selector} in frame "${frameId || 'root'}": ${_context14.t1.name}`;
            throw _context14.t1;

          case 26:
          case 'end':
            return _context14.stop();
        }
      }
    }, _callee14, this, [[4, 22]]);
  }));

  return function (_x23, _x24) {
    return _ref15.apply(this, arguments);
  };
}();

/**
 * Focus on an element matching the selector
 * @param {string} selector - The selector to find the element
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.focus = function () {
  var _ref16 = _asyncToGenerator(regeneratorRuntime.mark(function _callee15(selector, frameId) {
    var node;
    return regeneratorRuntime.wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            debug(`:: focus => Focusing on selector "${selector}" in frame "${frameId || 'root'}"`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);

            _context15.prev = 3;
            _context15.next = 6;
            return this.querySelector(selector, frameId);

          case 6:
            node = _context15.sent;
            _context15.next = 9;
            return this.client.DOM.focus({ nodeId: node.nodeId });

          case 9:
            _context15.next = 14;
            break;

          case 11:
            _context15.prev = 11;
            _context15.t0 = _context15['catch'](3);
            throw new Error(`Can not focus to ${selector}. Error: ${_context15.t0}`);

          case 14:
          case 'end':
            return _context15.stop();
        }
      }
    }, _callee15, this, [[3, 11]]);
  }));

  return function (_x25, _x26) {
    return _ref16.apply(this, arguments);
  };
}();

/**
 * Simulate a keypress on a selector
 * @param {string} selector - The selector to type into.
 * @param {string} text - The text to type.
 * @param {string} frameId - The FrameID where the selector should be searched
 * @param {object} options - Lets you send keys like control & shift
 */
exports.type = function () {
  var _ref17 = _asyncToGenerator(regeneratorRuntime.mark(function _callee16(selector, text, frameId, opts) {
    var options, computeModifier, modifiers, isSpecialChar, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, key;

    return regeneratorRuntime.wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            isSpecialChar = function isSpecialChar(key) {
              if (key === '\r') {
                return true;
              }
            };

            computeModifier = function computeModifier(modifierString) {
              var modifiers = {
                'ctrl': 0x04000000,
                'shift': 0x02000000,
                'alt': 0x08000000,
                'meta': 0x10000000,
                'keypad': 0x20000000
              };
              var modifier = 0;
              var checkKey = function checkKey(key) {
                if (key in modifiers) {
                  return;
                }
                debug(key + 'is not a supported key modifier');
              };
              if (!modifierString) {
                return modifier;
              }

              var keys = modifierString.split('+');
              keys.forEach(checkKey);
              return keys.reduce(function (acc, key) {
                return acc | modifiers[key];
              }, modifier);
            };

            options = Object.assign({
              reset: false, // Clear the field first
              eventType: 'char' // Enum: [ 'keyDown', 'keyUp', 'rawKeyDown', 'char' ]
            }, opts);


            debug(`:: type => Type text "${text}" in selector "${selector}" | Options: ${JSON.stringify(options, null, 2)}`);
            selector = fixSelector(selector);
            modifiers = computeModifier(options && options.modifiers);

            // Clear the field in the selector, if needed

            if (!options.reset) {
              _context16.next = 9;
              break;
            }

            _context16.next = 9;
            return this.clear(selector, frameId);

          case 9:
            _context16.next = 11;
            return this.focus(selector, frameId);

          case 11:

            // Type on the selector
            _iteratorNormalCompletion2 = true;
            _didIteratorError2 = false;
            _iteratorError2 = undefined;
            _context16.prev = 14;
            _iterator2 = text.split('')[Symbol.iterator]();

          case 16:
            if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
              _context16.next = 32;
              break;
            }

            key = _step2.value;

            if (!isSpecialChar(key)) {
              _context16.next = 27;
              break;
            }

            _context16.next = 21;
            return this.keyboardEvent('rawKeyDown', '', modifiers, 13);

          case 21:
            _context16.next = 23;
            return this.keyboardEvent(options.eventType, '\r', modifiers);

          case 23:
            _context16.next = 25;
            return this.keyboardEvent('keyUp', '', modifiers, 13);

          case 25:
            _context16.next = 29;
            break;

          case 27:
            _context16.next = 29;
            return this.keyboardEvent(options.eventType, key, modifiers);

          case 29:
            _iteratorNormalCompletion2 = true;
            _context16.next = 16;
            break;

          case 32:
            _context16.next = 38;
            break;

          case 34:
            _context16.prev = 34;
            _context16.t0 = _context16['catch'](14);
            _didIteratorError2 = true;
            _iteratorError2 = _context16.t0;

          case 38:
            _context16.prev = 38;
            _context16.prev = 39;

            if (!_iteratorNormalCompletion2 && _iterator2.return) {
              _iterator2.return();
            }

          case 41:
            _context16.prev = 41;

            if (!_didIteratorError2) {
              _context16.next = 44;
              break;
            }

            throw _iteratorError2;

          case 44:
            return _context16.finish(41);

          case 45:
            return _context16.finish(38);

          case 46:
          case 'end':
            return _context16.stop();
        }
      }
    }, _callee16, this, [[14, 34, 38, 46], [39,, 41, 45]]);
  }));

  return function (_x27, _x28, _x29, _x30) {
    return _ref17.apply(this, arguments);
  };
}();
/**
 * Types text (doesn't matter where it is)
 * @param {string} text - The text to type.
 * @param {object} options - Lets you send keys like control & shift
 */
exports.typeText = function () {
  var _ref18 = _asyncToGenerator(regeneratorRuntime.mark(function _callee17(text, opts) {
    var options, computeModifier, modifiers, isSpecialChar, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, key;

    return regeneratorRuntime.wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            isSpecialChar = function isSpecialChar(key) {
              if (key === '\r') {
                return true;
              }
            };

            computeModifier = function computeModifier(modifierString) {
              var modifiers = {
                'ctrl': 0x04000000,
                'shift': 0x02000000,
                'alt': 0x08000000,
                'meta': 0x10000000,
                'keypad': 0x20000000
              };
              var modifier = 0;
              var checkKey = function checkKey(key) {
                if (key in modifiers) {
                  return;
                }
                debug(key + 'is not a supported key modifier');
              };
              if (!modifierString) {
                return modifier;
              }

              var keys = modifierString.split('+');
              keys.forEach(checkKey);
              return keys.reduce(function (acc, key) {
                return acc | modifiers[key];
              }, modifier);
            };

            options = Object.assign({
              reset: false, // Clear the field first
              eventType: 'char' // Enum: [ 'keyDown', 'keyUp', 'rawKeyDown', 'char' ]
            }, opts);


            debug(`:: typeText => Type text "${text}" | Options: ${JSON.stringify(options, null, 2)}`);
            modifiers = computeModifier(options && options.modifiers);


            // Type on the selector
            _iteratorNormalCompletion3 = true;
            _didIteratorError3 = false;
            _iteratorError3 = undefined;
            _context17.prev = 8;
            _iterator3 = text.split('')[Symbol.iterator]();

          case 10:
            if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
              _context17.next = 26;
              break;
            }

            key = _step3.value;

            if (!isSpecialChar(key)) {
              _context17.next = 21;
              break;
            }

            _context17.next = 15;
            return this.keyboardEvent('rawKeyDown', '', modifiers, 13);

          case 15:
            _context17.next = 17;
            return this.keyboardEvent(options.eventType, '\r', modifiers);

          case 17:
            _context17.next = 19;
            return this.keyboardEvent('keyUp', '', modifiers, 13);

          case 19:
            _context17.next = 23;
            break;

          case 21:
            _context17.next = 23;
            return this.keyboardEvent(options.eventType, key, modifiers);

          case 23:
            _iteratorNormalCompletion3 = true;
            _context17.next = 10;
            break;

          case 26:
            _context17.next = 32;
            break;

          case 28:
            _context17.prev = 28;
            _context17.t0 = _context17['catch'](8);
            _didIteratorError3 = true;
            _iteratorError3 = _context17.t0;

          case 32:
            _context17.prev = 32;
            _context17.prev = 33;

            if (!_iteratorNormalCompletion3 && _iterator3.return) {
              _iterator3.return();
            }

          case 35:
            _context17.prev = 35;

            if (!_didIteratorError3) {
              _context17.next = 38;
              break;
            }

            throw _iteratorError3;

          case 38:
            return _context17.finish(35);

          case 39:
            return _context17.finish(32);

          case 40:
          case 'end':
            return _context17.stop();
        }
      }
    }, _callee17, this, [[8, 28, 32, 40], [33,, 35, 39]]);
  }));

  return function (_x31, _x32) {
    return _ref18.apply(this, arguments);
  };
}();

/**
 * Select a value in an html select element.
 * @param {string} selector - The identifier for the select element.
 * @param {string} value - The value to select.
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.select = function () {
  var _ref19 = _asyncToGenerator(regeneratorRuntime.mark(function _callee18(selector, value, frameId) {
    var node;
    return regeneratorRuntime.wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            debug(`:: select => ${typeof value !== 'undefined' ? 'Set select value to "' + value + '"' : 'Get select value'} in the select matching selector "${selector}" for frame "${frameId || 'root'}"`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);

            _context18.next = 5;
            return this.querySelector(selector, frameId);

          case 5:
            node = _context18.sent;

            if (!(typeof value !== 'undefined')) {
              _context18.next = 10;
              break;
            }

            return _context18.abrupt('return', this.setNodeValue(node, value));

          case 10:
            return _context18.abrupt('return', this.getNodeValue(node));

          case 11:
          case 'end':
            return _context18.stop();
        }
      }
    }, _callee18, this);
  }));

  return function (_x33, _x34, _x35) {
    return _ref19.apply(this, arguments);
  };
}();

/**
 * Fire a key event.
 * @param {string} [type=keypress] - The type of key event.
 * @param {string} [key=null] - The key to use for the event.
 * @param {number} [modifier=0] - The keyboard modifier to use.
 * @see {@link https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchKeyEvent}
 */
exports.keyboardEvent = function () {
  var _ref20 = _asyncToGenerator(regeneratorRuntime.mark(function _callee19(type, key, modifier) {
    var windowsVirtualKeyCode = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;
    var parameters;
    return regeneratorRuntime.wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            debug(`:: keyboardEvent => Event type "${type}" | Key "${key}" | Modifier: "${modifier}"`);
            browserIsInitialized.call(this);

            type = typeof type === 'undefined' ? 'char' : type;
            key = typeof key === 'undefined' ? null : key;
            modifier = modifier || 0;

            parameters = {
              type: type,
              modifiers: modifier,
              text: key
            };

            if (windowsVirtualKeyCode) {
              parameters.windowsVirtualKeyCode = windowsVirtualKeyCode;
              parameters.nativeVirtualKeyCode = windowsVirtualKeyCode;
            }
            _context19.next = 9;
            return this.client.Input.dispatchKeyEvent(parameters);

          case 9:
          case 'end':
            return _context19.stop();
        }
      }
    }, _callee19, this);
  }));

  return function (_x37, _x38, _x39) {
    return _ref20.apply(this, arguments);
  };
}();

/**
 * Waits certain amount of ms
 * @param {number} time - Ammount of ms to wait
 */
exports.wait = function () {
  var _ref21 = _asyncToGenerator(regeneratorRuntime.mark(function _callee20(time) {
    return regeneratorRuntime.wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            debug(`:: wait => Waiting ${time} ms...`);
            browserIsInitialized.call(this);

            return _context20.abrupt('return', sleep(time));

          case 3:
          case 'end':
            return _context20.stop();
        }
      }
    }, _callee20, this);
  }));

  return function (_x40) {
    return _ref21.apply(this, arguments);
  };
}();

/**
 * Binding callback to handle console messages
 *
 * @param listener is a callback for handling console message
 *
 */
exports.onConsole = function () {
  var _ref22 = _asyncToGenerator(regeneratorRuntime.mark(function _callee21(listener) {
    return regeneratorRuntime.wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            debug(`:: onConsole => Binding new listener to console`);
            browserIsInitialized.call(this);

            this.on('onConsoleMessage', listener);

          case 3:
          case 'end':
            return _context21.stop();
        }
      }
    }, _callee21, this);
  }));

  return function (_x41) {
    return _ref22.apply(this, arguments);
  };
}();

/**
 * Waits for a page to finish loading. Throws error after timeout
 * @param {number} timeout - The timeout in ms. (Default: "loadPageTimeout" property in the browser instance options)
 */
exports.waitForPageToLoad = function () {
  var _ref23 = _asyncToGenerator(regeneratorRuntime.mark(function _callee22(timeout) {
    var _this2 = this;

    return regeneratorRuntime.wrap(function _callee22$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            debug(`:: waitForPageToLoad => Waiting page load...`);
            browserIsInitialized.call(this);

            return _context22.abrupt('return', promiseTimeout(new Promise(function (resolve, reject) {
              var listener = function listener() {
                debug(`:: waitForPageToLoad => Page loaded!`);
                _this2.removeListener('pageLoaded', listener);
                resolve(true);
              };
              _this2.on('pageLoaded', listener);
            }), timeout || this.options.browser.loadPageTimeout));

          case 3:
          case 'end':
            return _context22.stop();
        }
      }
    }, _callee22, this);
  }));

  return function (_x42) {
    return _ref23.apply(this, arguments);
  };
}();

/**
 * Waits for all the frames in the page to finish loading. Returns the list of frames after that
 * @param {regexp|string} url - The URL that must be waited for load
 * @return {object} - List of frames, with childFrames
 */
exports.waitForFrameToLoad = function () {
  var _ref24 = _asyncToGenerator(regeneratorRuntime.mark(function _callee23(url, timeout) {
    var _this3 = this;

    var frames, frame;
    return regeneratorRuntime.wrap(function _callee23$(_context23) {
      while (1) {
        switch (_context23.prev = _context23.next) {
          case 0:
            if (url) {
              _context23.next = 2;
              break;
            }

            throw new Error(`"url" parameter must be passed `);

          case 2:
            debug(`:: waitForFramesToLoad => Waiting page frame ${url} load...`);
            browserIsInitialized.call(this);

            _context23.next = 6;
            return this.getFrames();

          case 6:
            frames = _context23.sent;
            frame = _.find(frames, function (f) {
              if (typeof url === 'string' && f.url === url || typeof url !== 'string' && f.url.match(url)) {
                return f;
              }
            });

            if (frame) {
              _context23.next = 12;
              break;
            }

            _context23.next = 11;
            return promiseTimeout(new Promise(function (resolve, reject) {
              var listener = function listener(data) {
                debug(`:: waitForPageToLoad => Page loaded!`);
                _this3.removeListener('frameNavigated', listener);
                if (typeof url === 'string' && data.frame.url === url || typeof url !== 'string' && data.frame.url.match(url)) {
                  resolve(data.frame);
                }
              };
              _this3.on('frameNavigated', listener);
            }), timeout || this.options.browser.loadPageTimeout);

          case 11:
            frame = _context23.sent;

          case 12:
            return _context23.abrupt('return', frame);

          case 13:
          case 'end':
            return _context23.stop();
        }
      }
    }, _callee23, this);
  }));

  return function (_x43, _x44) {
    return _ref24.apply(this, arguments);
  };
}();

/**
 * Waits for a selector to finish loading. Throws error after timeout
 * @param {string} selector - The identifier for the select element.
 * @param {number} interval - The interval in ms. (Default: "loadPageTimeout" property in the browser instance options)
 * @param {number} timeout - The timeout in ms. (Default: "loadPageTimeout" property in the browser instance options)
 */
exports.waitForSelectorToLoad = function () {
  var _ref25 = _asyncToGenerator(regeneratorRuntime.mark(function _callee24(selector, interval, timeout) {
    var startDate, exists, diff;
    return regeneratorRuntime.wrap(function _callee24$(_context24) {
      while (1) {
        switch (_context24.prev = _context24.next) {
          case 0:
            debug(`:: waitForSelectorToLoad => Waiting selector "${selector}" load...`);
            browserIsInitialized.call(this);

            startDate = new Date().getTime();

          case 3:
            if (!true) {
              _context24.next = 19;
              break;
            }

            _context24.next = 6;
            return this.exist(selector);

          case 6:
            exists = _context24.sent;

            if (!(exists === true)) {
              _context24.next = 10;
              break;
            }

            debug(`:: waitForSelectorToLoad => Selector "${selector}" loaded!`);
            return _context24.abrupt('return');

          case 10:

            debug(`:: waitForSelectorToLoad => Selector "${selector}" hasn't loaded yet. Waiting ${interval || this.options.browser.loadSelectorInterval}ms...`);
            _context24.next = 13;
            return sleep(interval || this.options.browser.loadSelectorInterval);

          case 13:
            diff = new Date().getTime() - startDate;

            if (!(diff > (timeout || this.options.browser.loadSelectorTimeout))) {
              _context24.next = 17;
              break;
            }

            debug(`:: waitForSelectorToLoad => Timeout while trying to wait for selector "${selector}".`);
            throw new Error(`Timeout while trying to wait for selector "${selector}"`);

          case 17:
            _context24.next = 3;
            break;

          case 19:
          case 'end':
            return _context24.stop();
        }
      }
    }, _callee24, this);
  }));

  return function (_x45, _x46, _x47) {
    return _ref25.apply(this, arguments);
  };
}();

/**
 * Fire a mouse event.
 * @param {string} [type=mousePressed] - Type of the mouse event. Allowed values: mousePressed, mouseReleased, mouseMoved.
 * @param {number} [x=0] - X coordinate of the event relative to the main frame's viewport.
 * @param {number} [y=0] - Y coordinate of the event relative to the main frame's viewport. 0 refers to the top of the viewport and Y increases as it proceeds towards the bottom of the viewport.
 * @param {number} [modifier=0] - Bit field representing pressed modifier keys. Alt=1, Ctrl=2, Meta/Command=4, Shift=8 (default: 0).
 * @param {string} [button=left] - Mouse button (default: "none"). Allowed values: none, left, middle, right.
 * @see {@link https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-dispatchMouseEvent}
 */
exports.mouseEvent = function () {
  var _ref27 = _asyncToGenerator(regeneratorRuntime.mark(function _callee25(_ref26) {
    var _ref26$type = _ref26.type,
        type = _ref26$type === undefined ? 'mousePressed' : _ref26$type,
        _ref26$x = _ref26.x,
        x = _ref26$x === undefined ? 0 : _ref26$x,
        _ref26$y = _ref26.y,
        y = _ref26$y === undefined ? 0 : _ref26$y,
        _ref26$modifiers = _ref26.modifiers,
        modifiers = _ref26$modifiers === undefined ? 0 : _ref26$modifiers,
        _ref26$button = _ref26.button,
        button = _ref26$button === undefined ? 'left' : _ref26$button,
        _ref26$clickCount = _ref26.clickCount,
        clickCount = _ref26$clickCount === undefined ? 1 : _ref26$clickCount;
    return regeneratorRuntime.wrap(function _callee25$(_context25) {
      while (1) {
        switch (_context25.prev = _context25.next) {
          case 0:
            debug(`:: mouseEvent => Type "${type}" | (${x}; ${y}) | Modifiers: "${modifiers}" | Button: ${button}`);
            browserIsInitialized.call(this);

            _context25.next = 4;
            return this.client.Input.dispatchMouseEvent({ type, x, y, button, modifiers, clickCount });

          case 4:
          case 'end':
            return _context25.stop();
        }
      }
    }, _callee25, this);
  }));

  return function (_x48) {
    return _ref27.apply(this, arguments);
  };
}();

/**
 * Click on a selector by firing a 'click event' directly in the element of the selector
 * @param {string} selector - Selector of the element to click
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.click = function () {
  var _ref28 = _asyncToGenerator(regeneratorRuntime.mark(function _callee26(selector, frameId) {
    var node;
    return regeneratorRuntime.wrap(function _callee26$(_context26) {
      while (1) {
        switch (_context26.prev = _context26.next) {
          case 0:
            debug(`:: click => Click event on selector "${selector}"`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);

            _context26.next = 5;
            return this.querySelector(selector, frameId);

          case 5:
            node = _context26.sent;
            _context26.next = 8;
            return this.evaluateOnNode(node, function clickElement(selector) {
              document.querySelector(selector).click();
            }, selector);

          case 8:
          case 'end':
            return _context26.stop();
        }
      }
    }, _callee26, this);
  }));

  return function (_x49, _x50) {
    return _ref28.apply(this, arguments);
  };
}();

/**
 * Clicks left button hover the centroid of the element matching the passed selector
 * @param {string} [selector]
 * @param {string} frameId - The FrameID where the selector should be searched
 */
exports.clickOnSelector = function () {
  var _ref29 = _asyncToGenerator(regeneratorRuntime.mark(function _callee27(selector, frameId) {
    var node, nodeCentroid;
    return regeneratorRuntime.wrap(function _callee27$(_context27) {
      while (1) {
        switch (_context27.prev = _context27.next) {
          case 0:
            debug(`:: clickOnSelector => Mouse click in centroid of element with selector "${selector}" for frame "${frameId || 'root'}"`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);

            _context27.next = 5;
            return this.querySelector(selector, frameId);

          case 5:
            node = _context27.sent;
            _context27.next = 8;
            return this.getNodeCentroid(node.nodeId);

          case 8:
            nodeCentroid = _context27.sent;
            _context27.next = 11;
            return this.mouseEvent({
              type: 'mousePressed',
              x: nodeCentroid.x,
              y: nodeCentroid.y
            });

          case 11:
            _context27.next = 13;
            return this.mouseEvent({
              type: 'mouseReleased',
              x: nodeCentroid.x,
              y: nodeCentroid.y
            });

          case 13:
          case 'end':
            return _context27.stop();
        }
      }
    }, _callee27, this);
  }));

  return function (_x51, _x52) {
    return _ref29.apply(this, arguments);
  };
}();

/**
 * Calculates the centroid of a node by using the boxModel data of the element
 * @param {string} nodeId - The Node Id
 * @return {object} - { x, y } object with the coordinates
 */
exports.getNodeCentroid = function () {
  var _ref30 = _asyncToGenerator(regeneratorRuntime.mark(function _callee28(nodeId) {
    var boxModel;
    return regeneratorRuntime.wrap(function _callee28$(_context28) {
      while (1) {
        switch (_context28.prev = _context28.next) {
          case 0:
            debug(`:: getNodeCentroid => Get centroid coordinates for node "${nodeId}"`);
            browserIsInitialized.call(this);
            _context28.next = 4;
            return this.client.DOM.getBoxModel({ nodeId: nodeId });

          case 4:
            boxModel = _context28.sent;
            return _context28.abrupt('return', {
              x: parseInt((boxModel.model.content[0] + boxModel.model.content[2] + boxModel.model.content[4] + boxModel.model.content[6]) / 4),
              y: parseInt((boxModel.model.content[1] + boxModel.model.content[3] + boxModel.model.content[5] + boxModel.model.content[7]) / 4)
            });

          case 6:
          case 'end':
            return _context28.stop();
        }
      }
    }, _callee28, this);
  }));

  return function (_x53) {
    return _ref30.apply(this, arguments);
  };
}();

/**
 * Get the browser cookies
 * @return {object} - Object with all the cookies
 */
exports.getCookies = _asyncToGenerator(regeneratorRuntime.mark(function _callee29() {
  return regeneratorRuntime.wrap(function _callee29$(_context29) {
    while (1) {
      switch (_context29.prev = _context29.next) {
        case 0:
          debug(`:: getCookies => Return the browser cookies`);
          browserIsInitialized.call(this);

          return _context29.abrupt('return', this.client.Network.getCookies());

        case 3:
        case 'end':
          return _context29.stop();
      }
    }
  }, _callee29, this);
}));

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
exports.setCookie = function () {
  var _ref32 = _asyncToGenerator(regeneratorRuntime.mark(function _callee30(name, value) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var setCookieOptions;
    return regeneratorRuntime.wrap(function _callee30$(_context30) {
      while (1) {
        switch (_context30.prev = _context30.next) {
          case 0:
            debug(`:: setCookie => Setting browser cookie "${name}" with value "${value}". Additional options: ${options}`);
            browserIsInitialized.call(this);

            setCookieOptions = Object.assign({ name, value }, options);
            return _context30.abrupt('return', this.client.Network.setCookie(setCookieOptions));

          case 4:
          case 'end':
            return _context30.stop();
        }
      }
    }, _callee30, this);
  }));

  return function (_x55, _x56) {
    return _ref32.apply(this, arguments);
  };
}();

/**
 * Clear the browser cookies
 */
exports.clearBrowserCookies = _asyncToGenerator(regeneratorRuntime.mark(function _callee31() {
  return regeneratorRuntime.wrap(function _callee31$(_context31) {
    while (1) {
      switch (_context31.prev = _context31.next) {
        case 0:
          debug(`:: clearBrowserCookies => Clearing browser cookies`);
          browserIsInitialized.call(this);

          return _context31.abrupt('return', this.client.Network.clearBrowserCookies());

        case 3:
        case 'end':
          return _context31.stop();
      }
    }
  }, _callee31, this);
}));

/**
 * Checks if an element matches the selector
 * @param {string} selector - The selector string
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {boolean} - Boolean indicating if element of selector exists or not
 */
// TODO: make use of the "frameId" parameter in this fn, and avoid using this.evaluate()
exports.exist = function () {
  var _ref34 = _asyncToGenerator(regeneratorRuntime.mark(function _callee32(selector, frameId) {
    var exist;
    return regeneratorRuntime.wrap(function _callee32$(_context32) {
      while (1) {
        switch (_context32.prev = _context32.next) {
          case 0:
            debug(`:: exist => Exist element with selector "${selector}" for frame "${frameId || 'root'}"?`);
            browserIsInitialized.call(this);
            selector = fixSelector(selector);

            _context32.next = 5;
            return this.evaluate(function (selector) {
              return !!document.querySelector(selector);
            }, selector);

          case 5:
            exist = _context32.sent;


            debug(`:: exist => Exist: "${exist.result.value}"`);

            return _context32.abrupt('return', exist.result.value);

          case 8:
          case 'end':
            return _context32.stop();
        }
      }
    }, _callee32, this);
  }));

  return function (_x57, _x58) {
    return _ref34.apply(this, arguments);
  };
}();

/**
 * Checks if an element matching a selector is visible
 * @param {string} selector - The selector string
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {boolean} - Boolean indicating if element of selector is visible or not
 */
// TODO: make use of the "frameId" parameter in this fn, and avoid using this.evaluate()
exports.visible = function () {
  var _ref35 = _asyncToGenerator(regeneratorRuntime.mark(function _callee33(selector, frameId) {
    var visible;
    return regeneratorRuntime.wrap(function _callee33$(_context33) {
      while (1) {
        switch (_context33.prev = _context33.next) {
          case 0:
            debug(`:: visible => Visible element with selector "${selector}" for frame "${frameId || 'root'}"?`);
            browserIsInitialized.call(this);

            visible = this.evaluate(function (selector) {
              var el = document.querySelector(selector);
              var style = void 0;
              try {
                style = window.getComputedStyle(el, null);
              } catch (e) {
                return false;
              }
              if (style.visibility === 'hidden' || style.display === 'none') {
                return false;
              }
              if (style.display === 'inline' || style.display === 'inline-block') {
                return true;
              }
              return el.clientHeight > 0 && el.clientWidth > 0;
            }, selector);


            debug(`:: visible => Visible: "${visible.result.value}"`);

            return _context33.abrupt('return', visible.result.value);

          case 5:
          case 'end':
            return _context33.stop();
        }
      }
    }, _callee33, this);
  }));

  return function (_x59, _x60) {
    return _ref35.apply(this, arguments);
  };
}();

/**
 * Start screencast
 */
exports.startScreencast = _asyncToGenerator(regeneratorRuntime.mark(function _callee34() {
  return regeneratorRuntime.wrap(function _callee34$(_context34) {
    while (1) {
      switch (_context34.prev = _context34.next) {
        case 0:
          debug(`:: startScreencast => Starting screencast...`);
          browserIsInitialized.call(this);
          _context34.next = 4;
          return this.client.Page.startScreencast();

        case 4:
          debug(`:: startScreencast => Screencast started!`);

        case 5:
        case 'end':
          return _context34.stop();
      }
    }
  }, _callee34, this);
}));

/**
 * Stop screencast
 */
exports.stopScreencast = _asyncToGenerator(regeneratorRuntime.mark(function _callee35() {
  return regeneratorRuntime.wrap(function _callee35$(_context35) {
    while (1) {
      switch (_context35.prev = _context35.next) {
        case 0:
          debug(`:: stopScreencast => Stopping screencast...`);
          browserIsInitialized.call(this);
          _context35.next = 4;
          return this.client.Page.stopScreencast();

        case 4:
          debug(`:: stopScreencast => Screencast stopped!`);

        case 5:
        case 'end':
          return _context35.stop();
      }
    }
  }, _callee35, this);
}));

/**
 * Start screencast
 */
exports.saveScreencast = function () {
  var _ref38 = _asyncToGenerator(regeneratorRuntime.mark(function _callee37(fileName) {
    var _this4 = this;

    return regeneratorRuntime.wrap(function _callee37$(_context37) {
      while (1) {
        switch (_context37.prev = _context37.next) {
          case 0:
            debug(`:: saveScreencast => Save screencast...`);
            browserIsInitialized.call(this);

            this.client.Page.screencastFrame(function () {
              var _ref39 = _asyncToGenerator(regeneratorRuntime.mark(function _callee36(frame) {
                var frameData, screenshot, metadata, frameNumber;
                return regeneratorRuntime.wrap(function _callee36$(_context36) {
                  while (1) {
                    switch (_context36.prev = _context36.next) {
                      case 0:
                        frameData = frame.data;
                        screenshot = Buffer.from(frameData, 'base64');
                        metadata = frame.metadata;
                        frameNumber = frame.sessionId;

                        console.log(frameNumber, metadata);
                        _context36.next = 7;
                        return fs.writeFile(`${fileName}-${frameNumber}-${metadata.timestamp}.png`, screenshot);

                      case 7:
                      case 'end':
                        return _context36.stop();
                    }
                  }
                }, _callee36, _this4);
              }));

              return function (_x62) {
                return _ref39.apply(this, arguments);
              };
            }());

            debug(`:: startScreencast => Screencast started!`);

          case 4:
          case 'end':
            return _context37.stop();
        }
      }
    }, _callee37, this);
  }));

  return function (_x61) {
    return _ref38.apply(this, arguments);
  };
}();

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
exports.getScreenshot = function () {
  var _ref41 = _asyncToGenerator(regeneratorRuntime.mark(function _callee38(_ref40) {
    var _ref40$format = _ref40.format,
        format = _ref40$format === undefined ? 'png' : _ref40$format,
        quality = _ref40.quality,
        _ref40$clip = _ref40.clip,
        clip = _ref40$clip === undefined ? {
      x: 0,
      y: 0,
      width: this.options.deviceMetrics.width,
      height: this.options.deviceMetrics.height,
      scale: this.options.deviceMetrics.deviceScaleFactor
    } : _ref40$clip,
        fromSurface = _ref40.fromSurface,
        selector = _ref40.selector,
        fullPage = _ref40.fullPage;
    var returnBinary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var screenshotSettings, screenshot;
    return regeneratorRuntime.wrap(function _callee38$(_context38) {
      while (1) {
        switch (_context38.prev = _context38.next) {
          case 0:
            debug(`:: getScreenshot => Taking a screenshot of the ${selector ? 'selector "' + selector + '"' : 'page'}. Returning as ${returnBinary ? 'binary' : 'base64'} string`);
            browserIsInitialized.call(this);

            format = format.toLowerCase();
            if (format === 'jpg') {
              format = 'jpeg';
            }

            // Validate screenshot format

            if (!(format !== 'jpeg' && format !== 'png')) {
              _context38.next = 6;
              break;
            }

            throw new Error(`Invalid format "${format}" for the screenshot. Allowed values: "jpeg" and "png".`);

          case 6:
            screenshotSettings = {
              format,
              quality,
              fromSurface: true

              // If fullPage parameter is on, then resize the screen to full size
            };

            if (!(fullPage === true)) {
              _context38.next = 11;
              break;
            }

            _context38.next = 10;
            return this.resizeFullScreen();

          case 10:
            screenshotSettings.clip = _context38.sent;

          case 11:
            if (!selector) {
              _context38.next = 15;
              break;
            }

            _context38.next = 14;
            return this.getSelectorViewport(selector);

          case 14:
            screenshotSettings.clip = _context38.sent;

          case 15:
            _context38.next = 17;
            return this.client.Page.captureScreenshot(screenshotSettings);

          case 17:
            screenshot = _context38.sent.data;


            if (returnBinary) {
              screenshot = Buffer.from(screenshot, 'base64');
            }
            debug(`:: getScreenshot => Screenshot took!`);

            return _context38.abrupt('return', screenshot);

          case 21:
          case 'end':
            return _context38.stop();
        }
      }
    }, _callee38, this);
  }));

  return function (_x64) {
    return _ref41.apply(this, arguments);
  };
}();

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
exports.saveScreenshot = _asyncToGenerator(regeneratorRuntime.mark(function _callee39() {
  var fileName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : `screenshot-${Date.now()}`;

  var _ref43 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref43$format = _ref43.format,
      format = _ref43$format === undefined ? 'png' : _ref43$format,
      quality = _ref43.quality,
      clip = _ref43.clip,
      fromSurface = _ref43.fromSurface,
      selector = _ref43.selector,
      fullPage = _ref43.fullPage;

  return regeneratorRuntime.wrap(function _callee39$(_context39) {
    while (1) {
      switch (_context39.prev = _context39.next) {
        case 0:
          debug(`:: saveScreenshot => Saving a screenshot of the  ${selector ? 'selector "' + selector + '"' : 'page'}...`);
          browserIsInitialized.call(this);

          format = format.toLowerCase();
          if (format === 'jpg') {
            format = 'jpeg';
          }

          // Validate screenshot format

          if (!(format !== 'jpeg' && format !== 'png')) {
            _context39.next = 6;
            break;
          }

          throw new Error(`Invalid format "${format}" for the screenshot. Allowed values: "jpeg" and "png".`);

        case 6:
          _context39.t0 = fs;
          _context39.next = 9;
          return this.getScreenshot({
            format,
            quality,
            clip,
            fromSurface,
            selector,
            fullPage
          });

        case 9:
          _context39.t1 = _context39.sent;
          _context39.next = 12;
          return _context39.t0.writeFile.call(_context39.t0, `${fileName}.${format}`, _context39.t1, true);

        case 12:
          debug(`:: saveScreenshot => Screenshot saved!`);
          return _context39.abrupt('return', `${fileName}.${format}`);

        case 14:
        case 'end':
          return _context39.stop();
      }
    }
  }, _callee39, this);
}));

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
exports.printToPDF = _asyncToGenerator(regeneratorRuntime.mark(function _callee40() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var returnBinary = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var pdf;
  return regeneratorRuntime.wrap(function _callee40$(_context40) {
    while (1) {
      switch (_context40.prev = _context40.next) {
        case 0:
          debug(`:: printToPDF => Printing page to PDF with options: ${JSON.stringify(options, null, 2)}. Returning as ${returnBinary ? 'binary' : 'base64'} string`);
          browserIsInitialized.call(this);
          _context40.next = 4;
          return this.client.Page.printToPDF(options);

        case 4:
          pdf = _context40.sent.data;


          if (returnBinary) {
            pdf = Buffer.from(pdf, 'base64');
          }

          return _context40.abrupt('return', pdf);

        case 7:
        case 'end':
          return _context40.stop();
      }
    }
  }, _callee40, this);
}));

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
exports.savePdf = _asyncToGenerator(regeneratorRuntime.mark(function _callee41() {
  var fileName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : `pdf-${Date.now()}`;
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return regeneratorRuntime.wrap(function _callee41$(_context41) {
    while (1) {
      switch (_context41.prev = _context41.next) {
        case 0:
          debug(`:: savePdf => Saving a PDF of the page...`);
          browserIsInitialized.call(this);

          _context41.t0 = fs;
          _context41.next = 5;
          return this.printToPDF(options, true);

        case 5:
          _context41.t1 = _context41.sent;
          _context41.next = 8;
          return _context41.t0.writeFile.call(_context41.t0, `${fileName}.pdf`, _context41.t1);

        case 8:
          debug(`:: savePdf => PDF saved!`);
          return _context41.abrupt('return', `${fileName}.pdf`);

        case 10:
        case 'end':
          return _context41.stop();
      }
    }
  }, _callee41, this);
}));

/**
 * Get the Viewport of the element matching a selector
 * @param {string} selector - The selector string
 * @param {string} frameId - The FrameID where the selector should be searched
 * @return {Viewport} - Object with the viewport properties (https://chromedevtools.github.io/devtools-protocol/tot/Page/#type-Viewport)
 */
exports.getSelectorViewport = function () {
  var _ref46 = _asyncToGenerator(regeneratorRuntime.mark(function _callee42(selector, frameId) {
    var node, boxModel, viewport;
    return regeneratorRuntime.wrap(function _callee42$(_context42) {
      while (1) {
        switch (_context42.prev = _context42.next) {
          case 0:
            debug(`:: getSelectorViewport => Getting viewport for element with selector "${selector}" for frame "${frameId || 'root'}"?`);
            browserIsInitialized.call(this);

            selector = fixSelector(selector);

            _context42.next = 5;
            return this.querySelector(selector, frameId);

          case 5:
            node = _context42.sent;
            _context42.next = 8;
            return this.client.DOM.getBoxModel({ nodeId: node.nodeId });

          case 8:
            boxModel = _context42.sent;
            viewport = {
              x: boxModel.model.margin[0],
              y: boxModel.model.margin[1],
              width: boxModel.model.width,
              height: boxModel.model.height,
              scale: this.options.deviceMetrics.deviceScaleFactor
            };


            debug(`:: getSelectorViewport => Viewport: "${viewport}"`);

            return _context42.abrupt('return', viewport);

          case 12:
          case 'end':
            return _context42.stop();
        }
      }
    }, _callee42, this);
  }));

  return function (_x71, _x72) {
    return _ref46.apply(this, arguments);
  };
}();

/**
 * Get the list of frames in the loaded page
 * @return {object} - List of frames, with childFrames
 */
exports.getFrames = _asyncToGenerator(regeneratorRuntime.mark(function _callee43() {
  var frames, resourceTree;
  return regeneratorRuntime.wrap(function _callee43$(_context43) {
    while (1) {
      switch (_context43.prev = _context43.next) {
        case 0:
          debug(`:: getFrames => Getting frames list`);
          browserIsInitialized.call(this);
          frames = [];
          _context43.next = 5;
          return this.client.Page.getResourceTree();

        case 5:
          resourceTree = _context43.sent;

          frames.push(resourceTree.frameTree.frame);
          _.each(resourceTree.frameTree.childFrames, function (frameObj) {
            frames.push(frameObj.frame);
          });
          return _context43.abrupt('return', frames);

        case 9:
        case 'end':
          return _context43.stop();
      }
    }
  }, _callee43, this);
}));

/**
 * Resize viewports of the page to full screen size
 */
exports.resizeFullScreen = _asyncToGenerator(regeneratorRuntime.mark(function _callee44() {
  var _client, DOM, Emulation, _ref49, documentNodeId, _ref50, bodyNodeId, deviceMetrics, _ref51, height, fullPageViewport;

  return regeneratorRuntime.wrap(function _callee44$(_context44) {
    while (1) {
      switch (_context44.prev = _context44.next) {
        case 0:
          debug(`:: resizeFullScreen => Resizing viewport to full screen size`);
          _client = this.client, DOM = _client.DOM, Emulation = _client.Emulation;
          _context44.next = 4;
          return DOM.getDocument();

        case 4:
          _ref49 = _context44.sent;
          documentNodeId = _ref49.root.nodeId;
          _context44.next = 8;
          return DOM.querySelector({
            selector: 'body',
            nodeId: documentNodeId
          });

        case 8:
          _ref50 = _context44.sent;
          bodyNodeId = _ref50.nodeId;
          _context44.next = 12;
          return this.options.deviceMetrics;

        case 12:
          deviceMetrics = _context44.sent;
          _context44.next = 15;
          return DOM.getBoxModel({ nodeId: bodyNodeId });

        case 15:
          _ref51 = _context44.sent;
          height = _ref51.model.height;
          _context44.next = 19;
          return Emulation.setDeviceMetricsOverride({
            width: deviceMetrics.width,
            height: height,
            deviceScaleFactor: deviceMetrics.deviceScaleFactor,
            mobile: deviceMetrics.mobile
          });

        case 19:
          _context44.next = 21;
          return this.client.Emulation.setVisibleSize({
            width: deviceMetrics.width,
            height: height
          });

        case 21:
          _context44.next = 23;
          return Emulation.setPageScaleFactor({ pageScaleFactor: deviceMetrics.deviceScaleFactor });

        case 23:
          fullPageViewport = {
            x: 0,
            y: 0,
            width: deviceMetrics.width,
            height: height,
            scale: deviceMetrics.deviceScaleFactor
          };
          return _context44.abrupt('return', fullPageViewport);

        case 25:
        case 'end':
          return _context44.stop();
      }
    }
  }, _callee44, this);
}));

/**
 * Accepts or dismisses a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload)
 * @param {boolean} [accept=true] - Whether to accept or dismiss the dialog
 * @param {string} [promptText] - The text to enter into the dialog prompt before accepting. Used only if this is a prompt dialog.
 */
exports.handleDialog = _asyncToGenerator(regeneratorRuntime.mark(function _callee45() {
  var accept = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  var promptText = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
  return regeneratorRuntime.wrap(function _callee45$(_context45) {
    while (1) {
      switch (_context45.prev = _context45.next) {
        case 0:
          debug(`:: handleDialog => Handling dialog on the page...`);
          browserIsInitialized.call(this);
          _context45.next = 4;
          return this.client.Page.handleJavaScriptDialog({
            accept,
            promptText
          });

        case 4:
          debug(`:: handleDialog => Dialog handled!`);

        case 5:
        case 'end':
          return _context45.stop();
      }
    }
  }, _callee45, this);
}));

/**
 * Post data from the browser context
 * @param {string} url - The URL or path to POST to
 * @param {object} [data] - The data object to be posted
 * @param {object} [options] - Options of the request
 * @return {object} - Request status and data
 */
exports.post = function () {
  var _ref53 = _asyncToGenerator(regeneratorRuntime.mark(function _callee46(url) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var requestData, requestOptions;
    return regeneratorRuntime.wrap(function _callee46$(_context46) {
      while (1) {
        switch (_context46.prev = _context46.next) {
          case 0:
            debug(`:: post => Posting on URL "${url}" data: ${JSON.stringify(data, null, 2)} with options ${options}...`);
            browserIsInitialized.call(this);

            if (url) {
              _context46.next = 4;
              break;
            }

            throw new Error(`An URL must be supplied in order to make the POST request`);

          case 4:
            requestData = data;

            if (typeof data === 'object') {
              requestData = objectToEncodedUri(data);
            }

            requestOptions = Object.assign({
              contentType: 'application/x-www-form-urlencoded',
              timeout: this.options.browser.loadPageTimeout
            }, options);
            return _context46.abrupt('return', this.evaluateAsync(function (url, data, options) {
              return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', url);
                xhr.setRequestHeader('Content-Type', options.contentType);
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
                  });
                };
                xhr.onerror = function (e) {
                  var error = new Error(`Error while making request POST to URL "${url}"`);
                  error.requestData = data;
                  error.options = options;
                  error.response = {
                    responseText: xhr.responseText,
                    status: xhr.status,
                    response: xhr.response,
                    responseType: xhr.responseType,
                    responseURL: xhr.responseURL,
                    statusText: xhr.statusText,
                    responseXML: xhr.responseXML,
                    readyState: xhr.readyState
                  };
                  reject(error);
                };
                data ? xhr.send(data) : xhr.send();
              });
            }, url, requestData, requestOptions));

          case 8:
          case 'end':
            return _context46.stop();
        }
      }
    }, _callee46, this);
  }));

  return function (_x77) {
    return _ref53.apply(this, arguments);
  };
}();