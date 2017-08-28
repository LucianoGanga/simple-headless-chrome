'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var HeadlessChrome = require('../../');
var test = require('tap').test;

test('Headless Chrome - inject methods', function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee6(group) {
    var _this = this;

    var browser, mainTab;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            group.comment(`Initializing HeadlessChrome...`);
            browser = new HeadlessChrome({
              // headless: false
            });
            _context6.next = 4;
            return browser.init();

          case 4:
            _context6.next = 6;
            return browser.newTab();

          case 6:
            mainTab = _context6.sent;


            group.test('#inject(module)', function () {
              var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(t) {
                var result;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return mainTab.goTo('https://httpbin.org/html');

                      case 2:
                        _context.next = 4;
                        return mainTab.inject('jquery.slim');

                      case 4:
                        _context.next = 6;
                        return mainTab.evaluate(function () {
                          return !!window.jQuery;
                        });

                      case 6:
                        result = _context.sent;


                        t.equal(result.result.value, true, `module injection`);
                        t.end();

                      case 9:
                      case 'end':
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function (_x2) {
                return _ref2.apply(this, arguments);
              };
            }());

            group.test('#inject(remoteScript)', function () {
              var _ref3 = _asyncToGenerator(regeneratorRuntime.mark(function _callee2(t) {
                var result;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.next = 2;
                        return mainTab.goTo('https://httpbin.org/html');

                      case 2:
                        _context2.next = 4;
                        return mainTab.inject('https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.slim.min.js');

                      case 4:
                        _context2.next = 6;
                        return mainTab.evaluate(function () {
                          return !!window.jQuery;
                        });

                      case 6:
                        result = _context2.sent;


                        t.equal(result.result.value, true, `remote script injection`);
                        t.end();

                      case 9:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, this);
              }));

              return function (_x3) {
                return _ref3.apply(this, arguments);
              };
            }());

            group.test('#inject(localFile)', function () {
              var _ref4 = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(t) {
                var result;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return mainTab.goTo('https://httpbin.org/html');

                      case 2:
                        _context3.next = 4;
                        return mainTab.inject('jquery/dist/jquery.slim.min.js');

                      case 4:
                        _context3.next = 6;
                        return mainTab.evaluate(function () {
                          return !!window.jQuery;
                        });

                      case 6:
                        result = _context3.sent;


                        t.equal(result.result.value, true, `local file injection`);
                        t.end();

                      case 9:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, this);
              }));

              return function (_x4) {
                return _ref4.apply(this, arguments);
              };
            }());

            group.test('#injectScript(script)', function () {
              var _ref5 = _asyncToGenerator(regeneratorRuntime.mark(function _callee4(t) {
                var result;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        _context4.next = 2;
                        return mainTab.goTo('https://httpbin.org/html');

                      case 2:
                        _context4.next = 4;
                        return mainTab.injectScript('window.jQuery = true');

                      case 4:
                        _context4.next = 6;
                        return mainTab.evaluate(function () {
                          return !!window.jQuery;
                        });

                      case 6:
                        result = _context4.sent;


                        t.equal(result.result.value, true, `script injection`);
                        t.end();

                      case 9:
                      case 'end':
                        return _context4.stop();
                    }
                  }
                }, _callee4, this);
              }));

              return function (_x5) {
                return _ref5.apply(this, arguments);
              };
            }());

            group.tearDown(_asyncToGenerator(regeneratorRuntime.mark(function _callee5() {
              return regeneratorRuntime.wrap(function _callee5$(_context5) {
                while (1) {
                  switch (_context5.prev = _context5.next) {
                    case 0:
                      _context5.next = 2;
                      return browser.close(true);

                    case 2:
                    case 'end':
                      return _context5.stop();
                  }
                }
              }, _callee5, _this);
            })));

          case 12:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());