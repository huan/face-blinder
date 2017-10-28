import Brolog from 'brolog'
export const log = new Brolog

export const VERSION = require('../package.json')['version'] as string
