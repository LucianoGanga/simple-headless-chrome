'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

var merge = require('deepmerge');

var chrome = require('./chrome');
var Tab = require('./Tab');

var defaultOptions = {
  headless: true,
  launchChrome: true, // If false, only connects CDP to the Chrome instance in host:port
  chrome: {
    host: 'localhost',
    port: 0, // Chrome instance port (defaults to 0 to generate a random port)
    remote: false,
    launchAttempts: 3,
    userDataDir: null,
    disableGPU: true,
    handleSIGINT: true,
    flags: ['--enable-logging'],
    noSandbox: false
  },
  tabs: {
    maxTabs: Infinity,
    startingUrl: 'about:blank' // Default starting URL for all the tabs
  },
  deviceMetrics: {
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false,
    fitWindow: false
  },
  browser: {
    loadPageTimeout: 60000,
    loadSelectorInterval: 500,
    loadSelectorTimeout: 60000,
    browserLog: false // {boolean|function}
  }
};

var Browser = function (_EventEmitter) {
  _inherits(Browser, _EventEmitter);

  function Browser() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Browser);

    // Deep merge in order to prevent total override of default params
    var _this = _possibleConstructorReturn(this, (Browser.__proto__ || Object.getPrototypeOf(Browser)).call(this));

    _this.options = merge(defaultOptions, options);
    _this.host = _this.options.chrome.host;
    _this._tabs = []; // TODO: This array must be initialized with the list of tabs of the attached Chrome instance (if the chrome instance is not new but a remote one with existing tabs, this should be autocompleted from that instance)
    _this._closedTabs = []; // This keeps track of closed tab ids
    return _this;
  }

  /**
   * Initializates a Chrome instance and opens a new tab
   * If it exceeds the maxTabs defined by user, returns undefined
   * @param {boolean} private Indicates a private tab (supported only in Headless mode)
   * @return - A browser tab instance, with all the actions
   */


  _createClass(Browser, [{
    key: 'init',
    value: function () {
      var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var initializationOptions;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.options.launchChrome) {
                  _context.next = 6;
                  break;
                }

                // Launch a new Chrome instance and update the instance port
                initializationOptions = this.options.chrome;
                _context.next = 4;
                return chrome.launch(this.options.headless, initializationOptions);

              case 4:
                this.chromeInstance = _context.sent;

                this.port = this.chromeInstance.port;

              case 6:
                _context.prev = 6;
                _context.next = 9;
                return chrome.attachCdpToBrowser(this.host, this.port, this.options.chrome.remote);

              case 9:
                this.client = _context.sent;
                return _context.abrupt('return', this);

              case 13:
                _context.prev = 13;
                _context.t0 = _context['catch'](6);
                _context.t1 = this.chromeInstance;

                if (!_context.t1) {
                  _context.next = 19;
                  break;
                }

                _context.next = 19;
                return this.chromeInstance.kill();

              case 19:
                throw _context.t0;

              case 20:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[6, 13]]);
      }));

      function init() {
        return _ref.apply(this, arguments);
      }

      return init;
    }()

    /**
     * Initializates a new Chrome tab and controls it.
     * If it exceeds the maxTabs defined by user, returns undefined
     * @param {boolean} privateTab Indicates a private tab (supported only in Headless mode)
     * @return - A browser tab instance, with all the actions
     */

  }, {
    key: 'newTab',
    value: function () {
      var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
        var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref3$privateTab = _ref3.privateTab,
            privateTab = _ref3$privateTab === undefined ? false : _ref3$privateTab;

        var error, tab;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                debug(`:: newTab => Opening a new tab in browser. Private tab: ${privateTab}`);

                /**
                 * Don't open tab if maxTabs reached, and not open private tab if not headless
                 */

                if (!(Object.keys(this._tabs).length >= this.options.tabs.maxTabs)) {
                  _context2.next = 6;
                  break;
                }

                error = new Error(`Can't open new tab. Max tabs limit reached`);

                error.maxTabs = this.options.tabs.maxTabs;
                error.openedTabs = Object.keys(this._tabs).length;
                throw error;

              case 6:

                // Create and initialize the new tab
                tab = new Tab(this.host, this.port, {
                  privateTab,
                  startingUrl: this.options.tabs.startingUrl
                }, this);
                _context2.next = 9;
                return tab.init();

              case 9:

                this._tabs[tab.getId()] = tab;

                return _context2.abrupt('return', tab);

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function newTab() {
        return _ref2.apply(this, arguments);
      }

      return newTab;
    }()
  }, {
    key: 'getTab',
    value: function getTab(tabId) {
      debug(`:: getTab => Getting tab ${tabId}`);
      return this._tabs[tabId];
    }

    /**
     * Lists all the open tabs ids
     */

  }, {
    key: 'listTabs',
    value: function () {
      var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3() {
        var array, key;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                debug(`:: listTabs => Listing all tabs`);
                array = [];

                for (key in this._tabs) {
                  array.push(this._tabs[key].id);
                }
                return _context3.abrupt('return', array);

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function listTabs() {
        return _ref4.apply(this, arguments);
      }

      return listTabs;
    }()

    /**
     * Lists all the private targets/tabs ids
     * only in headless mode
     */

  }, {
    key: 'listPrivateTabs',
    value: function listPrivateTabs() {
      debug(`:: listPrivateTabs => Listing all private tabs...`);
      if (!this.options.headless) {
        debug(`:: listPrivateTabs => Can't list private tabs without headless mode!`);
        return;
      }

      var array = [];
      for (var key in this._tabs) {
        if (this._tabs[key].privateTab) array.push(this._tabs[key].id);
      }
      debug(`:: listPrivateTabs => "${array.length}" private tabs found.`);
      return array;
    }

    /**
     * Exit the Chrome instance
     * @param {boolean} exit - Indicates if chromeInstance must be killed with SIGHUP
     * @return {boolean} - true if exited successfully
     */

  }, {
    key: 'close',
    value: function () {
      var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4() {
        var exit = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                debug(`:: close => Closing the browser.`);

                if (this.client) {
                  _context4.next = 4;
                  break;
                }

                debug(`:: close => Can not close the browser. Browser instance doesn't exists.`);
                return _context4.abrupt('return');

              case 4:
                _context4.prev = 4;
                _context4.next = 7;
                return this.client.close();

              case 7:
                this.client = null;
                this._tabs = [];
                this._closedTabs = [];
                _context4.t0 = exit && this.chromeInstance;

                if (!_context4.t0) {
                  _context4.next = 14;
                  break;
                }

                _context4.next = 14;
                return this.chromeInstance.kill('SIGHUP');

              case 14:
                debug(`:: close => Browser closed correctly!`);
                return _context4.abrupt('return', true);

              case 18:
                _context4.prev = 18;
                _context4.t1 = _context4['catch'](4);
                throw _context4.t1;

              case 21:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[4, 18]]);
      }));

      function close() {
        return _ref5.apply(this, arguments);
      }

      return close;
    }()

    /**
     * PRIVATE METHOD - Erases all the information of a closed target/tab.
     * @param {string} the target/tab ID that was closed
     */

  }, {
    key: '_closeTarget',
    value: function () {
      var _ref6 = _asyncToGenerator(regeneratorRuntime.mark(function _callee5(tabId) {
        var target;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                target = this._tabs[tabId];

                // Save information about the closed tab

                this._closedTabs.push({
                  id: tabId,
                  closedAt: target.closedAt,
                  instance: target
                });

                // Remove the tab from the active tabs list
                delete this._tabs[tabId];

              case 3:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _closeTarget(_x4) {
        return _ref6.apply(this, arguments);
      }

      return _closeTarget;
    }()

    /**
     * Tells if the browser is initialized
     */

  }, {
    key: 'isInitialized',
    value: function isInitialized() {
      return !!this.client;
    }
  }]);

  return Browser;
}(EventEmitter);

module.exports = Browser;