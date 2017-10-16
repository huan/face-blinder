import { FaceBlinder } 		from '../'

const twoFaceFile = `${__dirname}/../examples/image/zhizunbao-zixia.jpg`
const zixiaFile   = `${__dirname}/../examples/image/zixia.jpg`
async function main() {
  console.log('Welcome to Face-Blinder,I am an assitant bot for whom is suffering form face blindess\n')
  console.log(`I can recognize face in zixia.jpg and get similar face from zhizunbao-zixia.jpg. \nYou can find these images here:${__dirname}/image`)
  console.log('Please wait for me 2-3 minutes...... \n')

  const faceBlinder = new FaceBlinder()
  await faceBlinder.init()

  await faceBlinder.see(twoFaceFile)
  const zixiaFaceList   = await faceBlinder.see(zixiaFile)
  const similarFaceList = await faceBlinder.similar(zixiaFaceList[0])
  for (const face of similarFaceList) {
    const fileName = await faceBlinder.file(face)
    console.log(`Get ${similarFaceList.length} Zixia similar face.\nFile location: ${fileName}. \n\n`)
  }

  faceBlinder.quit()
}

main()
.catch(console.error)
