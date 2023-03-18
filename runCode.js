const fetch = require('node-fetch')

function installAndRequire(moduleName) {
  const { execSync } = require('child_process')
  try {
    return require(moduleName)
  } catch (err) {
    console.log(`${moduleName} not found. Installing...`)
    execSync('npm i ' + moduleName)
    return installAndRequire(moduleName)
  }
}

async function runCode(code, autoInstallModules = true) {
  if (autoInstallModules)
    code = code.replaceAll('require(', 'installAndRequire(')
  return await eval(code)
}

module.exports = runCode
