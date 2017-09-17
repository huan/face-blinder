import * as path    from 'path'

import {
  AlignmentCache,
  EmbeddingCache,
  FaceCache,
  Facenet,
  Face,
}                   from 'facenet'

import { Store }       from './store'

export class Blinder {
  private nameStore:      Store<string, string>
  private facenet:        Facenet
  private faceCache:      FaceCache
  private alignmentCache: AlignmentCache
  private embeddingCache: EmbeddingCache


  constructor(
    private workDir: string,
  ) {
    this.facenet        = new Facenet()
    this.alignmentCache = new AlignmentCache(this.facenet, this.workDir)
    this.embeddingCache = new EmbeddingCache(this.facenet, this.workDir)
    this.nameStore      = new Store(path.join(this.workDir, 'store.name'))
  }

  public async init(): Promise<void> {
    await this.facenet.init()
    await this.faceCache.init()
    await this.alignmentCache.init()
    await this.embeddingCache.init()
  }

  public async photo(file: string): Promise<Face[]> {
    const faceList = await this.alignmentCache.align(file)
    await Promise.all(
      faceList.map(f => this.embeddingCache.embedding(f))
    )
    return faceList
  }

  public async face(face: Face, name: string): Promise<number> {
    this.nameStore.put(face.md5, name)

    let   counter  = 0
    const faceList = this.search(face)

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

  search(face: Face, threshold = 0.75): Face[] {
    const faceList = await getSimilarFaceFile(faceList[0])
  }
}
