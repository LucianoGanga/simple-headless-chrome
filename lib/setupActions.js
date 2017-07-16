'use strict';

var debug = require('debug')('HeadlessChrome:setupActions');

var actions = require('./actions');
module.exports = function () {
  var self = this;
  Object.keys(actions).forEach(function (name) {
    debug(`Attaching new action: "${name}"`);
    var fn = actions[name].bind(self);
    self.addAction(name, fn);
  });
};