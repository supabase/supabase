/**
 * TEMPORARY. Delete once Spark (turso) has `aclexplode`.
 *
 * `aclexplode` in TypeScript, over an ACL's text (`{grantee=privileges/grantor,...}`): the privilege
 * fallbacks read `relacl`, `proacl` and `defaclacl` as text, which turso returns.
 */

// Privilege letters in `aclexplode`'s output order (the ACL bit order).
const PRIVILEGES: Array<[string, string]> = [
  ['a', 'INSERT'],
  ['r', 'SELECT'],
  ['w', 'UPDATE'],
  ['d', 'DELETE'],
  ['D', 'TRUNCATE'],
  ['x', 'REFERENCES'],
  ['t', 'TRIGGER'],
  ['X', 'EXECUTE'],
  ['U', 'USAGE'],
  ['C', 'CREATE'],
  ['T', 'TEMPORARY'],
  ['c', 'CONNECT'],
  ['s', 'SET'],
  ['A', 'ALTER SYSTEM'],
  ['m', 'MAINTAIN'],
]

export type AclPrivilege = {
  grantor: string
  /** `PUBLIC` for the public pseudo-role, as pg-meta names it. */
  grantee: string
  privilege_type: string
  is_grantable: boolean
}

/** The elements of a Postgres array's text form (one level). */
function arrayElements(text: string): string[] {
  const body = text.trim().replace(/^\{/, '').replace(/\}$/, '')
  const elements: string[] = []
  let current = ''
  let quoted = false
  for (let i = 0; i < body.length; i++) {
    const char = body[i]
    if (quoted && char === '\\') current += body[++i] ?? ''
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) {
      elements.push(current)
      current = ''
    } else current += char
  }
  if (body.length > 0) elements.push(current)
  return elements
}

/** A role name in an aclitem: bare, or double-quoted with `""` for a quote. */
function readRole(text: string, start: number): [string, number] {
  if (text[start] !== '"') {
    let end = start
    while (end < text.length && text[end] !== '=' && text[end] !== '/') end++
    return [text.slice(start, end), end]
  }
  let name = ''
  let i = start + 1
  while (i < text.length) {
    if (text[i] === '"' && text[i + 1] === '"') {
      name += '"'
      i += 2
    } else if (text[i] === '"') return [name, i + 1]
    else name += text[i++]
  }
  return [name, i]
}

/** `aclexplode(acl)` for an ACL's text; `null` reads as no privileges. */
export function explodeAcl(acl: string | null | undefined): AclPrivilege[] {
  if (acl === null || acl === undefined) return []
  return arrayElements(acl).flatMap((item) => {
    const [grantee, afterGrantee] = readRole(item, 0)
    const slash = item.lastIndexOf('/')
    const letters = item.slice(afterGrantee + 1, slash)
    const [grantor] = readRole(item, slash + 1)
    return PRIVILEGES.flatMap(([letter, privilege_type]) => {
      const index = letters.indexOf(letter)
      if (index === -1) return []
      return [
        {
          grantor,
          grantee: grantee === '' ? 'PUBLIC' : grantee,
          privilege_type,
          is_grantable: letters[index + 1] === '*',
        },
      ]
    })
  })
}
