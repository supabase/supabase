import { isEmpty } from 'lodash'

/**
 * convert argument_types = "a integer, b integer"
 * to args = {value: [{name:'a', type:'integer'}, {name:'b', type:'integer'}]}
 */
export function convertArgumentTypes(value: string) {
  const items = value?.split(',').map((item) => item.trim())
  if (isEmpty(value) || !items || items.length === 0) return { value: [] }

  const temp = items
    .map((x) => {
      const regex = /(\w+)\s+([\w\[\]]+)(?:\s+DEFAULT\s+(.*))?/i
      const match = x.match(regex)
      if (match) {
        const [, name, type, defaultValue] = match
        let parsedDefaultValue = defaultValue ? defaultValue.trim() : undefined

        if (
          ['timestamp', 'time', 'timetz', 'timestamptz'].includes(type.toLowerCase()) &&
          parsedDefaultValue
        ) {
          parsedDefaultValue = `'${parsedDefaultValue}'`
        }

        return { name, type, defaultValue: parsedDefaultValue }
      } else {
        console.error('Error while trying to parse function arguments', x)
        return null
      }
    })
    .filter(Boolean) as { name: string; type: string; defaultValue?: string }[]
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
