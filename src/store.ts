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
    log.verbose('Store', 'constructor()')

    // https://twitter.com/juliangruber/status/908688876381892608
    const encoded = encoding(
      leveldown<K, V>(workDir)
    )
    this.levelDb  = levelup(encoded)
    this.levelDb.setMaxListeners(17)  // default is Infinity
  }

  public async put(key: K, value: V): Promise<void> {
    log.verbose('Store', 'put(%s, %s)', key, value)
    return await this.levelDb.put(key, value)
  }

  public async get(key: K): Promise<V | null> {
    log.verbose('Store', 'get(%s)', key)
    try {
      return await this.levelDb.get(key)
    } catch (e) {
      if (/^NotFoundError/.test(e)) {
        return null
      }
      throw e
    }
  }

  public del(key: K): Promise<void> {
    log.verbose('Store', 'del(%s)', key)
    return this.levelDb.del(key)
  }

  public async* keys(): AsyncIterableIterator<K> {
    log.verbose('Store', 'keys()')

    for await (const [key, _] of this) {
      yield key
    }
  }

  public async* values(): AsyncIterableIterator<V> {
    log.verbose('Store', 'values()')

    for await (const [_, value] of this) {
      yield value
    }

  }

  public async count(): Promise<number> {
    log.verbose('Store', 'count()')

    let count = 0
    for await (const _ of this) {
      count++
    }
    return count
  }

  public async *[Symbol.asyncIterator](): AsyncIterator<[K, V]> {
    log.verbose('Store', '*[Symbol.asyncIterator]()')

    const iterator = (this.levelDb as any).db.iterator()

    while (true) {
      const pair = await new Promise<[K, V] | null>((resolve, reject) => {
        iterator.next(function (err, key, val) {
          if (err) {
            reject(err)
          }
          if (!key && !val) {
            resolve(null)
          }
          resolve([key, val])
        })
      })
      if (!pair) {
        break
      }
      yield pair
    }

  }

  public async *streamAsyncIterator(): AsyncIterator<[K, V]> {
    log.warn('Store', 'DEPRECATED *[Symbol.asyncIterator]()')

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

  public async destroy(): Promise<void> {
    log.verbose('Store', 'destroy()')
    await this.levelDb.close()
    await util.promisify(rimraf)(this.workDir)
  }
}

export default Store
