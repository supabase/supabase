const fs = require('fs')
const path = require('path')

// Read the JSON file
try {
  const rawData = fs.readFileSync('./tokens/design-tokens.tokens.json')
  const jsonData = JSON.parse(rawData)

  // Extract "core"
  const coreData = jsonData.core

  // Specify output directories
  const coreDirectory = path.join(__dirname, './../../tokens/core')
  const themesDirectory = path.join(__dirname, './../../tokens/themes')

  // Check if directories exist, create them if not
  if (!fs.existsSync(coreDirectory)) {
    fs.mkdirSync(coreDirectory)
    console.log(`Created directory: ${coreDirectory}`)
  }

  if (!fs.existsSync(themesDirectory)) {
    fs.mkdirSync(themesDirectory)
    console.log(`Created directory: ${themesDirectory}`)
  }

  // Write "core" to a separate JSON file
  fs.writeFileSync(
    path.join(coreDirectory, 'core.json'),
    JSON.stringify({ core: coreData }, null, 2)
  )
  console.log('Core file written successfully.')

  // Extract and write each theme to separate JSON files
  const themes = jsonData.theme

  Object.keys(themes).forEach((themeName) => {
    const themeData = themes[themeName]
    const themeFileName = path.join(themesDirectory, `${themeName}.json`)
    fs.writeFileSync(themeFileName, JSON.stringify(themeData, null, 2))
    console.log(`Theme file "${themeName}.json" written successfully.`)
  })

  console.log('Extraction completed!')
} catch (error) {
  console.error('Error:', error.message)
}
