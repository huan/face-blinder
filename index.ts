import {
  log,
}         from './src/config'
import {
  Bot,
}         from './src/bot'

async function main(): Promise<number> {
  log.level('verbose')

  const bot = new Bot()
  await bot.start()
  return 0
}

main()
.then(process.exit)
.catch(e => {
  console.error(e)
  process.exit(1)
})
