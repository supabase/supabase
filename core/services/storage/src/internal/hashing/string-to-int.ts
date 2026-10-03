export function hashStringToInt(str: string): number {
  let hash = 5381
  let i = -1
  while (i < str.length - 1) {
    i += 1
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0
}
