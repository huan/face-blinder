import * as fs        from 'fs'
import * as path      from 'path'

import {
  Contact,
  log,
  MediaMessage,
  MsgType,
  Wechaty,
}                     from 'wechaty'

const qrcodeTerminal  = require('qrcode-terminal')

import {
  Blinder,
}                     from './blinder'

import {
  path as APP_ROOT,
}                     from 'app-root-path'

export class Bot {
  private wechaty: Wechaty
  private blinder: Blinder

  constructor() {
    this.wechaty = Wechaty.instance({
      profile: 'face-blinder',
    })
    this.blinder = new Blinder()
  }

  public async start(): Promise<void> {
    await this.blinder.init()

    this.bindEvents(this.wechaty)
    this.bindMessage(this.wechaty)
    await this.wechaty.init()

    return new Promise<void>((resolve, reject) => {
      this.wechaty.on('logout', () => resolve())
      this.wechaty.on('error', reject)
    })
  }

  private bindEvents(wechaty: Wechaty): void {
    wechaty
    .on('scan', (url, code) => {
      if (!/201|200/.test(String(code))) {
        const loginUrl = url.replace(/\/qrcode\//, '/l/')
        qrcodeTerminal.generate(loginUrl)
      }
      console.log(`${url}\n[${code}] Scan QR Code in above url to login: `)
    })
    .on('logout', user  => log.info('Bot', `${user.name()} logouted`))
    .on('error',  e     => log.info('Bot', 'error: %s', e))
    .on('login',  async function(user) {
      const msg = `${user.name()} logined`

      log.info('Bot', msg)
      await this.say(msg)
    })
  }

  private bindMessage(wechaty: Wechaty): void {
    wechaty.on('message', async message => {
      const room    = message.room()
      // const sender  = message.from()
      const content = message.content()

      log.info('Bot', 'bindMessage() on(message) %s', content)

      if (!room) {
        return
      }

      const topic = room.topic()

      if (!/facenet/i.test(topic)) {
        return
      }

      if (message instanceof MediaMessage) {
        if (message.type() !== MsgType.IMAGE) {
          return
        }

        const fullpath = await this.savePhoto(message)
        const faceList = await this.blinder.see(fullpath)

        for (const face of faceList) {
          const similarFaceList = await this.blinder.similar(face)

          for (const similarFace of similarFaceList) {
            const faceFile = this.blinder.file(similarFace)
            await message.say(new MediaMessage(faceFile))
            await message.say(faceFile)
          }
        }

      } else {
        if (/^learn$/i.test(content)) {
          for (const contact of room.memberList()) {
            const file = await this.avatarFile(contact)
            const name = contact.name()
            const faceList = await this.blinder.see(file)
            for (const face of faceList) {
              await this.blinder.remember(face, name)
            }
          }
        }
      }
    })

  }

  private async savePhoto(message: MediaMessage): Promise<string> {
    const filename = path.join(
      APP_ROOT,
      'data',
      message.filename(),
    )
    console.log('IMAGE local filename: ' + filename)

    const fileStream = fs.createWriteStream(filename)

    console.log('start to readyStream()')
    try {
      const netStream = await message.readyStream()
      return new Promise<string>(resolve => {
        fileStream.once('close', _ => {
          console.log('finish pipe stream')
          const stat = fs.statSync(filename)
          console.log('file ', filename, ' size: ', stat.size)
          resolve(filename)
        })

        netStream
        .pipe(fileStream)
      })
    } catch (e) {
      console.error('stream error:', e)
      throw e
    }

  }

  private async avatarFile(contact: Contact): Promise<string> {
    const name = contact.name()
    const avatarFileName = `${__dirname}/data/${name}.jpg`

    const avatarReadStream = await contact.avatar()
    const avatarWriteStream = fs.createWriteStream(avatarFileName)

    return new Promise<string>((resolve, reject) => {
      avatarWriteStream.on('close', () => resolve(avatarFileName))
      avatarWriteStream.on('error', reject)
      avatarReadStream.pipe(avatarWriteStream)
    })
  }

}
