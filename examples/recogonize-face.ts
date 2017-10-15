import { FaceBlinder } 		from '../'
const twoFaceFile = `${__dirname}/../examples/image/zhizunbao-zixia.jpg`
const zixiaFile   = `${__dirname}/../examples/image/zixia.jpg`

async function main() {
  console.log('Welcome to Face-Blinder,I am an assitant bot for whom is suffering form face blindess \n')
  console.log(`I can learn Zixia face from zixia.jpg, then recognize Zixia from zhizunbao-zixia.jpg! \nYou can find these images here:${__dirname}/image`)
  console.log('Please wait for me 2-3 minutes... \n')

  const faceBlinder = new FaceBlinder()
  await faceBlinder.init()

  const zixiaFace = await faceBlinder.see(zixiaFile)
  await faceBlinder.remember(zixiaFace[0], 'Zixia')

  const faceList = await faceBlinder.see(twoFaceFile)
  const recognizedZixia     = await faceBlinder.recognize(faceList[0]) || `I don't know the person`
  const recognizedZhizunbao = await faceBlinder.recognize(faceList[1]) || `I don't know the person`
  console.log(`Recognize Zixia     result: ${recognizedZixia}`)
  console.log(`Recognize Zhizunbao result: ${recognizedZhizunbao}`)

  faceBlinder.quit()
}

main()
.catch(console.error)
