// get reading time
// returns :string
export const generateReadingTime = (text: string) => {
  console.log(text ? 'HAS TEXT' : 'NO TEXT')
  if (!text) {
    console.log(text)
  }
  const wordsPerMinute = 200
  const noOfWords = text.split(/\s/g).length
  const minutes = noOfWords / wordsPerMinute
  const readTime = Math.ceil(minutes)
  return `${readTime} minute read`
}

export function capitalize(word: string) {
  return word[0].toUpperCase() + word.substring(1).toLowerCase()
}
