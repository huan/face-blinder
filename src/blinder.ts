import * as path    from 'path'

import {
  AlignmentCache,
  DbCache,
  EmbeddingCache,
  FaceCache,
  Facenet,
  Face,
}                   from 'facenet'

export class Blinder {
  private nameDb:         DbCache
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
    this.nameDb         = new DbCache(path.join(this.workDir, 'db'))
  }

  public async init(): Promise<void> {
    await this.facenet.init()
    await this.faceCache.init()
    await this.alignmentCache.init()
    await this.embeddingCache.init()
    // await this.db.init
  }

  public async photo(file: string): Promise<Face[]> {
    const faceList = await this.alignmentCache.align(file)
    await Promise.all(
      faceList.map(f => this.embeddingCache.embedding(f))
    )
    return faceList
  }

  public async face(face: Face, name: string): Promise<number> {
    this.nameDb.put(face.md5, name)

    let   counter  = 0
    const faceList = this.search(face)

    for (const similarFace of faceList) {
      if (similarFace === face) {
        continue
      }

      const existName = await this.nameDb.get(face.md5)
      if (existName) { // do not consider '0' or ''(empty string) of name
        continue
      }

      this.nameDb.put(similarFace.md5, name)
      counter++
    }

    return counter
  }

  search(face: Face, threshold = 0.75): Face[] {
    const faceList = await getSimilarFaceFile(faceList[0])
  }
}
