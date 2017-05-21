'use strict'

const debug = require('debug')('HeadlessChrome:setupActions')

const actions = require('./actions')
module.exports = function () {
  const self = this
  Object.keys(actions).forEach(function (name) {
    debug(`Attaching new action: "${name}"`)
    const fn = actions[name].bind(self)
    self.addAction(name, fn)
  })
}
