/*
 * Copyright 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */

// no-op default
const defaultFileHeader = (arr) => arr

const lineSeparator = '\n'
const defaultFormatting = {
  lineSeparator,
  prefix: ' * ',
  header: `/**${lineSeparator}`,
  footer: `${lineSeparator} */${lineSeparator}${lineSeparator}`
}

/**
 *
 * This is for creating the comment at the top of generated files with the generated at date.
 * It will use the custom file header if defined on the configuration, or use the
 * default file header.
 * @memberof module:formatHelpers
 * @param {Object} options
 * @param {File} options.file - The file object that is passed to the formatter.
 * @param {String} options.commentStyle - The only options are 'short' and 'xml', which will use the // or \<!-- --> style comments respectively. Anything else will use \/\* style comments.
 * @param {Object} options.formatting - Custom formatting properties that define parts of a comment in code. The configurable strings are: prefix, lineSeparator, header, and footer.
 * @returns {String}
 * @example
 * ```js
 * StyleDictionary.registerFormat({
 *   name: 'myCustomFormat',
 *   formatter: function({ dictionary, file }) {
 *     return fileHeader({file, 'short') +
 *       dictionary.allTokens.map(token => `${token.name} = ${token.value}`)
 *         .join('\n');
 *   }
 * });
 * ```
 */
function fileHeader ({ file = {}, commentStyle, formatting = {} }) {
  // showFileHeader is true by default
  let showFileHeader = true
  if (file.options && typeof file.options.showFileHeader !== 'undefined') {
    showFileHeader = file.options.showFileHeader
  }

  // Return empty string if the showFileHeader is false
  if (!showFileHeader) return ''

  let fn = defaultFileHeader
  if (file.options && typeof file.options.fileHeader === 'function') {
    fn = file.options.fileHeader
  }

  // default header
  const defaultHeader = [
    'Do not edit directly',
    `Generated on ${new Date().toString()}`
  ]

  let { prefix, lineSeparator, header, footer } = Object.assign({}, defaultFormatting, formatting)

  if (commentStyle === 'short') {
    prefix = '// '
    header = `${lineSeparator}`
    footer = `${lineSeparator}${lineSeparator}`
  } else if (commentStyle === 'xml') {
    prefix = '  '
    header = `<!--${lineSeparator}`
    footer = `${lineSeparator}-->`
  }

  return `${header}${fn(defaultHeader)
    .map(line => `${prefix}${line}`)
    .join(lineSeparator)}${footer}`
}

module.exports = fileHeader
