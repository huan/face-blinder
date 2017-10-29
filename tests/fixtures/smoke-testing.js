const { FaceBlinder } = require('face-blinder')

async function main() {
  const blinder = new FaceBlinder()
  try {
    console.log(`FaceBlinder v${blinder.version}`)
    await blinder.init()
  } catch (e) {
    console.error(e)
    return 1
  } finally {
    await blinder.quit()
  }
  return 0
}

main()
.then(process.exit)
.catch(e => {
  console.error(e)
  process.exit(1)
})
