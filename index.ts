import {
  createWriteStream,
  statSync,
} from 'fs'

import { DbCache }   from './src/db-cache'

import {
  Contact,
  log,
  MediaMessage,
  MsgType,
  Room,
  Wechaty,
}                   from 'wechaty'
import {
  Facenet,
  Face,
  imageMd5,
  saveImage,
}  from 'facenet'

const qrcodeTerminal = require('qrcode-terminal')

const db = new DbCache(__dirname + '/level.db')

async function main() {
  const facenet = new Facenet()
  // await facenet.init()

  const bot = Wechaty.instance({
    profile: 'face-blinder'
  })

  bot
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
    let msg = `${user.name()} logined`

    log.info('Bot', msg)
    await this.say(msg)
  })
  .on('message', async message => {
    const room    = message.room()
    // const sender  = message.from()
    const content = message.content()

    log.info('message', 'recv: %s', content)

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

      const fullpath = await savePhoto(message)
      const faceList = await facenet.align(fullpath)
      await Promise.all(faceList.map(f => facenet.embedding(f)))
      await Promise.all(faceList.map(saveFace))
      const faceFile = await getSimilarFaceFile(faceList[0])
      await message.say(new MediaMessage(faceFile))
      await message.say(faceFile)

    } else {
      if (/^learn$/i.test(content)) {
        const avatarFileList = await getAvatarListFromRoom(room)
        for (let file of avatarFileList) {
          const faceList = await facenet.align(file)
          await Promise.all(faceList.map(f => facenet.embedding(f)))
          await Promise.all(faceList.map(saveFace))
        }
      }
    }
  })
  .init()
}

async function savePhoto(message: MediaMessage): Promise<string> {
  const filename = __dirname + '/data/' + message.filename()
  console.log('IMAGE local filename: ' + filename)

  const fileStream = createWriteStream(filename)

  console.log('start to readyStream()')
  try {
    const netStream = await message.readyStream()
    return new Promise<string>(resolve=> {
      netStream
      .pipe(fileStream)

      fileStream.once('close', _ => {
        console.log('finish pipe stream')
        const stat = statSync(filename)
        console.log('file ', filename, ' size: ', stat.size)
        resolve(filename)
      })
    })
  } catch (e) {
    console.error('stream error:', e)
    throw e
  }

}

async function getAvatarListFromRoom(room: Room): Promise<string[]> {
  const contactList = room.memberList()
  return await Promise.all(contactList.map(getContactAvatar))
}

async function getContactAvatar(contact: Contact): Promise<string> {
  const name = contact.name()
  const avatarFileName = `${__dirname}/data/${name}.jpg`

  const avatarReadStream = await contact.avatar()
  const avatarWriteStream = createWriteStream(avatarFileName)
  avatarReadStream.pipe(avatarWriteStream)

  return avatarFileName
}

async function saveFace(face: Face): Promise<void> {
  const md5 = imageMd5(face.imageData)
  await db.put(md5, face.toJSON())
  const faceFile = __dirname + '/data/' + md5 + '.jpg'
  await saveImage(face.imageData, faceFile)
}

async function getSimilarFaceFile(face: Face): Promise<string> {
  const dbList = await db.list()

  let similarFace = face
  let minDistance: number = 999

  Object.keys(dbList)
    .map(k => dbList[k])
    .map(Face.fromJSON)
    .forEach(f => {
      const dist = face.distance(f)
      if (dist < minDistance) {
        similarFace = f
        minDistance = dist
      }
    })

  const md5 = imageMd5(similarFace.imageData)
  return __dirname + '/data/' + md5 + '.jpg'
}

main()
