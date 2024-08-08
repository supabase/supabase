const formattedVariables = require('./formattedVariables')
const fileHeader = require('./fileHeader')

const filteredTokens = (dictionary, filterFn) => {
  const filtered = dictionary.allTokens.filter(token => filterFn(token))
  return {
    ...dictionary,
    ...{
      allProperties: filtered,
      allTokens: filtered
    }
  }
}

module.exports = ({ dictionary, options, file }) => {
  const opts = options ?? {}
  const { outputReferences } = opts
  const groupedTokens = {
    // if you export the prefixes use token.path[0] instead of [1]
    light: filteredTokens(dictionary, (token) => token.path[1].toLowerCase() === 'light'),
    dark: filteredTokens(dictionary, (token) => token.path[1].toLowerCase() === 'dark'),
    rest: filteredTokens(dictionary, (token) => !['light', 'dark'].includes(token.path[1].toLowerCase()))
  }

  return (
    fileHeader({ file }) +
      ':root {\n' +
      formattedVariables({ format: 'css', dictionary: groupedTokens.rest, outputReferences }) +
      '\n}\n\n' +
      '@media (prefers-color-scheme: light) {\n' +
      ' :root {\n' +
      formattedVariables({ format: 'css', dictionary: groupedTokens.light, outputReferences }) +
      '\n }\n}\n\n' +
      '@media (prefers-color-scheme: dark) {\n' +
      ' :root {\n' +
      formattedVariables({ format: 'css', dictionary: groupedTokens.dark, outputReferences }) +
      '\n }\n}\n\n' +
      'html[data-theme="light"] {\n' +
      formattedVariables({ format: 'css', dictionary: groupedTokens.light, outputReferences }) +
      '\n}\n\n' +
      'html[data-theme="dark"] {\n' +
      formattedVariables({ format: 'css', dictionary: groupedTokens.dark, outputReferences }) +
      '\n}\n'
  )
}
