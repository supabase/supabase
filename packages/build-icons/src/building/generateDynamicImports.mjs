import path from 'path'
import { appendFile, resetFile } from '../utils/helpers.mjs'

export default function generateDynamicImports({
  iconNodes,
  outputDirectory,
  fileExtension,
  showLog = true,
}) {
  const fileName = path.basename(`dynamicIconImports${fileExtension}`)
  const icons = Object.keys(iconNodes)

  // Reset file
  resetFile(fileName, outputDirectory)

  let importString = `const dynamicIconImports = {\n`

  // Generate Import for Icon VNodes
  icons.forEach((iconName) => {
    importString += `  '${iconName}': () => import('./icons/${iconName}'),\n`
  })

  importString += '};\nexport default dynamicIconImports;\n'

  appendFile(importString, fileName, outputDirectory)

  if (showLog) {
    console.log(`Successfully generated ${fileName} file`)
  }
}
