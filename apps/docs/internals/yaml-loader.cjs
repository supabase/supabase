const { parse } = require('yaml')

module.exports = function yamlLoader(source) {
  const data = parse(source)
  return `export default ${JSON.stringify(data)}`
}
