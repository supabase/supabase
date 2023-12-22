export function countWords(s: string) {
  return s.trim().split(/s+/g).length
}
