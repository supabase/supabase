import { isEmpty } from 'lodash'

/**
 * convert argument_types = "a integer, b integer"
 * to args = {value: [{name:'a', type:'integer'}, {name:'b', type:'integer'}]}
 */
export function convertArgumentTypes(value: string) {
  const items = value?.split(',')
  if (isEmpty(value) || !items || items?.length == 0) return { value: [] }
  const temp = items
    .map((x) => {
      const str = x.trim()
      const splitted = str.split(' ')
      if (splitted.length === 2) {
        return { name: splitted[0], type: splitted[1] }
      }
      if (splitted.length === 1) {
        return { name: splitted[0], type: splitted[0] }
      }
      console.error('Error while trying to parse function arguments', value)
    })
    .filter(Boolean) as { name: string; type: string }[]
  return { value: temp }
}

/**
 * convert config_params =  {search_path: "auth, public"}
 * to {value: [{name: 'search_path', value: 'auth, public'}]}
 */
export function convertConfigParams(value: Record<string, string> | null | undefined) {
  const temp = []
  if (value) {
    for (var key in value) {
      temp.push({ name: key, value: value[key] })
    }
  }
  return { value: temp }
}

export function hasWhitespace(value: string) {
  return /\s/.test(value)
}
