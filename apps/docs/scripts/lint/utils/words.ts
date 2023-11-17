export function pluralize(word: string) {
  return [word, `${word}s`]
}

export function stripSymbols(word: string) {
  return word.replace(/\W/g, '')
}
