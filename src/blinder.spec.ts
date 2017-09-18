#!/usr/bin/env ts-node
import * as fs    from 'fs'
import * as os    from 'os'
import * as path  from 'path'

import * as test from 'blue-tape'

import { Blinder }  from './blinder'

// import { log }    from 'brolog'
// log.level('silly')

test('constructor()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
  }
})

async function* blinderFixture() {
  const tmpDir = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      path.sep,
      'face-blinder-'
    )
  )
  const blinder = new Blinder(tmpDir)
  await blinder.init()

  yield blinder

  await blinder.quit()
}
