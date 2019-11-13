import assert from 'assert'

export function compareKeys (first, second) {
  Object.keys(first).map(key => assert(Object.keys(second).includes(key)))
}