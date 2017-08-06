'use strict'

const debug = require('debug')('HeadlessChrome:viewPort')

module.exports = async function () {
  const deviceMetrics = this.options.deviceMetrics
  debug(`Setting viewport with this parameters: `, deviceMetrics)

  // Check https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride for more details
  await this.client.Emulation.setDeviceMetricsOverride(deviceMetrics)
  await this.client.Emulation.setVisibleSize({
    width: deviceMetrics.width,
    height: deviceMetrics.height
  })
}
