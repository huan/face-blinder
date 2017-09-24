import * as fs      from 'fs'
import * as path    from 'path'
import * as rimraf  from 'rimraf'
import * as util    from 'util'

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
  FlashStore,
}                   from 'flash-store'

import {
  log,
}                   from './config'

export class Blinder {
  private nameStore:      FlashStore<string, string>
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
  }

  public async init(): Promise<void> {
    log.verbose('Blinder', 'init()')

    if (!fs.existsSync(this.workDir)) {
      fs.mkdirSync(this.workDir)
    }

    this.nameStore = new FlashStore(path.join(this.workDir, 'name.store'))

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

    const updateEmbedding = async (face: Face): Promise<void> => {
      face.embedding = await this.embeddingCache.embedding(face)
      // console.log('see: ', face)
      await this.faceCache.put(face)
      log.silly('Blinder', 'see() updateEmbedding() face(md5=%s): %s', face.md5, face.embedding)
    }

    const faceList = await this.alignmentCache.align(file)
    await Promise.all(
      faceList
      .filter(f => !f.embedding)
      .map(updateEmbedding),
    )

    return faceList
  }

  public async similar(face: Face, threshold = 0.75): Promise<Face[]> {
    log.verbose('Blinder', 'similar(%s, %s)', face, threshold)

    const faceStore = this.faceCache.store
    const faceList  = [] as Face[]

    for await (const md5 of faceStore.keys()) {
      log.silly('Blinder', 'similar() iterate for md5: %s', md5)
      if (md5 === face.md5) {
        continue
      }
      const otherFace = await this.faceCache.get(md5)
      if (!otherFace) {
        log.warn('Blinder', 'similar() faceCache.get(md5) return null')
        continue
      }

      log.silly('Blinder', 'similar() iterate for otherFace: %s: %s',
                            otherFace.md5, otherFace.embedding)
      // console.log(otherFace)

      const dist = face.distance(otherFace)
      log.silly('Blinder', 'similar() dist: %s <= %s: %s', dist, threshold, dist <= threshold)
      if (dist <= threshold) {
        faceList.push(otherFace)
        // console.log(faceList)
      }
    }

    return faceList
  }

  public async recognize(face: Face): Promise<string | null> {
    log.verbose('Blinder', 'recognize(%s)', face)

    const rememberedName = await this.remember(face)
    if (rememberedName) {
      return rememberedName
    }

    const similarFaceList = await this.similar(face)

    const nameDistanceListMap = {} as {
      [name: string]: number[],
    }

    for (const similarFace of similarFaceList) {
      const name = await this.nameStore.get(similarFace.md5)
      if (!name) {
        continue
      }

      if (!(name in nameDistanceListMap)) {
        nameDistanceListMap[name] = []
      }

      const dist = face.distance(similarFace)
      nameDistanceListMap[name].push(dist)
    }

    const distance = {}
    for (const name in nameDistanceListMap) {
      const distanceList = nameDistanceListMap[name]
      distance[name] = distanceList.reduce((pre, cur) => pre + cur, 0)
      distance[name] /= distanceList.length
      distance[name] /= (Math.log(distanceList.length) + 1)
    }

    if (!Object.keys(nameDistanceListMap).length) {
      return null
    }

    const nameList = Object.keys(distance)
                                  .sort((a, b) => distance[a] - distance[b])
    return nameList[0]  // minimum distance
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

  public file(face: Face): string {
    log.verbose('Blinder', 'file(%s)', face)

    return this.faceCache.file(face.md5)
  }

}

export default Blinder
