type SourceToken = { value: string; string?: boolean }

/** A bounded lexical scan for route declarations, not a JavaScript evaluator or an import graph. */
export function sourceTokens(source: string): SourceToken[] {
  const tokens: SourceToken[] = []
  for (let index = 0; index < source.length; ) {
    const character = source[index]
    if (/\s/.test(character)) {
      index++
      continue
    }
    if (source.startsWith('//', index)) {
      const newline = source.indexOf('\n', index + 2)
      index = newline < 0 ? source.length : newline + 1
      continue
    }
    if (source.startsWith('/*', index)) {
      const end = source.indexOf('*/', index + 2)
      index = end < 0 ? source.length : end + 2
      continue
    }
    if (character === '"' || character === "'" || character === '`') {
      const start = ++index
      while (index < source.length && source[index] !== character) {
        if (source[index] === '\\') index++
        index++
      }
      // Templates are opaque: apparent exports or routes inside them are text.
      tokens.push({ value: character === '`' ? '' : source.slice(start, index), string: true })
      index++
      continue
    }
    if (
      character === '/' &&
      /^(?:=|\(|\[|,|:|return|=>|!|\?)$/.test(tokens[tokens.length - 1]?.value ?? '=')
    ) {
      index++
      let characterClass = false
      while (index < source.length) {
        if (source[index] === '\\') {
          index += 2
          continue
        }
        if (source[index] === '[') characterClass = true
        if (source[index] === ']') characterClass = false
        if (source[index++] === '/' && !characterClass) break
      }
      tokens.push({ value: '', string: true })
      continue
    }
    const word = source.slice(index).match(/^[\w$]+/)
    if (word) {
      tokens.push({ value: word[0] })
      index += word[0].length
      continue
    }
    tokens.push({ value: character })
    index++
  }
  return tokens
}

export function exportedNames(tokens: SourceToken[]): Set<string> {
  const names = new Set<string>()
  let depth = 0
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (token.string) continue
    if (token.value === '{') depth++
    if (token.value === '}') depth--
    if (token.value !== 'export' || depth !== 0) continue
    let next = index + 1
    if (tokens[next]?.value === 'default') names.add('default')
    if (tokens[next]?.value === 'async') next++
    if (['function', 'const', 'let', 'var', 'class'].includes(tokens[next]?.value)) {
      names.add(tokens[next + 1]?.value)
    }
    if (tokens[next]?.value === '{') {
      let last = ''
      for (let cursor = next + 1; cursor < tokens.length; cursor++) {
        if ([',', '}'].includes(tokens[cursor].value)) {
          if (last) names.add(last)
          last = ''
          if (tokens[cursor].value === '}') break
        } else last = tokens[cursor].value
      }
    }
  }
  return names
}

/** Read top-level option keys from the literal passed to createFileRoute('...')({...}). */
export function tanstackDeclaration(
  tokens: SourceToken[]
): { route: string; component: boolean; server: boolean } | undefined {
  if (!exportedNames(tokens).has('Route')) return undefined
  for (let index = 0; index < tokens.length; index++) {
    if (!['createFileRoute', 'createLazyFileRoute'].includes(tokens[index].value)) continue
    const route = tokens[index + 2]
    if (
      tokens[index + 1]?.value !== '(' ||
      !route?.string ||
      !route.value.startsWith('/') ||
      route.value.includes('\\')
    )
      continue
    if (
      tokens[index + 3]?.value !== ')' ||
      tokens[index + 4]?.value !== '(' ||
      tokens[index + 5]?.value !== '{'
    )
      continue
    let depth = 1
    let component = false
    let server = false
    for (let cursor = index + 6; cursor < tokens.length && depth > 0; cursor++) {
      const value = tokens[cursor].value
      if (depth === 1 && tokens[cursor + 1]?.value === ':') {
        if (value === 'component') component = true
        if (value === 'server') server = true
      }
      if (['{', '(', '['].includes(value) && !tokens[cursor].string) depth++
      if (['}', ')', ']'].includes(value) && !tokens[cursor].string) depth--
    }
    return { route: route.value, component, server }
  }
  return undefined
}
