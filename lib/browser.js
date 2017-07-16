'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

/**
 * Launches a debugging instance of Chrome on port 9222.
 * @param {boolean=} headless True (default) to launch Chrome in headless mode.
 *     Set to false to launch Chrome normally.
 * @return {object} - Chrome instance data
 *    @property {number} pid - The Process ID used by the Chrome instance
 *    @property {number} port - The port used by the Chrome instance
 *    @property {async fn} kill - Fn to kill the Chrome instance
 */
var _launchChrome = function () {
  var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(_ref3) {
    var _ref3$headless = _ref3.headless,
        headless = _ref3$headless === undefined ? true : _ref3$headless,
        _ref3$disableGPU = _ref3.disableGPU,
        disableGPU = _ref3$disableGPU === undefined ? true : _ref3$disableGPU,
        _ref3$port = _ref3.port,
        port = _ref3$port === undefined ? 0 : _ref3$port,
        launchAttempts = _ref3.launchAttempts,
        handleSIGINT = _ref3.handleSIGINT;
    var chromeOptions, attempt, instance;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            debug(`Launching Chrome instance. Headless: ${headless === true ? 'YES' : 'NO'}`);

            chromeOptions = {
              port: port,
              handleSIGINT: handleSIGINT,
              chromeFlags: [disableGPU ? '--disable-gpu' : '', '--enable-logging', headless ? '--headless' : '']
            };
            attempt = 0;
            instance = void 0;

          case 4:
            if (!(!instance && attempt++ < launchAttempts)) {
              _context3.next = 25;
              break;
            }

            debug(`Launching Chrome. Attempt ${attempt}/${launchAttempts}...`);
            _context3.prev = 6;
            _context3.next = 9;
            return chromeLauncher.launch(chromeOptions);

          case 9:
            instance = _context3.sent;
            _context3.next = 23;
            break;

          case 12:
            _context3.prev = 12;
            _context3.t0 = _context3['catch'](6);

            debug(`Can not launch Chrome in attempt ${attempt}/${launchAttempts}. Error code: ${_context3.t0.code}`, _context3.t0);

            if (!(_context3.t0.code === 'EAGAIN' || _context3.t0.code === 'ECONNREFUSED')) {
              _context3.next = 22;
              break;
            }

            _context3.next = 18;
            return sleep(1000 * attempt);

          case 18:
            if (!(attempt >= launchAttempts)) {
              _context3.next = 20;
              break;
            }

            throw _context3.t0;

          case 20:
            _context3.next = 23;
            break;

          case 22:
            throw _context3.t0;

          case 23:
            _context3.next = 4;
            break;

          case 25:
            if (instance) {
              _context3.next = 27;
              break;
            }

            throw new Error(`Can't not launch Chrome! (attempts: ${attempt - 1}/${launchAttempts})`);

          case 27:

            debug(`Chrome instance launched in port "${instance.port}", pid "${instance.pid}"`);

            return _context3.abrupt('return', instance);

          case 29:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[6, 12]]);
  }));

  return function _launchChrome(_x2) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * Attach the Chrome Debugging Protocol to a Chrome instance in given host:port combination
 * Attaching CDP allows the use of a wide browser's methods.
 * @See https://chromedevtools.github.io/devtools-protocol/ for more info
 * @param {string} host - The host of the Chrome instance
 * @param {number} port - The port number of the Chrome instance
 * @param {boolean} remote - A boolean indicating whether the protocol must be fetched remotely or if the local version must be used
 */

var _attachCdpToChrome = function () {
  var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
    var host = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'localhost';
    var port = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 9222;
    var remote = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var _client, Network, Page, DOM, CSS;

    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            debug(`Preparing Chrome Debugging Protocol (CDP) for host "${host}" and port "${port}"...`);

            _context4.next = 3;
            return new CDP({
              host: host,
              port: port,
              remote: remote
            });

          case 3:
            _client = this.client = _context4.sent;
            Network = _client.Network;
            Page = _client.Page;
            DOM = _client.DOM;
            CSS = _client.CSS;


            debug('CDP prepared! Setting up browser abrstraction...');

            /**
             * Enable Domains "Network", "Page", "DOM" and "CSS" in the client
             */
            _context4.next = 11;
            return Promise.all([Network.enable(), Page.enable(), DOM.enable(), CSS.enable()]);

          case 11:

            /**
             * Setup handlers
             */
            setupHandlers.call(this);

            /**
             * Setup viewport
             */
            _context4.next = 14;
            return setupViewport.call(this);

          case 14:

            /**
             * Setup Actions
             */
            setupActions.call(this);

            debug('CDP setting up completed! All handlers and actions were correctly binded to the browser');

            return _context4.abrupt('return', this);

          case 17:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function _attachCdpToChrome() {
    return _ref5.apply(this, arguments);
  };
}();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = require('debug')('HeadlessChrome:browser');

/**
 * Created by: Luciano A. Ganga
 * Inspired by:
 *    - Doffy (https://github.com/qieguo2016/doffy)
 *    - Horseman (https://github.com/johntitus/node-horseman)
 * More Info:
 * https://developers.google.com/web/updates/2017/04/headless-chrome
 * https://chromedevtools.github.io/devtools-protocol
 * https://github.com/cyrus-and/chrome-remote-interface
 */
var EventEmitter = require('events');
var chromeLauncher = require('chrome-launcher');
var CDP = require('chrome-remote-interface');
var setupHandlers = require('./setupHandlers');
var setupViewport = require('./setupViewport');
var setupActions = require('./setupActions');

var _require = require('./util'),
    sleep = _require.sleep;

var defaultOptions = {
  headless: true,
  disableGPU: true,
  launchChrome: true, // If false, only connects CDP to the Chrome instance in host:port
  chrome: {
    host: 'localhost',
    port: 0, // Chrome instance port (defaults to 0 to generate a random port)
    remote: false,
    launchAttempts: 3,
    handleSIGINT: true
  },
  loadPageTimeout: 60000,
  loadSelectorInterval: 500,
  loadSelectorTimeout: 60000,
  browserLog: false,
  deviceMetrics: {
    width: 1024,
    height: 768,
    deviceScaleFactor: 0,
    mobile: false,
    fitWindow: false
  }
};

var HeadlessChrome = function (_EventEmitter) {
  _inherits(HeadlessChrome, _EventEmitter);

  function HeadlessChrome(options) {
    _classCallCheck(this, HeadlessChrome);

    var _this = _possibleConstructorReturn(this, (HeadlessChrome.__proto__ || Object.getPrototypeOf(HeadlessChrome)).call(this));

    EventEmitter.call(_this);
    _this.options = Object.assign(defaultOptions, options);
    _this.host = _this.options.chrome.host;
    _this.port = _this.options.chrome.port;
    return _this;
  }

  /**
   * Initializates a new Chrome instance and controls it
   * @return - A browser tab instance, with all the actions
   */


  _createClass(HeadlessChrome, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.options.launchChrome) {
                  _context.next = 5;
                  break;
                }

                _context.next = 3;
                return _launchChrome({
                  headless: this.options.headless,
                  disableGPU: this.options.disableGPU,
                  port: this.options.chrome.port,
                  launchAttempts: this.options.chrome.launchAttempts,
                  handleSIGINT: this.options.chrome.handleSIGINT
                });

              case 3:
                this.chromeInstance = _context.sent;

                this.port = this.chromeInstance.port;

              case 5:
                _context.next = 7;
                return _attachCdpToChrome.call(this, this.host, this.port, this.options.chrome.remote);

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }()

    /**
     * Tells if the browser instance is initializated
     */

  }, {
    key: 'isInitialized',
    value: function isInitialized() {
      return !!this.client;
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

    /**
     * Closes the browser target/tab
     * @param {boolean} exit Indicates if chromeInstance must be killed with SIGHUP
     */

  }, {
    key: 'close',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var killChromeInstance = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                debug(`:: close => Closing the browser target/tab.`);
                _context2.prev = 1;

                this.client.close();
                this.client = null;
                _context2.t0 = killChromeInstance;

                if (!_context2.t0) {
                  _context2.next = 8;
                  break;
                }

                _context2.next = 8;
                return this.chromeInstance.kill('SIGHUP');

              case 8:
                debug(`:: close => Browser target/tab closed correctly!`);
                _context2.next = 14;
                break;

              case 11:
                _context2.prev = 11;
                _context2.t1 = _context2['catch'](1);
                throw _context2.t1;

              case 14:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1, 11]]);
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
      console.log(text);
      return this;
    }

    /**
     * Logs a text in the console, only in debug mode
     * @param {string} text - The text to log
     */

  }, {
    key: 'debugLog',
    value: function debugLog(text) {
      debug(text);
      return this;
    }
  }]);

  return HeadlessChrome;
}(EventEmitter);

module.exports = HeadlessChrome;