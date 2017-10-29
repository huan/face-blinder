import Brolog from 'brolog'
export const log = new Brolog

import * as readPkgUp from 'read-pkg-up'
export const VERSION = readPkgUp.sync().pkg.version
