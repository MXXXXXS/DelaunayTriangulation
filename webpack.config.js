const process = require('process')
const { resolve } = require('path')

const { NODE_ENV } = process.env
const isProduction = NODE_ENV === 'production'

const outputDir = resolve('app')
const appConfig = require('./webpack/app')

console.log('isProduction: ', isProduction)

module.exports = [appConfig(isProduction, outputDir, useReloading)]
