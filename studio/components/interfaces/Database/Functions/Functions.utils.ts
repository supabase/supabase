import { Dictionary } from 'components/grid'
import { isEmpty } from 'lodash'

/**
 * convert argument_types = "a integer, b integer"
 * to args = {value: [{name:'a', type:'integer'}, {name:'b', type:'integer'}]}
 */
export function convertArgumentTypes(value: string) {
  const items = value?.split(',')
  if (isEmpty(value) || !items || items?.length == 0) return { value: [] }
  const temp = items.map((x) => {
    const str = x.trim()
    const space = str.indexOf(' ')
    const name = str.slice(0, space !== 1 ? space : 0)
    const type = str.slice(space + 1)
    return { name, type }
  })
  return { value: temp }
}

/**
 * convert config_params =  {search_path: "auth, public"}
 * to {value: [{name: 'search_path', value: 'auth, public'}]}
 */
export function convertConfigParams(value: Dictionary<any>) {
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
