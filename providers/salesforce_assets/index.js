const pkg = require('./package.json')
module.exports = {
  name: 'salesforce_assets',
  hosts: false,
  Model: require('./modal'),
  version: pkg.version,
  disableIdParam: true,
  type: 'provider'
}