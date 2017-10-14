import { FaceBlinder } 		from '../'

async function main() {
  console.log('Welcome to Face-Blinder,I am an assitant bot for whom is suffering form face blindess')
  console.log('Init face blinder... \n')
  const faceBlinder = new FaceBlinder()
  await faceBlinder.init()

  const imageFile = `${__dirname}/../examples/image/demo.jpg`
  console.log('====== Trying to see faces from demo picture.====== \n')
  const faceList = await faceBlinder.see(imageFile)
  for (const face of faceList) {
    const fileName = await faceBlinder.file(face)
    console.log(`Save file to: ${fileName}`)
  }
  console.log(`See ${faceList.length} faces from the demofile and save them to the file. \n\n`)

  // function similar
  console.log('====== Trying to get similar face between zixia.jpg and demo.jpg. ====== \n')
  const zixiaFile = `${__dirname}/../examples/image/zixia.jpg`
  const zixiaFaceList = await faceBlinder.see(zixiaFile)
  const similarFaceList = await faceBlinder.similar(zixiaFaceList[0])
  for (const face of similarFaceList) {
    const fileName = await faceBlinder.file(face)
    console.log(`Get Zixia similar faces: ${similarFaceList.length}, See it in ${fileName}. \n\n`)
  }

  // function recognize
  console.log('====== Trying to recogonize zixia face Using zixia.jpg. ====== \n')
  const recognizedName = await faceBlinder.recognize(faceList[0]) || 'Who?'
  console.log(`recognize zixia: ${recognizedName}`)

  faceBlinder.quit()
}

main()
.catch(console.error)
