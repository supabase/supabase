export const getAnchor = (text: any): string | undefined => {
  if (typeof text !== 'string') {
    return undefined
  } else {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/[ ]/g, '-')
  }
}

export const removeAnchor = (text: any) => {
  if (typeof text !== 'string') {
    return text
  } else {
    if (text.indexOf('{#') > 0) return text.slice(0, text.indexOf('{#'))
    else return text
  }
}
