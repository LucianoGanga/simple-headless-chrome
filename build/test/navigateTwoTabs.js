'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var HeadlessChrome = require('../../');
var test = require('tap').test;

test('Headless Chrome - Tabs', function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(group) {
    var _this = this;

    var browser, tabA, tabB, targets;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            group.comment(`Initializing HeadlessChrome...`);
            browser = new HeadlessChrome({
              headless: true
            });
            _context5.next = 4;
            return browser.init();

          case 4:
            _context5.next = 6;
            return browser.newTab({ privateTab: false });

          case 6:
            tabA = _context5.sent;
            _context5.next = 9;
            return browser.newTab({ privateTab: true });

          case 9:
            tabB = _context5.sent;
            targets = 0;


            group.test('Open 2 tabs', function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(t) {
                var exampleDomain, google, tabAEvaluate, tabBEvaluate, _ref3, targetInfos;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        // Navigate main tab to exampleDomain
                        exampleDomain = 'http://example.net';
                        _context.next = 3;
                        return tabA.goTo(exampleDomain);

                      case 3:

                        // Navigate second tab to Google
                        google = 'http://google.com';
                        _context.next = 6;
                        return tabB.goTo(google);

                      case 6:
                        _context.next = 8;
                        return tabA.evaluate(function () {
                          return document.title;
                        });

                      case 8:
                        tabAEvaluate = _context.sent;

                        t.equal(tabAEvaluate.result.value, 'Example Domain', `tabA got to example.net`);

                        // Get second tab title
                        _context.next = 12;
                        return tabB.evaluate(function () {
                          return document.title;
                        });

                      case 12:
                        tabBEvaluate = _context.sent;

                        t.equal(tabBEvaluate.result.value, 'Google', 'tabB got to google.com');

                        // information on number of tabs, for next tests
                        _context.next = 16;
                        return browser.client.Target.getTargets();

                      case 16:
                        _ref3 = _context.sent;
                        targetInfos = _ref3.targetInfos;

                        targets = targetInfos.length;

                      case 19:
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

            group.test('Close tab A', function () {
              var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(t) {
                var id, _ref5, targetInfos;

                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        id = tabA.getId();
                        _context2.next = 3;
                        return tabA.close();

                      case 3:
                        _context2.next = 5;
                        return browser.client.Target.getTargets();

                      case 5:
                        _ref5 = _context2.sent;
                        targetInfos = _ref5.targetInfos;

                        t.equal(targetInfos.length, --targets, 'tab A is closed');
                        t.equal(browser.getTab(id), undefined, 'and is not in tabs list');

                      case 9:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, this);
              }));

              return function (_x3) {
                return _ref4.apply(this, arguments);
              };
            }());

            group.test('Close tab B', function () {
              var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(t) {
                var id, _ref7, targetInfos;

                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        id = tabB.getId();
                        _context3.next = 3;
                        return tabB.close();

                      case 3:
                        _context3.next = 5;
                        return browser.client.Target.getTargets();

                      case 5:
                        _ref7 = _context3.sent;
                        targetInfos = _ref7.targetInfos;

                        t.equal(targetInfos.length, --targets, 'tab B is closed');
                        t.equal(browser.getTab(id), undefined, 'and is not in tabs list');

                      case 9:
                      case 'end':
                        return _context3.stop();
                    }
                  }
                }, _callee3, this);
              }));

              return function (_x4) {
                return _ref6.apply(this, arguments);
              };
            }());

            group.tearDown(_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
              return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                  switch (_context4.prev = _context4.next) {
                    case 0:
                      _context4.next = 2;
                      return browser.close(true);

                    case 2:
                    case 'end':
                      return _context4.stop();
                  }
                }
              }, _callee4, _this);
            })));

          case 15:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());