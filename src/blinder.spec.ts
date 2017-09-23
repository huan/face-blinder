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
  Face,
  FaceCache,
  Facenet,
  distance,
}                   from 'facenet'

import { Blinder }  from './blinder'

// import { log }    from 'brolog'
// log.level('silly')

sinon.stub(AlignmentCache.prototype,  'init').resolves()
sinon.stub(EmbeddingCache.prototype,  'init').resolves()
sinon.stub(Face.prototype,            'init').resolves()
sinon.stub(FaceCache.prototype,       'init').resolves()
sinon.stub(Facenet.prototype,         'init').resolves()

const PHOTO_FILE = 'photo-file.jpg'

const FACE_MD5_1 = '1234567890'
const FACE_MD5_2 = 'abcdefghij'
const FACE_MD5_3 = '!@#$%^&*()'

const FACE_EMBEDDING_1 = nj.arange(128)
const FACE_EMBEDDING_2 = nj.arange(128).add(128)
const FACE_EMBEDDING_3 = nj.arange(128).add(256)

const FACE_DISTANCE_1_2 = distance(FACE_EMBEDDING_1, FACE_EMBEDDING_2)
const FACE_DISTANCE_2_3 = distance(FACE_EMBEDDING_2, FACE_EMBEDDING_3)
const FACE_DISTANCE_3_1 = distance(FACE_EMBEDDING_3, FACE_EMBEDDING_1)

const FACE1 = new Face()
const FACE2 = new Face()
const FACE3 = new Face()
const FACE_LIST = [FACE1, FACE2, FACE3]

FACE1.md5 = FACE_MD5_1
FACE2.md5 = FACE_MD5_2
FACE3.md5 = FACE_MD5_3

sinon.stub(Facenet.prototype, 'align')
.withArgs(PHOTO_FILE)
.resolves(FACE_LIST)

sinon.stub(Facenet.prototype, 'embedding')
.withArgs(FACE1).resolves(FACE_EMBEDDING_1)
.withArgs(FACE2).resolves(FACE_EMBEDDING_2)
.withArgs(FACE3).resolves(FACE_EMBEDDING_3)

test('constructor()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
  }
})

test('similar()', async t => {
  for await (const blinder of blinderFixture()) {
    await blinder.see(PHOTO_FILE)

    t.skip('should later')
  }
})

test('file()', async t => {
  for await (const blinder of blinderFixture()) {
    const file = blinder.file(FACE1)
    t.true(file.includes(FACE_MD5_1), 'should get md5 named file')
    t.true(/\.png$/.test(file), 'should be png format(as default)')
  }
})

test('see()', async t => {
  for await (const blinder of blinderFixture()) {
    const faceList = await blinder.see(PHOTO_FILE)
    t.deepEqual(faceList, FACE_LIST, 'should see three faces')
  }
})

test('remember()', async t => {
  const NAME = 'test-name'
  for await (const blinder of blinderFixture()) {
    let name = await blinder.remember(FACE1)
    t.equal(name, null, 'should not remember any name at first')

    await blinder.remember(FACE1, NAME)

    name = await blinder.remember(FACE1)
    t.equal(name, NAME, 'should get NAME after remember the FACE1')
  }
})

test('forget()', async t => {
  const NAME = 'test-name'
  for await (const blinder of blinderFixture()) {
    await blinder.remember(FACE1, NAME)
    await blinder.forget(FACE1)
    t.equal(name, null, 'should not remember the NAME after forget')

  }
})

test('recognize()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
    t.skip('should later')

  }
})

test('rememberSimilar()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
    t.skip('should later')
  }
})

async function* blinderFixture() {
  const tmpDir = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      path.sep,
      'face-blinder-',
    ),
  )
  const blinder = new Blinder(tmpDir)
  await blinder.init()

  yield blinder

  await blinder.quit()
}
