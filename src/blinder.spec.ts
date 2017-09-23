#!/usr/bin/env ts-node
import * as fs    from 'fs'
import * as os    from 'os'
import * as path  from 'path'

import * as nj    from 'numjs'

import * as test  from 'blue-tape'

import * as sinon   from 'sinon'
// const sinonTest     = require('sinon-test')(sinon)

import {
  AlignmentCache,
  EmbeddingCache,
  FaceCache,
  Facenet,
}                   from 'facenet'

import { Blinder }  from './blinder'

// import { log }    from 'brolog'
// log.level('silly')

sinon.stub(Facenet.prototype,         'init').resolves()
sinon.stub(AlignmentCache.prototype,  'init').resolves()
sinon.stub(EmbeddingCache.prototype,  'init').resolves()
sinon.stub(FaceCache.prototype,       'init').resolves()

const PHOTO_FILE = 'photo-file.jpg'

const FACE_FILE_1 = 'face-file-1.png'
const FACE_FILE_2 = 'face-file-2.png'
const FACE_FILE_3 = 'face-file-3.png'

const FACE_EMBEDDING_1 = nj.arange(128)
const FACE_EMBEDDING_2 = nj.arange(128).add(128)
const FACE_EMBEDDING_3 = nj.arange(128).add(256)

const alignmentCacheAlignStub = sinon.stub(AlignmentCache.prototype, 'align')
alignmentCacheAlignStub.withArgs(PHOTO_FILE).resolves()

)

test('constructor()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
  }
})

test('similar()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
  }
})

test('file()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
  }
})

test('see()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
  }
})

test('remember()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
  }
})

test('recognize()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
  }
})

test('rememberSimilar()', async t => {
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
