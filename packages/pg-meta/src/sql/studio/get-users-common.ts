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

export function stringRange(prefix: string) {
  if (!prefix) {
    return [prefix, undefined]
  }

  const lastChar = prefix.charCodeAt(prefix.length - 1)

  if (lastChar >= `~`.charCodeAt(0)) {
    // not ASCII
    return [prefix, prefix]
  }

  return [prefix, prefix.substring(0, prefix.length - 1) + String.fromCharCode(lastChar + 1)]
}
