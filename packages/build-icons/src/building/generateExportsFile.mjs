import path from 'path'

import { appendFile, resetFile, toPascalCase } from '../utils/helpers.mjs'

export default (inputEntry, outputDirectory, iconNodes, iconFileExtension = '') => {
  const fileName = path.basename(inputEntry)

  // Reset file
  resetFile(fileName, outputDirectory)

  const icons = Object.keys(iconNodes)

  // Generate Import for Icon VNodes
  icons.forEach((iconName) => {
    const componentName = toPascalCase(iconName)
    const importString = `export { default as ${componentName} } from './${iconName}${iconFileExtension}';\n`
    appendFile(importString, fileName, outputDirectory)
  })

  appendFile('\n', fileName, outputDirectory)

  console.log(`Successfully generated ${fileName} file`)
}
