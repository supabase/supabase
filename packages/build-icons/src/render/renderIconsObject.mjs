import { basename } from 'path'
import { parseSync } from 'svgson'
import { generateHashedKey, hasDuplicatedChildren, readSvg } from '../utils/helpers.mjs'

/**
 * Build an object in the format: `{ <name>: <contents> }`.
 * @param {string[]} svgFiles - A list of filenames.
 * @param {Function} getSvg - A function that returns the contents of an SVG file given a filename.
 * @returns {Object}
 */
export default (svgFiles, iconsDirectory, renderUniqueKey = false) =>
  svgFiles
    .map((svgFile) => {
      const name = basename(svgFile, '.svg')
      const svg = readSvg(svgFile, iconsDirectory)
      const contents = parseSync(svg)

      if (!(contents.children && contents.children.length)) {
        throw new Error(`${name}.svg has no children!`)
      }

      if (hasDuplicatedChildren(contents.children)) {
        throw new Error(`Duplicated children in ${name}.svg`)
      }

      if (renderUniqueKey) {
        contents.children = contents.children.map((child) => {
          child.attributes.key = generateHashedKey(child)

          return child
        })
      }

      return { name, contents }
    })
    .reduce((icons, icon) => {
      icons[icon.name] = icon.contents
      return icons
    }, {})
