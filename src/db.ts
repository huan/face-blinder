import * as encoding  from 'encoding-down'
import * as leveldown from 'leveldown'
import * as levelup   from 'levelup'

export class Db<K, V> {
  private levelDb: levelup.LevelUp<
    K,
    V,
    leveldown.LevelDownOptions,
    any, any, any, any, any
  >

  constructor(
    public workDir: string
  ) {
    const encoded = encoding(
      leveldown<K, V>(workDir)
    )
    this.levelDb  = levelup(encoded)
  }

  public put(key: K, value: V): Promise<void> {
    return this.levelDb.put(key, value)
  }

  public get(key: K): Promise<V> {
    return this.levelDb.get(key)
  }

  public del(key: K): Promise<void> {
    return this.levelDb.del(key)
  }

  public keys(): Promise<K[]> {
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
    const keyList = await this.keys()
    return keyList.length
  }

  public async pairs(): Promise<[K, V][]> {
    const pairList = [] as [K, V][]
    return new Promise<[K, V][]>((resolve, reject) => {
      this.levelDb
        .createReadStream()
          .on('data', data => {
            pairList.push([data.key, data.value])
          })
          .on('end', () => resolve(pairList))
          .on('error', reject)
    })
  }

}

