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
import FlashStore   from 'flash-store'

import {
  log,
  VERSION,
}                   from './config'

export interface FaceBlinderOptions {
  workdir?   : string
  threshold? : number
  minSize?   : number
}

const DEFAULT_THRESHOLD = 0.75
const DEFAULT_WORKDIR   = 'face-blinder.workdir'
const DEFAULT_MIN_SIZE  = 0

export class FaceBlinder {
  private nameStore:      FlashStore<string, string>
  private facenet:        Facenet
  private faceCache:      FaceCache
  private alignmentCache: AlignmentCache
  private embeddingCache: EmbeddingCache

  /**
   * @desc       Point Type
   * @typedef    FaceBlinderOptions
   * @property   { string }  workdir    - Workdir of the project, default: face-blinder.workdir
   * @property   { number }  threshold  - The number to judge the faces are the same one, default: 0.75
   */

  /**
   * Creates an instance of FaceBlinder.
   * @param {FaceBlinderOptions} [options]
   */
  constructor(
    public options: FaceBlinderOptions = {},
  ) {
    log.verbose('FaceBlinder', 'constructor()')

    this.options.workdir   = this.options.workdir   || path.join(APP_ROOT, DEFAULT_WORKDIR)
    this.options.threshold = this.options.threshold || DEFAULT_THRESHOLD
    this.options.minSize   = typeof this.options.minSize === 'undefined'
                              ? DEFAULT_MIN_SIZE
                              : this.options.minSize

    this.facenet        = new Facenet()
    this.faceCache      = new FaceCache(this.options.workdir)
    this.alignmentCache = new AlignmentCache(this.facenet, this.faceCache, this.options.workdir)
    this.embeddingCache = new EmbeddingCache(this.facenet, this.options.workdir)
  }

  /**
   * Get the version
   */
  public version(): string {
    return VERSION
  }

  /**
   * Init the FaceBlinder
   *
   * @returns {Promise<void>}
   * @example
   * const faceBlinder = new FaceBlinder()
   * await faceBlinder.init()
   */
  public async init(): Promise<void> {
    log.verbose('FaceBlinder', 'init()')

    const workdir = this.options.workdir
    if (!workdir) {
      throw new Error('no workdir!')
    }

    if (!fs.existsSync(workdir)) {
      fs.mkdirSync(workdir)
    }

    this.nameStore = new FlashStore(path.join(
      workdir,
      'name.store',
    ))

    await this.facenet.init()
    await this.faceCache.init()
    await this.alignmentCache.init()
    await this.embeddingCache.init()
  }

  /**
   * Quit FaceBlinder, should quit when not use facelinder
   *
   * @returns {Promise<void>}
   * @example
   * await faceBlinder.quit()
   */
  public async quit(): Promise<void> {
    log.verbose('FaceBlinder', 'quit()')
    await this.facenet.quit()
  }

  /**
   * Destroy FaceBlinder
   *
   * @returns {Promise<void>}
   */
  public async destroy(): Promise<void> {
    log.verbose('FaceBlinder', 'destroy()')
    let err
    try {
      await this.nameStore.destroy()
    } catch (e) {
      log.error('FaceBlinder', 'destroy() exception: %s', e)
      err = e
    }
    try {
      await util.promisify(rimraf)(this.options.workdir as string)
    } catch (e) {
      log.error('FaceBlinder', 'destroy() exception: %s', e)
      err = e
    }

    if (err) {
      throw err
    }
  }

  /**
   * See faces from the image file.
   *
   * FaceBlinder should init first, then can see faces.
   *
   * [Example/see-face]{@link https://github.com/zixia/face-blinder/blob/master/examples/see-face.ts}
   * @param {string} file
   * @returns {Promise<Face[]>}
   * @example
   * const faceBlinder = new FaceBlinder()
   * await faceBlinder.init()
   * const imageFile = `image/zhizunbao-zixia.jpg`
   * const faceList = await faceBlinder.see(imageFile)
   * console.log(faceList[0])
   */
  public async see(file: string): Promise<Face[]> {
    log.verbose('FaceBlinder', 'see(%s)', file)

    const minSize = this.options.minSize as number  // could be zero, do not use ||

    const updateEmbedding = async (face: Face): Promise<void> => {
      face.embedding = await this.embeddingCache.embedding(face)
      // console.log('see: ', face)

      await this.faceCache.put(face)
      log.silly('FaceBlinder', 'see() updateEmbedding() face(md5=%s): %s', face.md5, face.embedding)
    }

    const faceList = await this.alignmentCache.align(file)

    const bigFaceList = faceList.filter(face => {
      if (face.width >= minSize) {
        return true
      }
      log.verbose('FaceBlinder', 'see() face(%s) too small(%dx%d), skipped.',
                                  face.md5, face.width, face.height)
      return false
    })

    await Promise.all(
      bigFaceList
      .filter(f => !f.embedding)
      .map(updateEmbedding),
    )

    return bigFaceList
  }

  /**
   * Get All Similar Face from the database.
   *
   * [Example/find-similar-face]{@link https://github.com/zixia/face-blinder/blob/master/examples/find-similar-face.ts}
   * @param {Face} face                         - the face to compare
   * @param {number} [threshold=this.threshold] - threshold to judge two faces similarity, defatult is 0.75, you can change the number you prefer.
   * @returns {Promise<Face[]>}
   * @example
   * // faceBlinder should have some faces before, then it can get the similar face. Try Example/find-similar-face.ts
   * const faceList = await blinder.see(`image/zhizunbao-zixia.jpg`)
   * const similarFaceList = await blinder.similar(faceList[i])
   * for (const face of similarFaceList) {
   *   console.log(`Get ${similarFaceList.length} similar face.`)
   * }
   */
  public async similar(
    face: Face,
    threshold = this.options.threshold || DEFAULT_THRESHOLD,
  ): Promise<Face[]> {
    log.verbose('FaceBlinder', 'similar(%s, %s)', face, threshold)

    const faceEmbedding = face.embedding
    if (!faceEmbedding) {
      log.warn('FaceBlinder', 'similar() face.embedding not exist.')
      return []
    }
    const embedding = faceEmbedding.tolist()

    const embeddingStore = this.embeddingCache.store
    const faceList       = [] as Face[]

    for await (const md5 of embeddingStore.keys()) {
      log.silly('FaceBlinder', 'similar() iterate for md5: %s', md5)
      if (md5 === face.md5) {
        continue
      }
      const otherEmbedding = await embeddingStore.get(md5)
      if (!otherEmbedding) {
        log.warn('FaceBlinder', 'similar() embeddingStore.get(md5) return null')
        continue
      }

      // if (!otherEmbedding) {
      //   log.warn('FaceBlinder', 'similar() otherFace.embedding is empty, updating...')
      //   otherFace.embedding = await this.embeddingCache.embedding(otherFace)
      //   await this.faceCache.put(otherFace)
      // }

      const dist = this.facenet.distance(embedding, [otherEmbedding])[0]
      log.silly('FaceBlinder', 'similar() dist: %s <= %s: %s', dist, threshold, dist <= threshold)

      if (dist <= threshold) {
        const otherFace = await this.faceCache.get(md5)
        if (!otherFace) {
          log.warn('FaceBlinder', 'similar() faceCache.get(%s) return null', md5)
          continue
        }
        if (otherFace.width < (this.options.minSize as number)) {
          log.verbose('FaceBlinder', 'similar() otherFace too small(%s<%s), skipped',
                                      otherFace.width, this.options.minSize)
          continue
        }

        faceList.push(otherFace)
        // console.log(faceList)
      }
    }

    // sort faceList by distance
    return faceList.sort((a, b) => face.distance(a) - face.distance(b))
  }

  /**
   * Recognize face and return all related face name(here equal to face md5) from database
   *
   * [Example/recogonize-face]{@link https://github.com/zixia/face-blinder/blob/master/examples/recogonize-face.ts}
   * @param {Face} face
   * @returns {(Promise<string | null>)} - faceNameList, a face md5 array
   * @example
   * // Should remember the face before recogonize the face.
   * const faceList = await blinder.see(`image/zixia.jpg`)
   * await faceBlinder.remember(faceList[0], 'Zixia')
   * const recognizedName = await blinder.recognize(faceList[0]) || 'Who?'
   * console.log(`Recognize result: ${recognizedName}`)
   */
  public async recognize(face: Face): Promise<string | null> {
    log.verbose('FaceBlinder', 'recognize(%s)', face)

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

    const distanceMap = {}
    for (const name in nameDistanceListMap) {
      // TODO: better algorithm needed at here
      const distanceList = nameDistanceListMap[name]
      distanceMap[name] = distanceList.reduce((pre, cur) => pre + cur, 0)
      distanceMap[name] /= distanceList.length
      distanceMap[name] /= (Math.log(distanceList.length) + 1)
    }

    if (!Object.keys(nameDistanceListMap).length) {
      return null
    }

    const nameList = Object.keys(distanceMap)
                          .sort((a, b) => distanceMap[a] - distanceMap[b])
    return nameList[0]  // minimum distance
  }

  public async remember(face: Face, name: string) : Promise<void>
  public async remember(face: Face)               : Promise<string | null>

  /**
   * Remeber the face.
   *
   * @param {Face} face
   * @param {string} [name] - if not null,  set the name for this face. <br>
   *                          if null, the face name is face.md5 by default.
   * @returns {(Promise<void | string | null>)}
   * @example
   * const faceList = await blinder.see(`image/zixia.jpg`)
   * await faceBlinder.remember(faceList[0], 'Zixia')
   */
  public async remember(face: Face, name?: string) : Promise<void | string | null> {
    log.verbose('FaceBlinder', 'name(%s, %s)', face, name)

    if (!name) {
      const storedName = await this.nameStore.get(face.md5)
      return storedName
    }

    await this.nameStore.put(face.md5, name)
  }

  /**
   * Forget the face in the database
   *
   * @param {Face} face
   * @returns {Promise<void>}
   * @example
   * const faceList = await blinder.see(`image/zixia.jpg`)
   * await faceBlinder.forget(faceList[0])
   */
  public async forget(face: Face): Promise<void> {
    await this.nameStore.del(face.md5)
  }

  /**
   * Save the face to file
   *
   * [Example/see-face]{@link https://github.com/zixia/face-blinder/blob/master/examples/see-face.ts}
   * @param {Face} face
   * @returns {string}  - return file directory
   * @example
   * const faceList = await faceBlinder.see('image/zhizunbao-zixia.jpg')
   * for (const face of faceList) {
   *   const fileName = await faceBlinder.file(face)
   *   console.log(`Save file to ${fileName}`)
   * }
   */
  public file(face: Face): string {
    log.verbose('FaceBlinder', 'file(%s)', face)

    return this.faceCache.file(face.md5)
  }

  /**
   * Get face by md5
   *
   * @param {string} md5
   * @returns {(Promise<Face | null>)}
   */
  public async face(md5: string): Promise<Face | null> {
    log.verbose('FaceBlinder', 'face(%s)', md5)

    const face = await this.faceCache.get(md5)
    return face
  }

  /**
   * Get face.md5 list from database based on partialmd5. Make it convenience for user find face by md5
   *
   * @param {string} md5Partial
   * @returns {Promise<string[]>}
   * @example
   * // just an example for a md5Partial, change a more similar partial as you like.
   * let md5Partial = `2436`
   * const md5List = await blinder.list(md5Partial)
   * if (md5List.length === 0) {
   *   console.log('no such md5')
   * } else if (md5List.length === 1) {
   *   consoel.log(`You find the face!, face md5: ${md5List[0]}`)
   * } else {
   *   const reply = [ `which md5 do you want?`, ...md5List,].join('\n')
   *   console.log(reply)
   * }
   */
  public async list(md5Partial: string): Promise<string[]> {
    log.verbose('FaceBlinder', 'list(%s)', md5Partial)
    const md5List = await this.faceCache.list(md5Partial)
    return md5List
  }

  public async updateEmbeddingStore(): Promise<void> {
    const store          = this.faceCache.store
    const embeddingStore = this.faceCache.embeddingStore

    log.info('FaceBlinder', 'updateEmbeddingStore()')
    for await (const md5 of store.keys()) {
      const face = await this.faceCache.get(md5)
      if (face && face.embedding) {
        log.info('FaceBlinder', 'updateEmbeddingStore() updating for %s', md5)
        await embeddingStore.put(md5, face.embedding.tolist())
      } else {
        log.info('FaceBlinder', 'updateEmbeddingStore() no embedding for %s', md5)
      }
    }
    log.info('FaceBlinder', 'updateEmbeddingStore() done')
  }
}

export default FaceBlinder
