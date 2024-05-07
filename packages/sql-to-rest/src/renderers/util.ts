import { Target } from '../processor'

// TODO: format multiline targets downstream instead of here
export function renderTargets(
  targets: Target[],
  multiline?: { initialIndent: number; indent: number }
) {
  const indentation = multiline ? ' '.repeat(multiline.initialIndent) : ''
  const maybeNewline = multiline ? '\n' : ''

  return targets
    .map((target) => {
      if (target.type === 'column-target') {
        const { column, alias, cast } = target
        let value = column

        if (alias && alias !== column) {
          value = `${alias}:${value}`
        }

        if (cast) {
          value = `${value}::${cast}`
        }

        value = `${indentation}${value}`

        return value
      } else if (target.type === 'embedded-target') {
        const { relation, alias, joinType, targets, flatten } = target
        let value = relation

        if (joinType === 'inner') {
          value = `${value}!inner`
        }

        if (alias && alias !== relation) {
          value = `${alias}:${value}`
        }

        if (flatten) {
          value = `...${value}`
        }

        if (targets.length > 0) {
          value = `${indentation}${value}(${maybeNewline}${renderTargets(targets, multiline ? { ...multiline, initialIndent: multiline.initialIndent + multiline.indent } : undefined)}${maybeNewline}${indentation})`
        } else {
          value = `${indentation}${value}()`
        }

        return value
      }
    })
    .join(',' + maybeNewline)
}

export const defaultCharacterWhitelist = ['*', '(', ')', ',', ':', '!', '>', '-']

/**
 * URI encodes query parameters with an optional character whitelist
 * that should not be encoded.
 */
export function uriEncodeParams(
  params: URLSearchParams,
  characterWhitelist: string[] = defaultCharacterWhitelist
) {
  return uriDecodeCharacters(params.toString(), characterWhitelist)
}

/**
 * URI encodes a string with an optional character whitelist
 * that should not be encoded.
 */
export function uriEncode(value: string, characterWhitelist: string[] = defaultCharacterWhitelist) {
  return uriDecodeCharacters(encodeURIComponent(value), characterWhitelist)
}

function uriDecodeCharacters(value: string, characterWhitelist: string[]) {
  let newValue = value

  // Convert whitelisted characters back from their hex representation (eg. '%2A' -> '*')
  for (const char of characterWhitelist) {
    const hexCode = char.charCodeAt(0).toString(16).toUpperCase()
    newValue = newValue.replaceAll(`%${hexCode}`, char)
  }

  return newValue
}
