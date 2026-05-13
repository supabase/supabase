const { parse } = require('smol-toml')

module.exports = function tomlLoader(source) {
  const json = parse(source)
  return `export default ${JSON.stringify(json)}`
}
