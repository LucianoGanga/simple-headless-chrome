'use strict'

const debug = require('debug')('HeadlessChrome:viewPort')

module.exports = async function () {
  const deviceMetrics = this.options.deviceMetrics
  debug(`Setting viewport with this parameters: `, deviceMetrics)

  const Emulation = this.client.Emulation
  await Emulation.setDeviceMetricsOverride(deviceMetrics)
  await Emulation.setVisibleSize({ width: deviceMetrics.width, height: deviceMetrics.height }) // not support on android!
}
