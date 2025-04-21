import { sanitizeEnumNames } from 'lib/graphql/sanitizeIntrospection'

describe('sanitizeEnumNames()', () => {
  it('replaces spaces and non-alphanumeric chars with underscores', () => {
    const raw = {
      data: {
        __schema: {
          types: [
            {
              kind: 'ENUM',
              name: 'MyEnum',
              enumValues: [
                { name: 'foo' },
                { name: 'c and d' },
                { name: 'has-dash' },
              ],
            },
            { kind: 'OBJECT', name: 'Other', fields: [] },
          ],
        },
      },
    }

    // deep‑clone to ensure we’re not mutating the original
    const input = JSON.parse(JSON.stringify(raw))
    const out = sanitizeEnumNames(input)
    const enumType = out.data.__schema.types.find((t: any) => t.kind === 'ENUM')
    const names = enumType.enumValues.map((v: any) => v.name)

    expect(names).toEqual(['foo', 'c_and_d', 'has_dash'])
  })

  it('returns the original object if there’s no __schema.types array', () => {
    const junk = { not: { the: 'right shape' } }
    expect(sanitizeEnumNames(junk)).toBe(junk)
  })
})
