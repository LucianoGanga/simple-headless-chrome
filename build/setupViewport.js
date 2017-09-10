'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var debug = require('debug')('HeadlessChrome:viewPort');

module.exports = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
  var deviceMetrics;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          deviceMetrics = this.options.deviceMetrics;

          debug(`Setting viewport with this parameters: `, deviceMetrics);

          // Check https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride for more details
          _context.next = 4;
          return this.client.Emulation.setDeviceMetricsOverride(deviceMetrics);

        case 4:
          _context.next = 6;
          return this.client.Emulation.setVisibleSize({
            width: deviceMetrics.width,
            height: deviceMetrics.height
          });

        case 6:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, this);
}));