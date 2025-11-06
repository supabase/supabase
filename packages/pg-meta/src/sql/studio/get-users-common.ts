export function prefixToUUID(prefix: string, max: boolean) {
  const mapped = '00000000-0000-0000-0000-000000000000'
    .split('')
    .map((c, i) => (c === '-' ? c : prefix[i] ?? c))

  if (prefix.length >= mapped.length) {
    return mapped.join('')
  }

  if (prefix.length && prefix.length < 15) {
    mapped[14] = '4'
  }

  if (prefix.length && prefix.length < 20) {
    mapped[19] = max ? 'b' : '8'
  }

  if (max) {
    for (let i = prefix.length; i < mapped.length; i += 1) {
      if (mapped[i] === '0') {
        mapped[i] = 'f'
      }
    }
  }

  return mapped.join('')
}

export function stringRange(prefix: string): [string, string | undefined] {
  if (!prefix) {
    return [prefix, undefined]
  }

  const lastCharCode = prefix.charCodeAt(prefix.length - 1)
  const TILDE_CHAR_CODE = 126 // '~'
  const Z_CHAR_CODE = 122 // 'z'

  // 'z' (122): append '~' to avoid PostgreSQL collation issues with '{'
  if (lastCharCode === Z_CHAR_CODE) {
    return [prefix, prefix + '~']
  }

  // '~' (126) or beyond: append space since we can't increment further
  if (lastCharCode >= TILDE_CHAR_CODE) {
    return [prefix, prefix + ' ']
  }

  // All other characters: increment the last character
  const upperBound = prefix.substring(0, prefix.length - 1) + String.fromCharCode(lastCharCode + 1)
  return [prefix, upperBound]
}
