import * as util      from 'util'

import { log }        from 'brolog'
import * as rimraf    from 'rimraf'

import * as encoding  from 'encoding-down'
import * as leveldown from 'leveldown'
import * as levelup   from 'levelup'

// https://github.com/Microsoft/TypeScript/issues/14151#issuecomment-280812617
(<any>Symbol).asyncIterator = Symbol.asyncIterator || Symbol.for('Symbol.asyncIterator')

export class Store<K, V> {
  private levelDb: levelup.LevelUp<
    K,
    V,
    leveldown.LevelDownOptions,
    any, any, any, any, any
  >

  constructor(
    public workDir: string
  ) {
    log.verbose('Db', 'constructor()')

    // https://twitter.com/juliangruber/status/908688876381892608
    const encoded = encoding(
      leveldown<K, V>(workDir)
    )
    this.levelDb  = levelup(encoded)
  }

  public async put(key: K, value: V): Promise<void> {
    log.verbose('Db', 'put(%s, %s)', key, value)
    return await this.levelDb.put(key, value)
  }

  public async get(key: K): Promise<V | null> {
    log.verbose('Db', 'get(%s)', key)
    try {
      return await this.levelDb.get(key)
    } catch (e) {
      if (/NotFoundError/.test(e)) {
        return null
      }
      throw e
    }
  }

  public del(key: K): Promise<void> {
    log.verbose('Db', 'del(%s)', key)
    return this.levelDb.del(key)
  }

  public keys(): Promise<K[]> {
    log.verbose('Db', 'keys()')
    const keyList = [] as K[]

    return new Promise((resolve, reject) => {
      this.levelDb
            .createKeyStream()
              .on('data', key => keyList.push(key))
              .on('end', ()   => resolve(keyList))
              .on('error', reject)
    })
  }

  public values(): Promise<V[]> {
    log.verbose('Db', 'values()')

    const valueList = [] as V[]

        return new Promise((resolve, reject) => {
          this.levelDb
            .createValueStream()
              .on('data', value => valueList.push(value))
              .on('end', ()     => resolve(valueList))
              .on('error', reject)
        })
  }

  public async count(): Promise<number> {
    log.verbose('Db', 'count()')
    const keyList = await this.keys()
    return keyList.length
  }

  public async *[Symbol.asyncIterator](): AsyncIterator<[K, V]> {
    log.verbose('Db', '*[Symbol.asyncIterator]()')

    const readStream = this.levelDb.createReadStream()

    const endPromise = new Promise<false>((resolve, reject) => {
      readStream
        .once('end',  () => resolve(false))
        .once('error', e => reject(e))
    })

    let pair: [K, V] | false

    do {
      const dataPromise = new Promise<[K, V]>((resolve, reject) => {
        readStream.once('data', data => resolve([data.key, data.value]))
      })

      pair = await Promise.race([
        dataPromise,
        endPromise,
      ])

      if (pair) {
        yield pair
      }

    } while (pair)

  }

  // public async pairs(): Promise<[K, V][]> {
  //   const pairList = [] as [K, V][]
  //   return new Promise<[K, V][]>((resolve, reject) => {
  //     this.levelDb
  //       .createReadStream()
  //         .on('data', data => {
  //           pairList.push([data.key, data.value])
  //         })
  //         .on('end', () => resolve(pairList))
  //         .on('error', reject)
  //   })
  // }

  public async destroy(): Promise<void> {
    log.verbose('Db', 'destroy()')
    await this.levelDb.close()
    await util.promisify(rimraf)(this.workDir)
  }
}

export default Store
