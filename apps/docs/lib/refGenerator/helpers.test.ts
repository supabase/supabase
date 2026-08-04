import { describe, expect, it } from 'vitest'

import { compareParamsByRequiredThenName } from './helpers'

type Param = { name?: string; flags?: { isOptional?: boolean } }

const sortNames = (params: Param[]) =>
  [...params].sort(compareParamsByRequiredThenName).map((p) => p.name ?? '')

describe('compareParamsByRequiredThenName', () => {
  it('orders required params before optional ones', () => {
    expect(
      sortNames([
        { name: 'b', flags: { isOptional: true } },
        { name: 'a', flags: { isOptional: false } },
      ])
    ).toEqual(['a', 'b'])
  })

  it('orders alphabetically within the same optionality', () => {
    expect(
      sortNames([
        { name: 'charlie', flags: { isOptional: false } },
        { name: 'alpha', flags: { isOptional: false } },
        { name: 'bravo', flags: { isOptional: false } },
      ])
    ).toEqual(['alpha', 'bravo', 'charlie'])
  })

  it('groups required (alphabetical) before optional (alphabetical)', () => {
    expect(
      sortNames([
        { name: 'opt_b', flags: { isOptional: true } },
        { name: 'req_b', flags: { isOptional: false } },
        { name: 'opt_a', flags: { isOptional: true } },
        { name: 'req_a', flags: { isOptional: false } },
      ])
    ).toEqual(['req_a', 'req_b', 'opt_a', 'opt_b'])
  })

  it('treats missing flags as required and missing names as empty strings', () => {
    expect(
      sortNames([
        { name: 'named', flags: { isOptional: true } },
        { flags: { isOptional: true } }, // optional, no name
        { name: 'required_no_flags' }, // no flags => required
      ])
    ).toEqual(['required_no_flags', '', 'named'])
  })

  it('is a total, symmetric comparator (sign flips when operands swap)', () => {
    const a: Param = { name: 'a', flags: { isOptional: false } }
    const b: Param = { name: 'b', flags: { isOptional: true } }
    expect(Math.sign(compareParamsByRequiredThenName(a, b))).toBe(
      -Math.sign(compareParamsByRequiredThenName(b, a))
    )
    expect(compareParamsByRequiredThenName(a, { ...a })).toBe(0)
  })
})
