const gen = require('./main')({ openaiApiKey: require('./config.json').apiKey })

async function run() {
  const sum = await gen('sum all the numbers and add 1', [
    {
      args: [1, 2, 3],
      result: 7,
    },
    {
      args: [100, 5],
      result: 106,
    },
  ])
  console.log(sum(1, 1)) // 3
}
run()
