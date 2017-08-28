'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var debug = require('debug')('HeadlessChrome:events:Network');

/**
 * Register all the Network events of the Chrome DevTools Protocol
 * URL: https://chromedevtools.github.io/devtools-protocol/tot/Network/
 */
module.exports = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
  var _this = this;

  var Network, events, _loop, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, eventName;

  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          Network = this.client.Network;
          events = ['resourceChangedPriority', 'requestWillBeSent', 'requestServedFromCache', 'responseReceived', 'dataReceived', 'loadingFinished', 'loadingFailed', 'webSocketWillSendHandshakeRequest', 'webSocketHandshakeResponseReceived', 'webSocketCreated', 'webSocketClosed', 'webSocketFrameReceived', 'webSocketFrameError', 'webSocketFrameSent', 'eventSourceMessageReceived', 'requestIntercepted'];

          _loop = function _loop(eventName) {
            Network[eventName](function () {
              for (var _len = arguments.length, params = Array(_len), _key = 0; _key < _len; _key++) {
                params[_key] = arguments[_key];
              }

              debug.apply(undefined, [`-- Network.${eventName}: `].concat(params));
              _this.emit.apply(_this, [`Network.${eventName}`].concat(params));
            });
          };

          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 6;


          for (_iterator = events[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            eventName = _step.value;

            _loop(eventName);
          }
          _context.next = 14;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context['catch'](6);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 14:
          _context.prev = 14;
          _context.prev = 15;

          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }

        case 17:
          _context.prev = 17;

          if (!_didIteratorError) {
            _context.next = 20;
            break;
          }

          throw _iteratorError;

        case 20:
          return _context.finish(17);

        case 21:
          return _context.finish(14);

        case 22:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this, [[6, 10, 14, 22], [15,, 17, 21]]);
}));