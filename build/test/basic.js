'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var HeadlessChrome = require('../../');
var test = require('tap').test;

test('Headless Chrome - Basic navigation', function () {
  var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee3(group) {
    var _this = this;

    var browser, mainTab;
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
            _context3.next = 6;
            return browser.newTab();

          case 6:
            mainTab = _context3.sent;


            group.test('example.net', function () {
              var _ref2 = _asyncToGenerator(regeneratorRuntime.mark(function _callee(t) {
                var exampleDomain, mainTabEvaluate;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        exampleDomain = 'http://example.net';
                        _context.next = 3;
                        return mainTab.goTo(exampleDomain);

                      case 3:
                        _context.next = 5;
                        return mainTab.evaluate(function () {
                          return document.title;
                        });

                      case 5:
                        mainTabEvaluate = _context.sent;


                        t.equal(mainTabEvaluate.result.value, 'Example Domain', `Page title is "${mainTabEvaluate.result.value}"`);

                        t.end();

                      case 8:
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

          case 9:
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