export const getAnchor = (text: any): string | undefined => {
  if (typeof text !== 'string') {
    return undefined
  } else {
    const [anchor] = text.match(/{#[a-z-]*}/g) || []
    return anchor !== undefined ? anchor.slice(2, anchor.length - 1) : undefined
  }
}

export const removeAnchor = (text: any) => {
  if (typeof text !== 'string') {
    return text
  } else {
    return text.slice(0, text.indexOf('{#'))
  }
}
