// get reading time
// returns :string
export const generateReadingTime = (text: string) => {
  const wordsPerMinute = 200
  const noOfWords = text.split(/\s/g).length
  const minutes = noOfWords / wordsPerMinute
  const readTime = Math.ceil(minutes)
  return `${readTime} minute read`
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
