const TinyColor = require('@ctrl/tinycolor')

module.exports = {
  type: 'value',
  matcher: function (token) {
    return token.type === 'color'
  },
  transformer: function ({ value }) {
    return `${new TinyColor.TinyColor(value).toRgbString()}`
  }
}
