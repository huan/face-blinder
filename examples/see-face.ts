import { FaceBlinder } 		from '../'

const twoFaceFile = `${__dirname}/../examples/image/zhizunbao-zixia.jpg`
async function main() {
  console.log('Welcome to Face-Blinder,I am an assitant bot for whom is suffering form face blindess \n')
  console.log(`I can recognize two faces from zhizunbao-zixia.jpg, then save them to local file! \nYou can find these images here:${__dirname}/image`)
  console.log('Please wait for me 2-3 minutes... \n')

  const faceBlinder = new FaceBlinder()
  await faceBlinder.init()

  const faceList = await faceBlinder.see(twoFaceFile)
  let count = 1
  for (const face of faceList) {
    const fileName = await faceBlinder.file(face)
    console.log(`Get No. ${count++} face! \nSave the file to: ${fileName}`)
  }
  console.log(`\nSee ${faceList.length} faces from Zhizunbao and Zixia Image and saved them to the file successfully.`)
  faceBlinder.quit()
}

main()
.catch(console.error)
