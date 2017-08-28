'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var HeadlessChrome = require('../../');
var test = require('tap').test;

test('Headless Chrome - Private Tabs', function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(group) {
    var _this = this;

    var browser;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            group.comment(`Initializating HeadlessChrome...`);
            browser = new HeadlessChrome({
              headless: true
            });
            _context3.next = 4;
            return browser.init();

          case 4:

            group.test('Open 2 new private tabs', function () {
              var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(t) {
                var tabA, tabB, exampleDomain, google, tabAEvaluate, tabBEvaluate;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return browser.newTab({ privateTab: true });

                      case 2:
                        tabA = _context.sent;
                        _context.next = 5;
                        return browser.newTab({ privateTab: true });

                      case 5:
                        tabB = _context.sent;


                        // Navigate main tab to exampleDomain
                        exampleDomain = 'http://example.net';
                        _context.next = 9;
                        return tabA.goTo(exampleDomain);

                      case 9:

                        // Navigate second tab to Google
                        google = 'http://google.com';
                        _context.next = 12;
                        return tabB.goTo(google);

                      case 12:
                        _context.next = 14;
                        return tabA.evaluate(function () {
                          return document.title;
                        });

                      case 14:
                        tabAEvaluate = _context.sent;

                        t.equal(tabAEvaluate.result.value, 'Example Domain', `tabA got to example.net`);

                        // Get second tab title
                        _context.next = 18;
                        return tabB.evaluate(function () {
                          return document.title;
                        });

                      case 18:
                        tabBEvaluate = _context.sent;

                        t.equal(tabBEvaluate.result.value, 'Google', 'tabB got to google.com');

                        t.end();

                      case 21:
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

            group.tearDown(_asyncToGenerator(regeneratorRuntime.mark(function _callee2() {
              return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      _context2.next = 2;
                      return browser.close(true);

                    case 2:
                    case 'end':
                      return _context2.stop();
                  }
                }
              }, _callee2, _this);
            })));

          case 6:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());