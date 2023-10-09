module.exports = {
  type: 'value',
  matcher: function (token) {
    return token.type === 'custom-radius'
  },
  transformer: function ({ value }) {
    if ([value.topRight, value.bottomLeft, value.bottomRight].every(v => v === value.topLeft)) {
      return `${value.topLeft}px`
    }
    return `${value.topLeft}px ${value.topRight}px ${value.bottomLeft}px ${value.bottomRight}px`
  }
}
