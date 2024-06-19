module.exports = {
  type: 'value',
  matcher: function (token) {
    return token.type === 'custom-spacing'
  },
  transformer: ({ value: { top, left, bottom, right } }) => {
    if ([bottom, left, right].every(v => v === top)) {
      return `${top}px`
    }
    return `${top}px ${right}px ${bottom}px ${left}px`
  }
}
