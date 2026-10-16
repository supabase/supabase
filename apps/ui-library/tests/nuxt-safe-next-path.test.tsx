// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { safeNextPath } from '../../../blocks/vue/registry/default/password-based-auth/nuxtjs/server/utils/safe-next-path'

const origin = 'https://app.example.com'

describe('Nuxt safeNextPath', () => {
  it.each([
    ['/protected', '/protected'],
    ['/agents?tab=connected&sort=name#tools', '/agents?tab=connected&sort=name#tools'],
    ['/./agents', '/agents'],
    ['/a/../agents', '/agents'],
    ['/日本語', '/%E6%97%A5%E6%9C%AC%E8%AA%9E'],
    [undefined, '/'],
    [null, '/'],
    ['', '/'],
    [['/agents', '/other'], '/'],
    ['https://evil.example/agents', '/'],
    ['//evil.example/agents', '/'],
    ['/\\evil.example/agents', '/'],
    ['/\t/evil.example/agents', '/'],
    ['/.//evil.example/agents', '/'],
    ['/a/..//evil.example/agents', '/'],
    ['/%2e//evil.example/agents', '/'],
  ])('maps %j to %j', (input, expected) => {
    expect(safeNextPath(input, origin)).toBe(expected)
  })
})
