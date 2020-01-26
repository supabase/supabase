export function Eq(columnName, filterValue) {
  return `${columnName}=eq.${filterValue}`
}

export function Gt(columnName, filterValue) {
  return `${columnName}=gt.${filterValue}`
}

export function Lt(columnName, filterValue) {
  return `${columnName}=lt.${filterValue}`
}

export function Gte(columnName, filterValue) {
  return `${columnName}=gte.${filterValue}`
}

export function Lte(columnName, filterValue) {
  return `${columnName}=lte.${filterValue}`
}

export function Like(columnName, stringPattern) {
  let stringPatternEnriched = stringPattern.replace(/%/g, '*')

  return `${columnName}=like.${stringPatternEnriched}`
}

export function Ilike(columnName, stringPattern) {
  let stringPatternEnriched = stringPattern.replace(/%/g, '*')

  return `${columnName}=ilike.${stringPatternEnriched}`
}

export function Is(columnName, filterValue) {
  return `${columnName}=is.${filterValue}`
}

export function In(columnName, filterArray) {
  return `${columnName}=in.${filterArray.join(',')}`
}

export function Not(columnName, filterValue) {
  return `${columnName}=not.${filterValue}`
}
