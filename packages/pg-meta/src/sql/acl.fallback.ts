/**
 * TEMPORARY. Delete once Spark (turso) has `aclexplode`.
 *
 * `aclexplode` in TypeScript, over an ACL's text (`{grantee=privileges/grantor,...}`): the privilege
 * fallbacks read `relacl`, `proacl` and `defaclacl` as text, which turso returns.
 */

import { parseTextArray } from '../helpers'

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

/** A role name in an aclitem from `start`: bare up to `=` or `/`, or double-quoted with `""`. */
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

/** `grantee=privileges/grantor`, read left to right so a quoted name may hold `=`, `/` or `"`. */
function readAclItem(item: string) {
  const [grantee, afterGrantee] = readRole(item, 0)
  if (item[afterGrantee] !== '=') throw new Error(`Unexpected aclitem: ${item}`)
  const slash = item.indexOf('/', afterGrantee + 1)
  if (slash === -1) throw new Error(`Unexpected aclitem: ${item}`)
  const [grantor] = readRole(item, slash + 1)
  return { grantee, letters: item.slice(afterGrantee + 1, slash), grantor }
}

/** `aclexplode(acl)` for an ACL's text; `null` reads as no privileges. */
export function explodeAcl(acl: string | null | undefined): AclPrivilege[] {
  if (acl === null || acl === undefined) return []
  return parseTextArray(acl).flatMap((element) => {
    if (element === null) return []
    const { grantee, letters, grantor } = readAclItem(element)
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
