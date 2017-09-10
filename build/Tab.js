'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = require('debug')('HeadlessChrome:tab');

var EventEmitter = require('events');

var chrome = require('./chrome');
var setupHandlers = require('./setupHandlers');
var setupViewport = require('./setupViewport');
var setupActions = require('./setupActions');

var Tab = function (_EventEmitter) {
  _inherits(Tab, _EventEmitter);

  function Tab(host, port, tabOptions, browserInstance) {
    _classCallCheck(this, Tab);

    var _this = _possibleConstructorReturn(this, (Tab.__proto__ || Object.getPrototypeOf(Tab)).call(this));

    EventEmitter.call(_this);
    _this._host = host;
    _this._port = port;
    _this._tabOptions = tabOptions;
    _this._browser = browserInstance;

    // Get the browser actions options
    _this.options = {
      browser: browserInstance.options.browser,
      deviceMetrics: browserInstance.options.deviceMetrics
    };
    return _this;
  }

  _createClass(Tab, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var Target, params;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                debug(`:: init => Initializating new tab...`);
                Target = this._browser.client.Target;

                /**
                 * Creates new tab and assign it with CDP
                 */

                _context.prev = 2;
                params = {
                  url: this._tabOptions.startingUrl

                  /**
                   * Creates private BrowserContext (if needed)
                   * NOTE: private tabs can only be created in headless mode
                   */
                };

                if (!this._tabOptions.privateTab) {
                  _context.next = 10;
                  break;
                }

                if (this._browser.options.headless) {
                  _context.next = 7;
                  break;
                }

                throw new Error(`Can't open a private target/tab if browser is not in headless mode`);

              case 7:
                _context.next = 9;
                return Target.createBrowserContext();

              case 9:
                this._privateTab = params.browserContextId = _context.sent;

              case 10:
                _context.next = 12;
                return Target.createTarget(params);

              case 12:
                this._target = _context.sent;


                // Get the target/tab ID
                this._targetId = this._target.targetId;

                // Attach the tab to the CDP
                debug(`:: init => Attaching tab "${this._targetId}" to the CDP...`);
                _context.next = 17;
                return chrome.attachCdpToTarget(this._host, this._port, this._targetId);

              case 17:
                this.client = _context.sent;


                // Setup Actions, Handlers and Viewport
                debug(`:: init => Preparing Actions, Handlers and Viewport for tab "${this._targetId}"...`);
                _context.next = 21;
                return setupHandlers.call(this);

              case 21:
                _context.next = 23;
                return setupViewport.call(this);

              case 23:
                setupActions.call(this);

                debug(`:: init => Tab "${this._targetId}" initialized successfully!`);

                return _context.abrupt('return', this);

              case 28:
                _context.prev = 28;
                _context.t0 = _context['catch'](2);

                debug(`:: init => Could not initialize new target/tab. Error code: ${_context.t0.code}`, _context.t0);
                if (this._targetId) {
                  Target.closeTarget(this._targetId);
                }
                if (this._privateTab) {
                  Target.disposeBrowserContext(this._privateTab);
                }
                throw _context.t0;

              case 34:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[2, 28]]);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }()

    /**
     * Tells if the target/tab is initializated
     */

  }, {
    key: 'isInitialized',
    value: function isInitialized() {
      return !!this.client;
    }

    /**
     * Tells if the target/tab is a private tab
     */

  }, {
    key: 'isPrivate',
    value: function isPrivate() {
      return typeof this._privateTab !== 'undefined';
    }

    /**
     * Tells the targe/tab ID
     */

  }, {
    key: 'getId',
    value: function getId() {
      return this._targetId;
    }

    /**
     * Tells the private tab BrowserContext id
     */

  }, {
    key: 'getBrowserContextId',
    value: function getBrowserContextId() {
      if (this._privateTab) {
        return this._privateTab.browserContextId;
      }
    }

    /**
     * Support attaching actions
     * @param {String} name - Method name
     * @param {Function} fn - Method implementation
     */

  }, {
    key: 'addAction',
    value: function addAction(name, fn) {
      if (typeof fn === 'function') {
        this[name] = fn;
      }
      return this;
    }
  }, {
    key: 'close',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var Target, tabId, tabContextId;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                debug(`:: close => Closing target/tab "${this._targetId}"...`);

                if (this.isInitialized()) {
                  _context2.next = 3;
                  break;
                }

                throw new Error(`Cannot close a tab that it's not initialized`);

              case 3:
                Target = this._browser.client.Target;
                tabId = this.getId();
                _context2.prev = 5;
                _context2.next = 8;
                return Target.closeTarget({ targetId: tabId });

              case 8:
                if (!this.isPrivate()) {
                  _context2.next = 12;
                  break;
                }

                tabContextId = this.getBrowserContextId();
                _context2.next = 12;
                return Target.disposeBrowserContext({ browserContextId: tabContextId });

              case 12:

                this._closedAt = new Date().toISOString();
                this.client = false;

                // Tell the browser instance that a target/tab was closed
                this._browser._closeTarget(tabId);

                debug(`:: close => Target/tab "${this._targetId}" closed successfully!`);
                return _context2.abrupt('return', true);

              case 19:
                _context2.prev = 19;
                _context2.t0 = _context2['catch'](5);

                _context2.t0.message = `There was a problem closing target/tab. ${_context2.t0.message}`;
                _context2.t0.tabId = tabId;
                throw _context2.t0;

              case 24:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[5, 19]]);
      }));

      function close() {
        return _ref2.apply(this, arguments);
      }

      return close;
    }()

    /**
     * Logs a text in the console
     * @param {string} text - The text to log
     */

  }, {
    key: 'log',
    value: function log(text) {
      console.log(`[Tab ID: ${this._targetId}] ${text}`);
      return this;
    }

    /**
     * Logs a text in the console, only in debug mode
     * @param {string} text - The text to log
     */

  }, {
    key: 'debugLog',
    value: function debugLog(text) {
      debug(`[Tab ID: ${this._targetId}] ${text}`);
      return this;
    }
  }]);

  return Tab;
}(EventEmitter);

module.exports = Tab;