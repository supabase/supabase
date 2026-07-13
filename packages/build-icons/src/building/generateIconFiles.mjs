import fs from 'fs'
import path from 'path'
import prettier from 'prettier'
import { readSvg, toPascalCase } from '../utils/helpers.mjs'

export default ({
  iconNodes,
  outputDirectory,
  template,
  showLog = true,
  iconFileExtension = '.js',
  pretty = true,
  iconsDir,
  iconMetaData,
}) => {
  const icons = Object.keys(iconNodes)
  const iconsDistDirectory = path.join(outputDirectory, `icons`)

  if (!fs.existsSync(iconsDistDirectory)) {
    fs.mkdirSync(iconsDistDirectory)
  }

  const writeIconFiles = icons.map(async (iconName) => {
    const location = path.join(iconsDistDirectory, `${iconName}${iconFileExtension}`)

    const componentName = toPascalCase(iconName)

    let { children, attributes: rootAttributes } = iconNodes[iconName]
    children = children.map(({ name, attributes }) => [name, attributes])

    const STYLE_ATTRS = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']
    const svgAttributes = {}
    for (const attr of STYLE_ATTRS) {
      if (attr in rootAttributes) {
        const camelKey = attr.replace(/-([a-z])/g, (_, l) => l.toUpperCase())
        svgAttributes[camelKey] = rootAttributes[attr]
      }
    }

    const svgContent = readSvg(`${iconName}.svg`, iconsDir)
    const getSvg = () => svgContent
    const { deprecated = false } = iconMetaData[iconName] ?? {}

    const elementTemplate = template({ componentName, iconName, children, getSvg, deprecated, svgAttributes })
    const output = pretty
      ? await prettier.format(elementTemplate, {
        singleQuote: true,
        trailingComma: 'all',
        printWidth: 100,
        parser: 'babel',
      })
      : elementTemplate

    console.log('Created ' + componentName)
    await fs.promises.writeFile(location, output, 'utf-8')
  })

  Promise.all(writeIconFiles)

    .then(() => {
      if (showLog) {
        console.log('Successfully built', icons.length, 'icons.')
      }
    })
    .catch((error) => {
      throw new Error(`Something went wrong generating icon files,\n ${error}`)
    })
}
