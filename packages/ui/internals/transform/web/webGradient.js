const TinyColor = require('@ctrl/tinycolor')

module.exports = {
  type: 'value',
  matcher: function (token) {
    return token.type === 'custom-gradient'
  },
  transformer: function ({ value }) {
    const stopsString = value.stops.map(stop => {
      return `${new TinyColor.TinyColor(stop.color).toRgbString()} ${stop.position * 100}%`
    }).join(', ')
    if (value.gradientType === 'linear') {
      return `linear-gradient(${value.rotation}deg, ${stopsString})`
    }
    if (value.gradientType === 'radial') {
      return `radial-gradient(${stopsString})`
    }
  }
}
