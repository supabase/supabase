import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const CANONICAL_STROKE_WIDTH = '1.5'
const CHILD_STROKE_ATTRIBUTES = ['stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']

const readAttributes = (element) =>
  Object.fromEntries(
    [...element.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [match[1], match[2]])
  )

export const validateIconSource = (source, filename = 'icon.svg') => {
  const errors = []
  const rootMatch = source.match(/<svg\b[^>]*>/s)

  if (!rootMatch) return [`${filename}: missing root <svg> element`]

  const rootAttributes = readAttributes(rootMatch[0])
  const childElements = source
    .slice((rootMatch.index ?? 0) + rootMatch[0].length)
    .match(/<(?!\/)[a-z][^>]*>/gi)
  const childAttributeViolations = []
  let hasChildInlineStyle = false

  if ('style' in rootAttributes) {
    errors.push(`${filename}: inline style attributes are not allowed on the root <svg>`)
  }

  for (const element of childElements ?? []) {
    const attributes = readAttributes(element)
    if ('style' in attributes) hasChildInlineStyle = true
    for (const attribute of CHILD_STROKE_ATTRIBUTES) {
      if (attribute in attributes) childAttributeViolations.push(attribute)
    }
  }

  if (hasChildInlineStyle) {
    errors.push(`${filename}: inline style attributes are not allowed on child elements`)
  }

  if (childAttributeViolations.length > 0) {
    errors.push(
      `${filename}: move shared ${[...new Set(childAttributeViolations)].join(
        ', '
      )} attributes to the root <svg>`
    )
  }

  if (rootAttributes.stroke === 'none') {
    if ('stroke-width' in rootAttributes) {
      errors.push(`${filename}: fill-only icons must not declare stroke-width`)
    }
    return errors
  }

  if (rootAttributes.fill !== 'none') {
    errors.push(`${filename}: stroke icons must use fill="none" on the root <svg>`)
  }
  if (rootAttributes.stroke !== 'currentColor') {
    errors.push(
      `${filename}: stroke icons must use stroke="currentColor"; use stroke="none" for fill-only icons`
    )
  }
  if (rootAttributes['stroke-width'] !== CANONICAL_STROKE_WIDTH) {
    errors.push(
      `${filename}: stroke icons must use stroke-width="${CANONICAL_STROKE_WIDTH}" on the root <svg>`
    )
  }

  return errors
}

export const validateIconDirectory = (directory) => {
  const errors = fs
    .readdirSync(directory)
    .filter((filename) => filename.endsWith('.svg'))
    .sort()
    .flatMap((filename) =>
      validateIconSource(fs.readFileSync(path.join(directory, filename), 'utf8'), filename)
    )

  if (errors.length > 0) {
    throw new Error(
      `Icon source validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`
    )
  }
}

const isExecutedDirectly =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isExecutedDirectly) {
  validateIconDirectory(path.resolve(process.cwd(), 'src/raw-icons'))
  console.log('Validated icon sources.')
}
