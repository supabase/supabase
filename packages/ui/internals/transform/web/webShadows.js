const TinyColor = require('@ctrl/tinycolor')

module.exports = {
  type: 'value',
  matcher: function (token) {
    return token.type === 'custom-shadow' && token.value !== 0
  },
  transformer: function ({ value }) {
    return `${value.shadowType === 'innerShadow' ? 'inset ' : ''}${value.offsetX}px ${value.offsetY}px ${value.radius}px ${value.spread}px ${new TinyColor.TinyColor(value.color).toRgbString()}`
  }
}
