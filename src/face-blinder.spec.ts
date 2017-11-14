#!/usr/bin/env ts-node
import * as fs    from 'fs'
import * as os    from 'os'
import * as path  from 'path'

import * as nj    from 'numjs'

// tslint:disable:no-shadowed-variable
import * as test  from 'blue-tape'

import * as sinon   from 'sinon'
// const sinonTest     = require('sinon-test')(sinon)

import {
  Face,
  Facenet,
  // log as facenetLog,
  Rectangle,
}                   from 'facenet'
// facenetLog.level('silly')

import FaceBlinder  from './face-blinder'

import {
  FILE_DUMMY_PNG,
  IMAGE_DATA,
}                   from '../tests/fixtures/'

// import { log }      from './config'
// log.level('silly')

/**
 * FIXTURES
 */
const FACE_MD5_1 = '1234567890'
const FACE_MD5_2 = 'abcdefghij'
const FACE_MD5_3 = 'ABCDEFGHIJ'

const FACE_EMBEDDING_1 = nj.arange(128)
const FACE_EMBEDDING_2 = nj.arange(128).add(128)
const FACE_EMBEDDING_3 = nj.arange(128).add(256)

const FACE1 = new Face()
const FACE2 = new Face()
const FACE3 = new Face()
const FACE_LIST = [FACE1, FACE2, FACE3]

FACE1.embedding = FACE_EMBEDDING_1
FACE2.embedding = FACE_EMBEDDING_2
FACE3.embedding = FACE_EMBEDDING_3

const FACE_LOCATION = {
  x: 0, y: 0,
  w: IMAGE_DATA.width,
  h: IMAGE_DATA.height,
} as Rectangle

FACE1.imageData = IMAGE_DATA
FACE2.imageData = IMAGE_DATA
FACE3.imageData = IMAGE_DATA

const SIMILAR_TO_FACE1 = [FACE2]
const SIMILAR_TO_FACE2 = [FACE1]
const SIMILAR_TO_FACE3 = [FACE1, FACE2]

FACE1.md5 = FACE_MD5_1
FACE2.md5 = FACE_MD5_2
FACE3.md5 = FACE_MD5_3

FACE1.location = FACE_LOCATION
FACE2.location = FACE_LOCATION
FACE3.location = FACE_LOCATION

sinon.stub(Facenet.prototype, 'init').resolves()
sinon.stub(Facenet.prototype, 'align').resolves(FACE_LIST)
sinon.stub(Facenet.prototype, 'embedding')
.withArgs(FACE1).resolves(FACE_EMBEDDING_1)
.withArgs(FACE2).resolves(FACE_EMBEDDING_2)
.withArgs(FACE3).resolves(FACE_EMBEDDING_3)

sinon.stub(Facenet.prototype, 'distance')
.callsFake((embedding, embeddingList) => {
  const targetEmbedding = embeddingList[0] as number[]
  // console.log('embedding', embedding)
  // console.log('targetEmbedding', targetEmbedding)
  // console.log('stringify', JSON.stringify(targetEmbedding))
  // console.log('expected ', JSON.stringify(FACE_EMBEDDING_2.tolist()))
  switch (JSON.stringify(targetEmbedding)) {
    case JSON.stringify(FACE_EMBEDDING_1.tolist()): return [0]
    case JSON.stringify(FACE_EMBEDDING_2.tolist()): return [0.5]
    case JSON.stringify(FACE_EMBEDDING_3.tolist()): return [1]
    default:                                        return [42]
  }
})

sinon.stub(Face.prototype, 'distance')
.callsFake(face => {
  switch (face.md5) {
    case FACE1.md5: return 0
    case FACE2.md5: return 0.5
    case FACE3.md5: return 1
    default:        return 42
  }
})

async function* blinderFixture() {
  const workdir = fs.mkdtempSync(
    path.join(
      os.tmpdir(),
      'face-blinder-',
    ),
  )
  const minSize = 1
  const blinder = new FaceBlinder({
    workdir,
    minSize,
  })
  await blinder.init()

  try {
    yield blinder
  } finally {
    await blinder.quit()
  }

}

/**
 * UNIT TESTS
 */
test('constructor()', async t => {
  for await (const blinder of blinderFixture()) {
    t.ok(blinder, 'should instanciate ok')
  }
})

test('similar()', async t => {
  for await (const blinder of blinderFixture()) {
    await blinder.see(FILE_DUMMY_PNG)

    let similarFaceList = await blinder.similar(FACE1)
    t.deepEqual(
      similarFaceList.map(f => f.md5),
      SIMILAR_TO_FACE1.map(f => f.md5),
      'should get similar faces for FACE1',
    )

    similarFaceList = await blinder.similar(FACE2)
    t.deepEqual(
      similarFaceList.map(f => f.md5),
      SIMILAR_TO_FACE2.map(f => f.md5),
      'should get similar faces for FACE2',
    )

    similarFaceList = await blinder.similar(FACE3)
    t.deepEqual(
      similarFaceList.map(f => f.md5),
      SIMILAR_TO_FACE3.map(f => f.md5),
      'should get similar faces for FACE3',
    )
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
    const faceList = await blinder.see(FILE_DUMMY_PNG)
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
    const name = await blinder.remember(FACE1)
    t.equal(name, null, 'should not remember the NAME after forget')

  }
})

test('recognize()', async t => {

  t.test('FACE1', async t => {
    for await (const blinder of blinderFixture()) {
      await blinder.see(FILE_DUMMY_PNG)

      await blinder.remember(FACE1, FACE_MD5_1)

      const name1 = await blinder.recognize(FACE1)
      const name2 = await blinder.recognize(FACE2)
      const name3 = await blinder.recognize(FACE3)
      t.equal(name1, FACE_MD5_1, 'FACE1 will recognize self')
      t.equal(name2, FACE_MD5_1, 'FACE1 will similar with FACE1')
      t.equal(name3, FACE_MD5_1, 'FACE1 will similar with FACE3')
    }
  })

  t.test('FACE2', async t => {
    for await (const blinder of blinderFixture()) {
      await blinder.see(FILE_DUMMY_PNG)

      await blinder.remember(FACE2, FACE_MD5_2)

      const name1 = await blinder.recognize(FACE1)
      const name2 = await blinder.recognize(FACE2)
      const name3 = await blinder.recognize(FACE3)
      t.equal(name1, FACE_MD5_2, 'FACE2 will similar with FACE1')
      t.equal(name2, FACE_MD5_2, 'FACE2 will recognize self')
      t.equal(name3, FACE_MD5_2, 'FACE2 will similar with FACE3')
    }
  })

  t.test('FACE3', async t => {
    for await (const blinder of blinderFixture()) {
      await blinder.see(FILE_DUMMY_PNG)

      await blinder.remember(FACE3, FACE_MD5_3)

      const name1 = await blinder.recognize(FACE1)
      const name2 = await blinder.recognize(FACE2)
      const name3 = await blinder.recognize(FACE3)
      t.equal(name1, null, 'FACE3 will not similar with FACE1')
      t.equal(name2, null, 'FACE3 will not similar with FACE2')
      t.equal(name3, FACE_MD5_3, 'FACE3 will recognize self')
    }
  })

  t.test('FACE1 & FACE2', async t => {
    for await (const blinder of blinderFixture()) {
      await blinder.see(FILE_DUMMY_PNG)

      await blinder.remember(FACE1, FACE_MD5_1)
      await blinder.remember(FACE2, FACE_MD5_2)

      const name3 = await blinder.recognize(FACE3)
      t.equal(name3, FACE_MD5_1, 'FACE1 should be recognized with FACE3')
    }
  })

})
