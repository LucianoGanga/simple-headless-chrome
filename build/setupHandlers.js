'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var debug = require('debug')('HeadlessChrome:handlers');

var networkEvents = require('./events/network');
module.exports = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var _this = this;

    var Page, Log;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            debug(`Setting up handlers...`);
            Page = this.client.Page;
            Log = this.client.Log;

            /**
             * Prepare the browser console events, if needed
             */

            if (!(typeof this.options.browser.browserLog === 'function')) {
              _context.next = 10;
              break;
            }

            debug(`-- Browser Log status: ON! Log Entries will be received in the passed custom fn: ${this.options.browser.browserLog}`);
            _context.next = 7;
            return Log.enable();

          case 7:
            Log.entryAdded(this.options.browser.browserLog);
            _context.next = 18;
            break;

          case 10:
            if (!(this.options.browser.browserLog === true)) {
              _context.next = 17;
              break;
            }

            debug(`-- Browser Log status: ON`);
            _context.next = 14;
            return Log.enable();

          case 14:
            Log.entryAdded(_browserLog);
            _context.next = 18;
            break;

          case 17:
            debug(`-- Browser Log status: OFF`);

          case 18:
            _context.next = 20;
            return networkEvents.call(this);

          case 20:

            /**
            * If api method type is log then emit onConsoleMessage event;
            */
            this.client.Runtime.consoleAPICalled(function () {
              for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
                params[_key] = arguments[_key];
              }

              debug.apply(undefined, [`-- Added something in console `].concat(params));
              if (params[0].type === 'log') {
                _this.emit('onConsoleMessage', params[0].args);
              }
            });
            this.client.Runtime.enable();

            Page.loadEventFired(function () {
              for (var _len2 = arguments.length, params = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                params[_key2] = arguments[_key2];
              }

              debug.apply(undefined, ['-- Page.loadEventFired \r\n'].concat(params));
              // Page.addScriptToEvaluateOnLoad
              _this.emit.apply(_this, ['pageLoaded'].concat(params));
            });

            Page.domContentEventFired(function () {
              for (var _len3 = arguments.length, params = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                params[_key3] = arguments[_key3];
              }

              debug.apply(undefined, ['-- Page.domContentEventFired \r\n'].concat(params));
              _this.emit.apply(_this, ['domContentEventFired'].concat(params));
            });

            Page.frameAttached(function () {
              for (var _len4 = arguments.length, params = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                params[_key4] = arguments[_key4];
              }

              debug.apply(undefined, ['-- Page.frameAttached: '].concat(params));
              _this.emit.apply(_this, ['frameAttached'].concat(params));
            });

            Page.frameNavigated(function () {
              for (var _len5 = arguments.length, params = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                params[_key5] = arguments[_key5];
              }

              debug.apply(undefined, ['-- Page.frameNavigated: '].concat(params));
              _this.emit.apply(_this, ['frameNavigated'].concat(params));
            });

            Page.frameStartedLoading(function () {
              for (var _len6 = arguments.length, params = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                params[_key6] = arguments[_key6];
              }

              debug.apply(undefined, ['-- Page.frameStartedLoading'].concat(params));
              _this.emit.apply(_this, ['frameStartedLoading'].concat(params));
            });

            /**
             * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) is about to open.
             * @param {string} message - Message that will be displayed by the dialog.
             * @param {string} type - Dialog type (Allowed values: alert, confirm, prompt, beforeunload)
             */
            Page.javascriptDialogOpening(function () {
              for (var _len7 = arguments.length, params = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
                params[_key7] = arguments[_key7];
              }

              debug.apply(undefined, ['-- Page.javascriptDialogOpening'].concat(params));
              _this.emit.apply(_this, ['dialogOpening'].concat(params));
            });

            /**
             * Fired when a JavaScript initiated dialog (alert, confirm, prompt, or onbeforeunload) has been closed.
             * @return {boolean} result - Whether dialog was confirmed.
             */
            Page.javascriptDialogClosed(function () {
              for (var _len8 = arguments.length, params = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
                params[_key8] = arguments[_key8];
              }

              debug.apply(undefined, ['-- Page.javascriptDialogClosed'].concat(params));
              _this.emit.apply(_this, ['dialogClosed'].concat(params));
            });

            this.client.DOM.documentUpdated(function () {
              for (var _len9 = arguments.length, params = Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
                params[_key9] = arguments[_key9];
              }

              debug.apply(undefined, ['-- DOM.documentUpdated'].concat(params));
              _this.emit.apply(_this, ['documentUpdated'].concat(params));
            });

          case 30:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function setupHandlers() {
    return _ref.apply(this, arguments);
  }

  return setupHandlers;
}();

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

function _browserLog(d) {
  switch (d.entry.level) {
    case 'verbose':
      console.log(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
    case 'info':
      console.info(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
    case 'warning':
      console.warn(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
    case 'error':
      console.error(`Browser says: [${d.entry.level}] [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
    default:
      console.log(`Browser says: [${d.entry.source}] ${d.entry.text}`, d.entry);
      break;
  }
}