import { describe, expect, it } from 'vitest'

import { __parseTypeSpec } from './Reference.typeSpec'

describe('TS type spec parsing', () => {
  it('matches snapshot', async () => {
    const parsed = await __parseTypeSpec()
    const json = JSON.stringify(
      parsed,
      (key, value) => {
        if (key === 'methods') {
          return Object.fromEntries(value.entries())
        } else {
          return value
        }
      },
      2
    )
    expect(json).toMatchSnapshot()
  })
})
