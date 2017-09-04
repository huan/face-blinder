import { createWriteStream } from 'fs'

import {
  Contact,
  log,
  MediaMessage,
  MsgType,
  Room,
  Wechaty,
}                   from 'wechaty'
// import { Facenet }  from 'facenet'

const qrcodeTerminal = require('qrcode-terminal')

async function main() {
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

      return processPhoto(message)
    } else {
      if (/^learn$/i.test(content)) {
        return learnRoom(room)
      }
    }
  })
  .init()
}

// export async function saveMediaFile(message: MediaMessage) {
//   const filename = message.filename()
//   console.log('IMAGE local filename: ' + filename)

//   const fileStream = createWriteStream(filename)

//   console.log('start to readyStream()')
//   try {
//     const netStream = await message.readyStream()
//     netStream
//       .pipe(fileStream)
//       .on('close', _ => console.log('finish readyStream()'))
//   } catch (e) {
//     console.error('stream error:', e)
//   }
// }

async function processPhoto(message: MediaMessage) {
  const filename = message.filename()
  console.log('IMAGE local filename: ' + filename)

  const fileStream = createWriteStream(filename)

  console.log('start to readyStream()')
  try {
    const netStream = await message.readyStream()
    netStream
      .pipe(fileStream)
      .on('close', _ => {
        console.log('finish pipe stream')
        // const fullPathName = __dirname + '/' + filename
        // console.log(fullPathName)
        // setTimeout(() => message.say(new MediaMessage(fullPathName)), 1000)
        message.say(new MediaMessage(__dirname + '/node_modules/wechaty/image/BotQrcode.png'))
      })
  } catch (e) {
    console.error('stream error:', e)
  }

}

//   const filename = message.filename()
//   const imageWriteStream = createWriteStream(filename)
//   const imageReadStream = await message.readyStream()

//   await new Promise(resolve => {
//     imageReadStream
//     .pipe(imageWriteStream)
//     .on('close', resolve)
//   })

//   message.say(new MediaMessage(__dirname + '/' + filename))

//   // save File
//   // process face
//   // load all faces
//   // compare distance
//   // message.say('similar photos')
// }

async function learnRoom(room: Room) {
  const contactList = room.memberList()
  for (const contact of contactList) {
    log.info('learnRoom', 'processing %s', contact.name())
    await learnContact(contact)
  }
}

async function learnContact(contact: Contact) {
  const name = contact.name()
  const avatarFileName = `${name}.jpg`

  const avatarReadStream = await contact.avatar()
  const avatarWriteStream = createWriteStream(avatarFileName)
  avatarReadStream.pipe(avatarWriteStream)

  // saveFace()
}

main()
