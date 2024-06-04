import fs from 'fs'
import path from 'path'

/**
 * Converts string to CamelCase
 *
 * @param {string} string
 * @returns {string} A camelized string
 */
const toCamelCase = (string) =>
  string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) =>
    p2 ? p2.toUpperCase() : p1.toLowerCase()
  )

/**
 * Converts string to PascalCase
 *
 * @param {string} string
 * @returns {string} A pascalized string
 */
export const toPascalCase = (string) => {
  const camelCase = toCamelCase(string)

  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1)
}

/**
 * Converts string to KebabCase
 *
 * @param {string} string
 * @returns {string} A kebabized string
 */
const toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * Resets the file contents.
 *
 * @param {string} fileName
 * @param {string} outputDirectory
 */
export const resetFile = (fileName, outputDirectory) =>
  fs.writeFileSync(path.join(outputDirectory, fileName), '', 'utf-8')

/**
 * Reads the file contents.
 *
 * @param {string} path
 * @returns {string} The contents of a file
 */
const readFile = (entry) => fs.readFileSync(path.resolve(__dirname, '../', entry), 'utf-8')

/**
 * append content to a file
 *
 * @param {string} content
 * @param {string} fileName
 * @param {string} outputDirectory
 */
export const appendFile = (content, fileName, outputDirectory) =>
  fs.appendFileSync(path.join(outputDirectory, fileName), content, 'utf-8')

/**
 * writes content to a file
 *
 * @param {string} content
 * @param {string} fileName
 * @param {string} outputDirectory
 */
const writeFile = (content, fileName, outputDirectory) =>
  fs.writeFileSync(path.join(outputDirectory, fileName), content, 'utf-8')

/**
 * reads the icon directory
 *
 * @param {string} directory
 * @returns {array} An array of file paths containing svgs
 */
export const readSvgDirectory = (directory, fileExtension = '.svg') =>
  fs.readdirSync(directory).filter((file) => path.extname(file) === fileExtension)

/**
 * Read svg from directory
 *
 * @param {string} fileName
 * @param {string} directory
 */
export const readSvg = (fileName, directory) =>
  fs.readFileSync(path.join(directory, fileName), 'utf-8')

/**
 * djb2 hashing function
 *
 * @param {string} string
 * @param {number} seed
 * @returns {string} A hashed string of 6 characters
 */
const hash = (string, seed = 5381) => {
  let i = string.length

  while (i) {
    // eslint-disable-next-line no-bitwise, no-plusplus
    seed = (seed * 33) ^ string.charCodeAt(--i)
  }

  // eslint-disable-next-line no-bitwise
  return (seed >>> 0).toString(36).substr(0, 6)
}

/**
 * Generate Hashed string based on name and attributes
 *
 * @param {object} seed
 * @param {string} seed.name A name, for example an icon name
 * @param {object} seed.attributes An object of SVGElement Attrbutes
 * @returns {string} A hashed string of 6 characters
 */
export const generateHashedKey = ({ name, attributes }) => hash(JSON.stringify([name, attributes]))

/**
 * Checks if array of items contains duplicated items
 *
 * @param {array} children an array of items
 * @returns {Boolean} if items contains duplicated items.
 */
export const hasDuplicatedChildren = (children) => {
  const hashedKeys = children.map(generateHashedKey)

  return !hashedKeys.every(
    (key, index) => index === hashedKeys.findIndex((childKey) => childKey === key)
  )
}
