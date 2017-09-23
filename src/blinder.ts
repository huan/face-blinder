import * as path    from 'path'
import * as util    from 'util'
import * as rimraf  from 'rimraf'

import {
  path as APP_ROOT,
}                   from 'app-root-path'
import {
  AlignmentCache,
  EmbeddingCache,
  FaceCache,
  Facenet,
  Face,
}                   from 'facenet'

import {
  log,
}                   from './config'
import {
  Store,
}                   from './store'

export class Blinder {
  private nameStore:      Store<string, string>
  private facenet:        Facenet
  private faceCache:      FaceCache
  private alignmentCache: AlignmentCache
  private embeddingCache: EmbeddingCache

  constructor(
    private workDir = path.join(APP_ROOT, 'blinder.data'),
  ) {
    log.verbose('Blinder', 'constructor()')

    this.facenet        = new Facenet()
    this.faceCache      = new FaceCache(this.workDir)
    this.alignmentCache = new AlignmentCache(this.facenet, this.faceCache, this.workDir)
    this.embeddingCache = new EmbeddingCache(this.facenet, this.workDir)
    this.nameStore      = new Store(path.join(this.workDir, 'name.store'))
  }

  public async init(): Promise<void> {
    log.verbose('Blinder', 'init()')

    await this.facenet.init()
    await this.faceCache.init()
    await this.alignmentCache.init()
    await this.embeddingCache.init()
  }

  public async quit(): Promise<void> {
    log.verbose('Blinder', 'quit()')
    await this.facenet.quit()
  }

  public async destroy(): Promise<void> {
    log.verbose('Blinder', 'destroy()')
    await this.nameStore.destroy()
    await util.promisify(rimraf)(this.workDir)
  }

  public async see(file: string): Promise<Face[]> {
    log.verbose('Blinder', 'see(%s)', file)

    const faceList = await this.alignmentCache.align(file)
    await Promise.all(
      faceList
      .filter(f => !f.embedding)
      .map(updateEmbedding),
    )

    return faceList

    async function updateEmbedding(face: Face): Promise<void> {
      face.embedding = await this.embeddingCache.embedding(face)
      await this.faceCache.put(face)
      log.silly('Blinder', 'see() updateEmbedding() face(md5=%s): %s', face.md5, face.embedding)
    }
  }

  public async recognize(face: Face): Promise<string | null> {
    const faceList = await this.similar(face)
    const nameList = await Promise.all(
      faceList.map(async f => await this.nameStore.get(f.md5)),
    )

    const counter = {}
    for (const name of nameList) {
      if (!name) {
        continue
      }
      if (!(name in counter)) {
        counter[name] = 0
      }
      counter[name] += 1
    }

    const recognizedName = Object.keys(counter)
                                  .sort((a, b) => {
                                    return counter[a] - counter[b]
                                  })
                                  [0]
    return recognizedName
  }

  public async remember(face: Face, name: string) : Promise<void>
  public async remember(face: Face)               : Promise<string | null>

  public async remember(face: Face, name?: string) : Promise<void | string | null> {
    log.verbose('Blinder', 'name(%s, %s)', face, name)

    if (!name) {
      const storedName = await this.nameStore.get(face.md5)
      return storedName
    }

    await this.nameStore.put(face.md5, name)
  }

  public async forget(face: Face): Promise<void> {
    await this.nameStore.del(face.md5)
  }

  public async rememberSimilar(face: Face): Promise<number> {
    let counter  = 0

    const name = await this.nameStore.get(face.md5)
    if (!name) {
      throw new Error('rememberSimilar() face name not stored')
    }

    const faceList = await this.similar(face)

    for (const similarFace of faceList) {
      const storedName = await this.nameStore.get(face.md5)
      if (storedName) { // do not consider '0' or ''(empty string) of name
        continue
      }

      this.remember(similarFace, name)
      counter++
    }

    return counter
  }

  public async similar(face: Face, threshold = 0.75): Promise<Face[]> {
    log.verbose('Blinder', 'similar(%s, %s)', face, threshold)

    const faceList = [] as Face[]

    const dbEntryList = await this.faceCache.db.list()
    for (const md5 of Object.keys(dbEntryList)) {
      log.silly('Blinder', 'similar() md5: %s', md5)
      if (md5 === face.md5) {
        continue
      }
      const theFace = await this.faceCache.get(md5)
      if (!theFace) {
        log.warn('Blinder', 'similar() faceCache.get(md5) return null')
        continue
      }

      console.log('similar', face.md5, face.embedding)
      console.log('similar', theFace.md5, theFace.embedding)

      const dist = face.distance(theFace)
      if (dist <= threshold) {
        faceList.push(theFace)
      }
    }

    return faceList
  }

  public file(face: Face): string {
    log.verbose('Blinder', 'file(%s)', face)

    return this.faceCache.file(face.md5)
  }

}
