import * as path    from 'path'

import {
  AlignmentCache,
  EmbeddingCache,
  FaceCache,
  Facenet,
  Face,
}                   from 'facenet'

import {
  log,
  MODULE_ROOT,
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
    private workDir = path.join(MODULE_ROOT, 'data'),
  ) {
    log.verbose('Blinder', 'constructor()')

    this.facenet        = new Facenet()
    this.alignmentCache = new AlignmentCache(this.facenet, this.workDir)
    this.embeddingCache = new EmbeddingCache(this.facenet, this.workDir)
    this.nameStore      = new Store(path.join(this.workDir, 'name.store'))
  }

  public async init(): Promise<void> {
    log.verbose('Blinder', 'init()')

    await this.facenet.init()
    await this.alignmentCache.init()
    // XXX
    this.faceCache = this.alignmentCache.faceCache
    await this.embeddingCache.init()
  }

  public async quit(): Promise<void> {
    log.verbose('Blinder', 'quit()')

    await this.facenet.quit()
  }

  public async photo(file: string): Promise<Face[]> {
    log.verbose('Blinder', 'photo(%s)', file)

    const faceList = await this.alignmentCache.align(file)
    await Promise.all(
      faceList.map(async f => {
        try {
          f.embedding
        } catch (e) {
          f.embedding = await this.embeddingCache.embedding(f)
        }
        console.log('photo', f.md5, f.embedding)
      })
    )
    await Promise.all(
      faceList.map(f => this.faceCache.put(f))
    )
    return faceList
  }

  public async name(face: Face)               : Promise<string | null>
  public async name(face: Face, name: string) : Promise<number>

  public async name(face: Face, name?: string): Promise<number | string | null> {
    log.verbose('Blinder', 'name(%s, %s)', face, name)

    if (!name) {
      return await this.nameStore.get(face.md5)
    }

    this.nameStore.put(face.md5, name)

    let   counter  = 0
    const faceList = await this.similar(face)

    for (const similarFace of faceList) {
      if (similarFace === face) {
        continue
      }

      const existName = await this.nameStore.get(face.md5)
      if (existName) { // do not consider '0' or ''(empty string) of name
        continue
      }

      this.nameStore.put(similarFace.md5, name)
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

      const theFace = await this.faceCache.get(md5)
      if (!theFace) {
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

