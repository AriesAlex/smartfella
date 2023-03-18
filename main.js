const fs = require('fs-extra')
const generateCode = require('./generateCode')
const runCode = require('./runCode')
const chalk = require('chalk')

const generatedFileName =
  (module.parent ? module.parent.path : __dirname) +
  '/smartfella_generated.json'
if (!fs.existsSync(generatedFileName)) fs.writeFileSync(generatedFileName, '{}')

async function gen(prompt, examples, generateCode, log, runCode) {
  const generated = fs.readJSONSync(generatedFileName)
  const generatedKey = prompt + JSON.stringify(examples)

  if (generated[generatedKey])
    return await runCode(`(${generated[generatedKey]})`)

  const adjustedPrompt = adjustPrompt(prompt, examples)
  let code = await generateCode(adjustedPrompt)
  code = code.substring(0, code.lastIndexOf('}') + 1) // remove everything after function

  let func
  try {
    log('Prompt:', prompt)
    log('Running code:\n', code)
    func = await runCode(`(${code})`)
  } catch (e) {
    log('Error while running code, regenereting it', e)
    return await gen(prompt, examples, generateCode, log, runCode)
  }

  for (const example of examples) {
    try {
      const actualResult = await func(...example.args)
      if (JSON.stringify(actualResult) !== JSON.stringify(example.result)) {
        log(
          'invalid example result, regenereting.\n',
          `expected: ${
            example.result
          } (${typeof example.result})\nactual: ${JSON.stringify(
            actualResult
          )} (${typeof JSON.stringify(example.result)})`
        )
        return gen(prompt, examples, generateCode, log, runCode)
      }
    } catch (e) {
      log('testing example failed, regenereting.', e)
      return gen(prompt, examples, generateCode, log, runCode)
    }
  }

  generated[generatedKey] = String(func)
  fs.writeFileSync(generatedFileName, JSON.stringify(generated, 0, 2))
  return func
}

function adjustPrompt(prompt, examples) {
  return `Write single pure function in JavaScript. Examples of executing function:
${createTestExamples(examples)
  .map(
    example =>
      `f(${example.args
        .map(addQuotesIfString)
        .join(', ')}) /* returns: ${addQuotesIfString(example.result)} */`
  )
  .join('\n')}
Write only code. Don't use arrow function, only use default declaration that starts with 'function'. The function must: ${prompt}.`
}

function addQuotesIfString(obj) {
  return typeof obj == 'string' ? `"${obj}"` : obj
}

function createTestExamples(examples) {
  // Shuffle the array
  for (let i = examples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[examples[i], examples[j]] = [examples[j], examples[i]]
  }

  // Remove the first 20% of elements
  const numToRemove = Math.round(examples.length * 0.2)
  examples.splice(0, numToRemove)
  return examples
}

function log(...args) {
  const msg = args.join(' ')
  console.log(chalk.gray('[Smartfella] ' + msg))
}

const defaultOptions = {
  openaiApiKey: '',
  customGenerateCode: null,
  enableLogs: true,
  autoInstallModules: true,
}

module.exports = (options = defaultOptions) => {
  options = { ...defaultOptions, ...options }
  if (!options.openaiApiKey && !options.customGenerateCode)
    throw Error(
      `OpenAI Api Key not specified and there's no custom code generate function`
    )

  const defaultGenerateCode = prompt =>
    generateCode(prompt, options.openaiApiKey)

  return async (prompt, examples = []) =>
    await gen(
      prompt,
      examples,
      options.customGenerateCode || defaultGenerateCode,
      options.enableLogs ? log : () => {},
      options.autoInstallModules ? runCode : code => runCode(code, false)
    )
}
