// get reading time
// returns :string
export const generateReadingTime = (text: string) => {
  const wordsPerMinute = 200
  const noOfWords = text.split(/\s/g).length
  const minutes = noOfWords / wordsPerMinute
  const readTime = Math.ceil(minutes)
  return `${readTime} minute read`
}
// Helps with the TypeScript issue where filtering doesn't narrows undefined nor null types, check https://github.com/microsoft/TypeScript/issues/16069
export function isNotNullOrUndefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function capitalize(word: string) {
  return word[0].toUpperCase() + word.substring(1).toLowerCase()
}

export function isMobileOrTablet() {
  // https://stackoverflow.com/a/8876069/114157
  const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  return viewportWidth < 1200
}

// Convert numbers or strings to pixel value
// Helpful for styled-jsx when using a prop
// height: ${toPixels(height)}; (supports height={20} and height="20px")

export const toPixels = (value: string | number) => {
  if (typeof value === 'number') {
    return `${value}px`
  }

  return value
}

export const isBrowser = typeof window !== 'undefined'

export const stripEmojis = (str: string) =>
  str
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim()
