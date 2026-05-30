import fs from 'fs'
import path from 'path'
import { appendFile, resetFile, toPascalCase } from '../utils/helpers.mjs'

const getImportString = (componentName, iconName, aliasImportFileExtension = '') =>
  `export { default as ${componentName} } from './icons/${iconName}${aliasImportFileExtension}';\n`

export default async function generateAliasesFile({
  iconNodes,
  outputDirectory,
  fileExtension,
  iconFileExtension = '.js',
  iconMetaData,
  aliasImportFileExtension,
  aliasNamesOnly = false,
  separateAliasesFile = false,
  showLog = true,
}) {
  const iconsDistDirectory = path.join(outputDirectory, `icons`)
  const fileName = path.basename(`aliases${fileExtension}`)
  const icons = Object.keys(iconNodes)

  // Reset file
  resetFile(fileName, outputDirectory)

  // Generate Import for Icon VNodes
  await Promise.all(
    icons.map(async (iconName, index) => {
      const componentName = toPascalCase(iconName)
      const iconAliases = iconMetaData[iconName]?.aliases

      let importString = ''

      if ((iconAliases != null && Array.isArray(iconAliases)) || !aliasNamesOnly) {
        if (index > 0) {
          importString += '\n'
        }

        importString += `// ${componentName} aliases\n`
      }

      if (!aliasNamesOnly) {
        importString += getImportString(`${componentName}Icon`, iconName, aliasImportFileExtension)
        importString += getImportString(
          `Lucide${componentName}`,
          iconName,
          aliasImportFileExtension
        )
      }

      if (iconAliases != null && Array.isArray(iconAliases)) {
        await Promise.all(
          iconAliases.map(async (alias) => {
            const componentNameAlias = toPascalCase(alias)

            if (separateAliasesFile) {
              const output = `export { default } from "./${iconName}"`
              const location = path.join(iconsDistDirectory, `${alias}${iconFileExtension}`)

              await fs.promises.writeFile(location, output, 'utf-8')
            }

            // Don't import the same icon twice
            if (componentName === componentNameAlias) {
              return
            }

            const exportFileIcon = separateAliasesFile ? alias : iconName

            importString += getImportString(
              componentNameAlias,
              exportFileIcon,
              aliasImportFileExtension
            )

            if (!aliasNamesOnly) {
              importString += getImportString(
                `${componentNameAlias}Icon`,
                exportFileIcon,
                aliasImportFileExtension
              )

              importString += getImportString(
                `Lucide${componentNameAlias}`,
                exportFileIcon,
                aliasImportFileExtension
              )
            }
          })
        )
      }

      appendFile(importString, fileName, outputDirectory)
    })
  )

  appendFile('\n', fileName, outputDirectory)

  if (showLog) {
    console.log(`Successfully generated ${fileName} file`)
  }
}
