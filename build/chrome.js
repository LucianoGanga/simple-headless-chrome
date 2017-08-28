'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var debug = require('debug')('HeadlessChrome:chrome');

var chromeLauncher = require('chrome-launcher');
var CDP = require('chrome-remote-interface');

var _require = require('./util'),
    sleep = _require.sleep;

/**
 * Launches a debugging instance of Chrome on port 9222.
 * @param {boolean=} headless True (default) to launch Chrome in headless mode.
 *     Set to false to launch Chrome normally.
 * @param {{ port: number,
 *    handleSIGINT: boolean,
 *    userDataDir: string,
 *    chromeFlags: Array,
 *    launchAttempts: number,
 *    disableGPU: boolean,
 *    noSandbox: boolean
 *  }} options
 * @return {object} - Chrome instance data
 *    @property {number} pid - The Process ID used by the Chrome instance
 *    @property {number} port - The port used by the Chrome instance
 *    @property {string} userDataDir - The userDataDir used by the Chrome instance
 *    @property {async fn} kill - Fn to kill the Chrome instance
 */


module.exports.launch = function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee(headless) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var chromeOptions, attempt, instance, launchAttempts;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            debug(`Launching Chrome instance. Headless: ${headless === true ? 'YES' : 'NO'}`);

            chromeOptions = {
              port: options.port,
              handleSIGINT: options.handleSIGINT,
              userDataDir: options.userDataDir,
              chromeFlags: options.flags
            };


            if (headless) {
              chromeOptions.chromeFlags.push('--headless');
            }
            if (options.disableGPU) {
              chromeOptions.chromeFlags.push('--disable-gpu');
            }
            if (options.noSandbox) {
              chromeOptions.chromeFlags.push('--no-sandbox');
            }

            attempt = 0;
            instance = void 0;
            launchAttempts = options.launchAttempts;

          case 8:
            if (!(!instance && attempt++ < launchAttempts)) {
              _context.next = 29;
              break;
            }

            debug(`Launching Chrome. Attempt ${attempt}/${launchAttempts}...`);
            _context.prev = 10;
            _context.next = 13;
            return chromeLauncher.launch(chromeOptions);

          case 13:
            instance = _context.sent;
            _context.next = 27;
            break;

          case 16:
            _context.prev = 16;
            _context.t0 = _context['catch'](10);

            debug(`Can't launch Chrome in attempt ${attempt}/${launchAttempts}. Error code: ${_context.t0.code}`, _context.t0);

            if (!(_context.t0.code === 'EAGAIN' || _context.t0.code === 'ECONNREFUSED')) {
              _context.next = 26;
              break;
            }

            _context.next = 22;
            return sleep(1000 * attempt);

          case 22:
            if (!(attempt >= launchAttempts)) {
              _context.next = 24;
              break;
            }

            throw _context.t0;

          case 24:
            _context.next = 27;
            break;

          case 26:
            throw _context.t0;

          case 27:
            _context.next = 8;
            break;

          case 29:
            if (instance) {
              _context.next = 31;
              break;
            }

            throw new Error(`Can't launch Chrome! (attempts: ${attempt - 1}/${launchAttempts})`);

          case 31:

            debug(`Chrome instance launched in port "${instance.port}", pid "${instance.pid}"`);

            return _context.abrupt('return', instance);

          case 33:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[10, 16]]);
  }));

  return function (_x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Attach the Chrome Debugging Protocol to a Chrome instance in given host:port combination
 * Attaching CDP allows the use of a wide browser's methods.
 * @See https://chromedevtools.github.io/devtools-protocol/ for more info
 * @param {string} host - The host of the Chrome instance
 * @param {number} port - The port number of the Chrome instance
 * @param {boolean} remote - A boolean indicating whether the protocol must be fetched remotely or if the local version must be used
 * @return {object} - CDP Client object
 */
module.exports.attachCdpToBrowser = _asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
  var host = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'localhost';
  var port = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 9222;
  var remote = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
  var client;
  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          debug(`Preparing Chrome Debugging Protocol (CDP) for host "${host}" and port "${port}"...`);
          _context2.prev = 1;
          _context2.next = 4;
          return CDP({ host, port, remote });

        case 4:
          client = _context2.sent;


          debug('CDP prepared for browser');
          return _context2.abrupt('return', client);

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2['catch'](1);

          debug(`Couldnt connect CDP to browser`);
          throw _context2.t0;

        case 13:
        case 'end':
          return _context2.stop();
      }
    }
  }, _callee2, this, [[1, 9]]);
}));

/**
 * Attach the Chrome Debugging Protocol to a target in given host:port + targetId combination
 * Attaching CDP allows the use of a wide browser's methods.
 * @See https://chromedevtools.github.io/devtools-protocol/ for more info
 * @param {string} host - The host of the Chrome instance
 * @param {number} port - The port number of the Chrome instance
 * @param {string} targetId - The targetId to be attached
 * @return {object} - CDP client object
 */
module.exports.attachCdpToTarget = function () {
  var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(host, port, targetId) {
    var client;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            debug(`Preparing Chrome Debugging Protocol (CDP) for Tab "${targetId}"...`);
            _context3.prev = 1;
            _context3.next = 4;
            return CDP({ target: targetId, host, port });

          case 4:
            client = _context3.sent;
            _context3.next = 7;
            return Promise.all([client.Network.enable(), client.Page.enable(), client.DOM.enable(), client.CSS.enable(), client.Security.enable()]);

          case 7:

            debug(`CDP prepared for tab "${targetId}"!`);

            return _context3.abrupt('return', client);

          case 11:
            _context3.prev = 11;
            _context3.t0 = _context3['catch'](1);

            debug(`Couldnt connect CDP to tab "${targetId}"`);
            throw _context3.t0;

          case 15:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this, [[1, 11]]);
  }));

  return function (_x6, _x7, _x8) {
    return _ref3.apply(this, arguments);
  };
}();