import { FaceBlinder } 		from '../'

async function main() {
  const faceBlinder = new FaceBlinder()
  await faceBlinder.init()
  const imageFile = `${__dirname}/../examples/demo.jpg`
  const faceList = await faceBlinder.see(imageFile)
  for (const face of faceList) {
    const fileName = await faceBlinder.file(face)
    console.log(`Save file to: ${fileName}`)
  }
  console.log(`See ${faceList.length} faces from the demofile and save them to the file.`)
  faceBlinder.quit()
}

main()
.catch(console.error)
