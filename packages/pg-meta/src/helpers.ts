import { literal } from './pg-format'

export function filterByList(include?: string[], exclude?: string[], defaultExclude?: string[]) {
  if (defaultExclude) {
    exclude = defaultExclude.concat(exclude ?? [])
  }
  if (include?.length) {
    return `IN (${include.map(literal).join(',')})`
  } else if (exclude?.length) {
    return `NOT IN (${exclude.map(literal).join(',')})`
  }
  return ''
}
