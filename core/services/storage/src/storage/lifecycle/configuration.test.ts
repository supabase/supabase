import {
  compileLifecycleEvaluationRules,
  lifecycleConfigurationsEqual,
  lifecycleConfigurationToS3,
  noncurrentCutoffAt,
  normalizeLifecycleConfiguration,
  normalizeS3LifecycleConfiguration,
} from './configuration'

describe('lifecycle configuration', () => {
  test.each([
    { normalize: normalizeLifecycleConfiguration, field: 'LifecycleConfiguration' },
    { normalize: normalizeS3LifecycleConfiguration, field: 'rules' },
  ])('rejects the extra $field field in a mixed canonical and S3 wrapper', ({
    normalize,
    field,
  }) => {
    expect(() =>
      normalize({
        rules: [
          {
            id: 'expire-history',
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: { noncurrentDays: 30 },
          },
        ],
        LifecycleConfiguration: {
          Rule: [
            {
              ID: 'other',
              Status: 'Disabled',
              Filter: {},
              NoncurrentVersionExpiration: { NoncurrentDays: 1 },
            },
          ],
        },
      })
    ).toThrow(
      expect.objectContaining({
        category: 'MALFORMED_XML',
        message: `Lifecycle configuration contains unsupported field ${field}`,
      })
    )
  })

  test('normalizes the S3 shape and round-trips the stored representation', () => {
    const canonical = normalizeS3LifecycleConfiguration({
      LifecycleConfiguration: {
        Rule: [
          {
            ID: 'keep-two',
            Status: 'Enabled',
            Filter: '',
            NoncurrentVersionExpiration: {
              NoncurrentDays: ' 30 ',
              NewerNoncurrentVersions: '\n2\n',
            },
          },
          {
            Status: 'Disabled',
            Filter: {},
            NoncurrentVersionExpiration: { NoncurrentDays: 7 },
          },
        ],
      },
    })

    expect(canonical).toEqual({
      rules: [
        {
          id: 'keep-two',
          status: 'Enabled',
          filter: {},
          noncurrentVersionExpiration: {
            noncurrentDays: 30,
            newerNoncurrentVersions: 2,
          },
        },
        {
          id: expect.stringMatching(/^rule-[0-9a-f]{64}$/),
          status: 'Disabled',
          filter: {},
          noncurrentVersionExpiration: { noncurrentDays: 7 },
        },
      ],
    })
    expect(normalizeLifecycleConfiguration(canonical)).toEqual(canonical)
    expect(normalizeS3LifecycleConfiguration(lifecycleConfigurationToS3(canonical))).toEqual(
      canonical
    )
  })

  test('canonicalizes an empty REST filter prefix before generating rule IDs', () => {
    const rule = {
      status: 'Enabled',
      noncurrentVersionExpiration: { noncurrentDays: 30, newerNoncurrentVersions: 2 },
    }
    const canonical = normalizeLifecycleConfiguration({ rules: [{ ...rule, filter: {} }] })
    const withPrefix = normalizeLifecycleConfiguration({
      rules: [{ ...rule, filter: { prefix: '' } }],
    })

    expect(withPrefix).toEqual(canonical)
    expect(withPrefix.rules[0].filter).toEqual({})
    expect(lifecycleConfigurationsEqual(canonical, withPrefix)).toBe(true)
  })

  test.each([false, true])('rejects legacy REST prefixes with filter present=%s', (withFilter) => {
    expect(() =>
      normalizeLifecycleConfiguration({
        rules: [
          {
            status: 'Enabled',
            legacyPrefix: '',
            ...(withFilter ? { filter: {} } : {}),
            noncurrentVersionExpiration: { noncurrentDays: 30 },
          },
        ],
      })
    ).toThrow('Rule 1 contains unsupported field legacyPrefix')
  })

  test.each([false, true])('rejects legacy S3 prefixes with Filter present=%s', (withFilter) => {
    expect(() =>
      normalizeS3LifecycleConfiguration({
        LifecycleConfiguration: {
          Rule: [
            {
              Status: 'Enabled',
              Prefix: '',
              ...(withFilter ? { Filter: '' } : {}),
              NoncurrentVersionExpiration: { NoncurrentDays: 30 },
            },
          ],
        },
      })
    ).toThrow(
      expect.objectContaining({
        category: 'INVALID_REQUEST',
        message: 'Rule 1 contains unsupported element Prefix; use Filter instead',
      })
    )
  })

  test('rejects a null filter instead of coercing it to a whole-bucket filter', () => {
    expect(() =>
      normalizeLifecycleConfiguration({
        rules: [
          {
            id: 'expire-history',
            status: 'Enabled',
            filter: null,
            noncurrentVersionExpiration: { noncurrentDays: 30 },
          },
        ],
      })
    ).toThrow('Rule 1 filter must be an object')
  })

  test.each([
    [null, 'Rule 1 noncurrentVersionExpiration must be an object'],
    [{}, 'Rule 1 noncurrentVersionExpiration must contain noncurrentDays'],
    [
      { noncurrentDays: 1, unexpected: true },
      'Rule 1 expiration contains unsupported field unexpected',
    ],
  ])('uses canonical field names for invalid expiration %j', (expiration, message) => {
    expect(() =>
      normalizeLifecycleConfiguration({
        rules: [
          {
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: expiration,
          },
        ],
      })
    ).toThrow(expect.objectContaining({ category: 'MALFORMED_XML', message }))
  })

  test('rejects an invalid canonical status', () => {
    expect(() =>
      normalizeLifecycleConfiguration({
        rules: [
          {
            status: 'Foo',
            filter: {},
            noncurrentVersionExpiration: { noncurrentDays: 1 },
          },
        ],
      })
    ).toThrow(
      expect.objectContaining({
        category: 'MALFORMED_XML',
        message: 'Rule 1 Status must be Enabled or Disabled',
      })
    )
  })

  test('canonicalizes an empty V2 Prefix filter as a whole-bucket filter', () => {
    const withEmptyPrefix = normalizeS3LifecycleConfiguration({
      LifecycleConfiguration: {
        Rule: [
          {
            Status: 'Enabled',
            Filter: { Prefix: '' },
            NoncurrentVersionExpiration: { NoncurrentDays: 30 },
          },
        ],
      },
    })
    const withEmptyFilter = normalizeS3LifecycleConfiguration({
      LifecycleConfiguration: {
        Rule: [
          {
            Status: 'Enabled',
            Filter: {},
            NoncurrentVersionExpiration: { NoncurrentDays: 30 },
          },
        ],
      },
    })

    expect(withEmptyPrefix).toEqual(withEmptyFilter)
    expect(withEmptyPrefix.rules[0]).toHaveProperty('filter', {})
  })

  test('treats an empty rule ID as omitted for deterministic generation', () => {
    const s3Rule = {
      Status: 'Enabled',
      Filter: {},
      NoncurrentVersionExpiration: { NoncurrentDays: 30 },
    }
    const omitted = normalizeS3LifecycleConfiguration({
      LifecycleConfiguration: { Rule: [s3Rule] },
    })
    const emptyS3Id = normalizeS3LifecycleConfiguration({
      LifecycleConfiguration: { Rule: [{ ...s3Rule, ID: '' }] },
    })
    const emptyCanonicalId = normalizeLifecycleConfiguration({
      rules: [
        {
          id: '',
          status: 'Enabled',
          filter: {},
          noncurrentVersionExpiration: { noncurrentDays: 30 },
        },
      ],
    })

    expect(emptyS3Id).toEqual(omitted)
    expect(emptyCanonicalId).toEqual(omitted)
    expect(omitted.rules[0].id).toMatch(/^rule-[0-9a-f]{64}$/)
  })

  test.each([
    [
      { status: 'Enabled', filter: {}, noncurrentVersionExpiration: { noncurrentDays: 30 } },
      'rule-b1edf8f10cd725d14ea3363516fdc65e2abf5067496cd29f93e4e096973af83b',
    ],
    [
      {
        status: 'Disabled',
        filter: {},
        noncurrentVersionExpiration: { noncurrentDays: 1, newerNoncurrentVersions: 100 },
      },
      'rule-0c581528b548f40a7eadbe92a33200d5b0848abe25fb87954e2c16af02d892ff',
    ],
    [
      {
        status: 'Disabled',
        filter: {},
        noncurrentVersionExpiration: {
          noncurrentDays: 2147483647,
          newerNoncurrentVersions: 1,
        },
      },
      'rule-a9a5c3722f173c1246ffaaac52f366bf4c84aa75872de5b23a71347c7c3dec0c',
    ],
  ])('preserves previously generated IDs for %j', (rule, id) => {
    expect(normalizeLifecycleConfiguration({ rules: [rule] }).rules[0].id).toBe(id)
  })

  test('generates deterministic collision-safe IDs independent of rule order', () => {
    const rules = [
      {
        Status: 'Enabled',
        Filter: {},
        NoncurrentVersionExpiration: { NoncurrentDays: 30 },
      },
      {
        Status: 'Disabled',
        Filter: {},
        NoncurrentVersionExpiration: { NoncurrentDays: 7 },
      },
    ]
    const normalize = (Rule: unknown[]) =>
      normalizeS3LifecycleConfiguration({ LifecycleConfiguration: { Rule } })
    const idsByDays = (configuration: ReturnType<typeof normalize>) =>
      new Map(
        configuration.rules.map((rule) => [
          rule.noncurrentVersionExpiration.noncurrentDays,
          rule.id,
        ])
      )

    expect(idsByDays(normalize([...rules].reverse()))).toEqual(idsByDays(normalize(rules)))

    const duplicates = normalize([rules[0], rules[0]])
    expect(duplicates.rules[0].id).toMatch(/^rule-[0-9a-f]{64}$/)
    expect(duplicates.rules[1].id).toBe(`${duplicates.rules[0].id}-1`)

    const generatedId = normalize([rules[0]]).rules[0].id
    const explicitCollision = normalize([
      rules[0],
      {
        ...rules[1],
        ID: generatedId,
      },
    ])
    expect(explicitCollision.rules.map((rule) => rule.id)).toEqual([
      `${generatedId}-1`,
      generatedId,
    ])
  })

  test('preserves suffix order at the rule limit with explicit collision reservations', () => {
    const rule = {
      status: 'Enabled',
      filter: {},
      noncurrentVersionExpiration: { noncurrentDays: 30 },
    }
    const base = 'rule-b1edf8f10cd725d14ea3363516fdc65e2abf5067496cd29f93e4e096973af83b'
    const reservedIds = [base, `${base}-1`, `${base}-3`]
    const input = {
      rules: [
        ...Array.from({ length: 997 }, () => rule),
        ...reservedIds.map((id) => ({ ...rule, id })),
      ],
    }
    const configuration = normalizeLifecycleConfiguration(input)

    expect(configuration.rules.map((value) => value.id)).toEqual([
      `${base}-2`,
      ...Array.from({ length: 996 }, (_, index) => `${base}-${index + 4}`),
      ...reservedIds,
    ])
    expect(normalizeLifecycleConfiguration(input)).toEqual(configuration)
    expect(normalizeS3LifecycleConfiguration(lifecycleConfigurationToS3(configuration))).toEqual(
      configuration
    )
  })

  test('ignores rule order but preserves ID significance for generation equality', () => {
    const configuration = normalizeS3LifecycleConfiguration({
      LifecycleConfiguration: {
        Rule: [
          {
            ID: 'first',
            Status: 'Enabled',
            Filter: '',
            NoncurrentVersionExpiration: { NoncurrentDays: 30 },
          },
          {
            ID: 'second',
            Status: 'Disabled',
            Filter: '',
            NoncurrentVersionExpiration: { NoncurrentDays: 7 },
          },
        ],
      },
    })

    expect(
      lifecycleConfigurationsEqual(configuration, {
        rules: [...configuration.rules].reverse(),
      })
    ).toBe(true)
    expect(
      lifecycleConfigurationsEqual(configuration, {
        rules: configuration.rules.map((rule) => ({ ...rule, id: `${rule.id}-renamed` })),
      })
    ).toBe(false)
    expect(lifecycleConfigurationsEqual(configuration, structuredClone(configuration))).toBe(true)
    expect(lifecycleConfigurationsEqual(null, configuration)).toBe(false)
  })

  test('compares canonical rules field-by-field instead of relying on object key order', () => {
    const left = {
      rules: [
        {
          id: 'expire-history',
          status: 'Enabled' as const,
          filter: {},
          noncurrentVersionExpiration: {
            noncurrentDays: 30,
            newerNoncurrentVersions: 2,
          },
        },
      ],
    }
    const right = {
      rules: [
        {
          noncurrentVersionExpiration: {
            newerNoncurrentVersions: 2,
            noncurrentDays: 30,
          },
          filter: {},
          status: 'Enabled' as const,
          id: 'expire-history',
        },
      ],
    }

    expect(lifecycleConfigurationsEqual(left, right)).toBe(true)
  })

  test('accepts only the S3 lifecycle namespace', () => {
    const input = {
      LifecycleConfiguration: {
        $: { xmlns: 'http://s3.amazonaws.com/doc/2006-03-01/' },
        Rule: [
          {
            Status: 'Enabled',
            Filter: '',
            NoncurrentVersionExpiration: { NoncurrentDays: '1' },
          },
        ],
      },
    }

    expect(normalizeS3LifecycleConfiguration(input)).toMatchObject({
      rules: [{ status: 'Enabled', noncurrentVersionExpiration: { noncurrentDays: 1 } }],
    })
    expect(() =>
      normalizeS3LifecycleConfiguration({
        LifecycleConfiguration: {
          ...input.LifecycleConfiguration,
          $: { xmlns: 'urn:not-s3' },
        },
      })
    ).toThrow('invalid XML namespace')
  })

  test('accepts one to 1000 rules', () => {
    const rule = {
      Status: 'Enabled',
      Filter: {},
      NoncurrentVersionExpiration: { NoncurrentDays: 1 },
    }

    expect(
      normalizeS3LifecycleConfiguration({
        LifecycleConfiguration: { Rule: Array.from({ length: 1000 }, () => rule) },
      }).rules
    ).toHaveLength(1000)
    expect(() =>
      normalizeS3LifecycleConfiguration({ LifecycleConfiguration: { Rule: [] } })
    ).toThrow('between 1 and 1000')
    expect(() =>
      normalizeS3LifecycleConfiguration({
        LifecycleConfiguration: { Rule: Array.from({ length: 1001 }, () => rule) },
      })
    ).toThrow('between 1 and 1000')
  })

  test.each([
    [
      {
        Status: 'Enabled',
        Filter: {},
        NoncurrentVersionExpiration: { NoncurrentDays: 0 },
      },
      'INVALID_ARGUMENT',
      "'NoncurrentDays' for NoncurrentVersionExpiration action must be a positive integer",
    ],
    [
      {
        Status: 'Enabled',
        Filter: {},
        NoncurrentVersionExpiration: {
          NoncurrentDays: 1,
          NewerNoncurrentVersions: 101,
        },
      },
      'INVALID_ARGUMENT',
      "'NewerNoncurrentVersions' for NoncurrentVersionExpiration action must be an integer between 1 and 100",
    ],
    [
      {
        ID: 'x'.repeat(256),
        Status: 'Enabled',
        Filter: {},
        NoncurrentVersionExpiration: { NoncurrentDays: 1 },
      },
      'INVALID_ARGUMENT',
      'Rule 1 ID must be 255 characters or fewer',
    ],
    [
      {
        Status: 'Enabled',
        Prefix: '',
        NoncurrentVersionExpiration: {
          NoncurrentDays: 1,
          NewerNoncurrentVersions: 2,
        },
      },
      'INVALID_REQUEST',
      'Rule 1 contains unsupported element Prefix; use Filter instead',
    ],
    [
      {
        Status: 'Enabled',
        Filter: {},
      },
      'INVALID_REQUEST',
      'Rule 1 must contain NoncurrentVersionExpiration',
    ],
    [
      { Status: 'Enabled', NoncurrentVersionExpiration: { NoncurrentDays: 1 } },
      'MALFORMED_XML',
      'Rule 1 must contain Filter',
    ],
    [
      { Status: 'Enabled', Filter: '', Expiration: { Days: 1 } },
      'INVALID_REQUEST',
      'Rule 1 contains unsupported element Expiration',
    ],
    [
      { Status: 'Enabled', Filter: '', FutureAction: { Days: 1 } },
      'MALFORMED_XML',
      'Rule 1 contains unsupported element FutureAction',
    ],
    [
      { Status: 'Enabled', Filter: '', NoncurrentVersionExpiration: null },
      'MALFORMED_XML',
      'Rule 1 NoncurrentVersionExpiration must be an object',
    ],
    [
      { Status: 'Enabled', Filter: '', NoncurrentVersionExpiration: {} },
      'MALFORMED_XML',
      'Rule 1 NoncurrentVersionExpiration must contain NoncurrentDays',
    ],
    [
      {
        Status: 'Enabled',
        Filter: '',
        NoncurrentVersionExpiration: { NoncurrentDays: 1, Unexpected: true },
      },
      'MALFORMED_XML',
      'Rule 1 expiration contains unsupported field Unexpected',
    ],
    [
      { Status: 'Foo', Filter: '', NoncurrentVersionExpiration: { NoncurrentDays: 1 } },
      'MALFORMED_XML',
      'Rule 1 Status must be Enabled or Disabled',
    ],
  ])('categorizes invalid rule %#', (rule, category, message) => {
    expect(() =>
      normalizeS3LifecycleConfiguration({ LifecycleConfiguration: { Rule: [rule] } })
    ).toThrow(
      expect.objectContaining({
        category,
        message,
      })
    )
  })

  describe.each([
    {
      label: 'canonical',
      normalize: normalizeLifecycleConfiguration,
      input: (id: unknown) => ({
        rules: [
          {
            id,
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: { noncurrentDays: 1 },
          },
        ],
      }),
    },
    {
      label: 'S3',
      normalize: normalizeS3LifecycleConfiguration,
      input: (id: unknown) => ({
        LifecycleConfiguration: {
          Rule: [
            {
              ID: id,
              Status: 'Enabled',
              Filter: {},
              NoncurrentVersionExpiration: { NoncurrentDays: 1 },
            },
          ],
        },
      }),
    },
  ])('$label rule ID validation', ({ input, normalize }) => {
    test('reports a non-string ID as a type error', () => {
      expect(() => normalize(input(123))).toThrow(
        expect.objectContaining({
          category: 'MALFORMED_XML',
          message: 'Rule 1 ID must be a string',
        })
      )
    })

    test.each([
      ['255 ASCII code units', 'a'.repeat(255)],
      ['255 non-ASCII BMP code units', 'é'.repeat(255)],
      ['254 astral code units', '😀'.repeat(127)],
      ['255 mixed astral and ASCII code units', '😀'.repeat(127) + 'a'],
      ['XML whitespace and character boundaries', '\t\n\r &<>é\uD7FF\uE000\uFFFD😀'],
    ])('accepts %s', (_label, id) => {
      expect(normalize(input(id)).rules[0]?.id).toBe(id)
    })

    test.each([
      ['256 ASCII code units', 'a'.repeat(256)],
      ['256 non-ASCII BMP code units', 'é'.repeat(256)],
      ['256 mixed astral and ASCII code units', '😀'.repeat(127) + 'aa'],
      ['256 astral code units', '😀'.repeat(128)],
    ])('rejects %s', (_label, id) => {
      expect(() => normalize(input(id))).toThrow(
        expect.objectContaining({
          category: 'INVALID_ARGUMENT',
          message: 'Rule 1 ID must be 255 characters or fewer',
        })
      )
    })

    test.each([
      ['null', 'a\u0000b'],
      ['control character', 'a\u0001b'],
      ['vertical tab', 'a\u000Bb'],
      ['unit separator', 'a\u001Fb'],
      ['lone high surrogate', 'a\uD800b'],
      ['lone low surrogate', 'a\uDC00b'],
      ['U+FFFE', 'a\uFFFEb'],
      ['U+FFFF', 'a\uFFFFb'],
    ])('rejects an XML-incompatible ID containing %s', (_label, id) => {
      expect(() => normalize(input(id))).toThrow(
        expect.objectContaining({
          category: 'INVALID_ARGUMENT',
          message: 'Rule 1 ID must contain only valid XML 1.0 characters',
        })
      )
    })
  })

  test.each([
    { prefix: 'logs/' },
    { Prefix: 'logs/' },
  ])('rejects unsupported canonical filters as MALFORMED_XML: %o', (filter) => {
    expect(() =>
      normalizeLifecycleConfiguration({
        rules: [
          {
            status: 'Enabled',
            filter,
            noncurrentVersionExpiration: { noncurrentDays: 1 },
          },
        ],
      })
    ).toThrow(
      expect.objectContaining({
        category: 'MALFORMED_XML',
        message: 'Rule 1 uses a lifecycle filter that is not supported in v1',
      })
    )
  })

  test.each([
    [{ Prefix: 'logs/' }, 'INVALID_REQUEST'],
    [{ ObjectSizeGreaterThan: '1' }, 'INVALID_REQUEST'],
    [{ ObjectSizeLessThan: '100' }, 'INVALID_REQUEST'],
    [{ And: { Prefix: 'logs/', Tag: { Key: 'retention', Value: 'short' } } }, 'INVALID_REQUEST'],
    [{ Tag: { Key: 'retention', Value: 'short' } }, 'INVALID_REQUEST'],
    [{ FuturePredicate: true }, 'MALFORMED_XML'],
    [{ Prefix: '', Tag: { Key: 'retention', Value: 'short' } }, 'MALFORMED_XML'],
  ])('rejects unsupported filters without stripping them: %o', (filter, category) => {
    expect(() =>
      normalizeS3LifecycleConfiguration({
        LifecycleConfiguration: {
          Rule: [
            {
              Status: 'Enabled',
              Filter: filter,
              NoncurrentVersionExpiration: { NoncurrentDays: 1 },
            },
          ],
        },
      })
    ).toThrow(
      expect.objectContaining({
        category,
        message: 'Rule 1 uses a lifecycle filter that is not supported in v1',
      })
    )
  })

  test('rejects duplicate rule IDs across different rules', () => {
    expect(() =>
      normalizeS3LifecycleConfiguration({
        LifecycleConfiguration: {
          Rule: [
            {
              ID: 'duplicate',
              Status: 'Enabled',
              Filter: {},
              NoncurrentVersionExpiration: { NoncurrentDays: 1 },
            },
            {
              ID: 'duplicate',
              Status: 'Disabled',
              Filter: {},
              NoncurrentVersionExpiration: { NoncurrentDays: 2 },
            },
          ],
        },
      })
    ).toThrow(
      expect.objectContaining({
        category: 'INVALID_ARGUMENT',
        message: 'Rule ID must be unique. Found same ID for more than one rule',
      })
    )
  })
})

describe('noncurrent lifecycle time calculations', () => {
  test.each([
    {
      label: 'omitted',
      expiration: { noncurrentDays: 1 },
      expected: { cutoffAt: '2026-08-05T00:00:00.000Z' },
    },
    {
      label: 'minimum',
      expiration: { noncurrentDays: 1, newerNoncurrentVersions: 1 },
      expected: { cutoffAt: '2026-08-05T00:00:00.000Z', newerNoncurrentVersions: 1 },
    },
    {
      label: 'maximum',
      expiration: { noncurrentDays: 1, newerNoncurrentVersions: 100 },
      expected: { cutoffAt: '2026-08-05T00:00:00.000Z', newerNoncurrentVersions: 100 },
    },
  ])('compiles rules with $label retention counts', ({ expiration, expected }) => {
    expect(
      compileLifecycleEvaluationRules(
        {
          rules: [{ status: 'Enabled', filter: {}, noncurrentVersionExpiration: expiration }],
        },
        new Date('2026-08-06T00:00:00Z')
      )
    ).toEqual([expected])
  })

  test.each([
    0,
    101,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ])('rejects invalid retention count %s during compilation', (newerNoncurrentVersions) => {
    expect(() =>
      compileLifecycleEvaluationRules(
        {
          rules: [
            {
              status: 'Enabled',
              filter: {},
              noncurrentVersionExpiration: { noncurrentDays: 1, newerNoncurrentVersions },
            },
          ],
        },
        new Date('2026-08-06T00:00:00Z')
      )
    ).toThrow('NewerNoncurrentVersions must be between 1 and 100')
  })

  test('rejects an invalid retention count before its rule is pruned', () => {
    expect(() =>
      compileLifecycleEvaluationRules(
        {
          rules: [101, 1].map((newerNoncurrentVersions) => ({
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: { noncurrentDays: 1, newerNoncurrentVersions },
          })),
        },
        new Date('2026-08-06T00:00:00Z')
      )
    ).toThrow('NewerNoncurrentVersions must be between 1 and 100')
  })

  test('uses the frozen UTC date and a strict cutoff', () => {
    const snapshotAt = new Date('2026-08-06T17:42:01.000Z')
    expect(noncurrentCutoffAt(snapshotAt, 30)).toBe('2026-07-07T00:00:00.000Z')
    expect(
      compileLifecycleEvaluationRules(
        {
          rules: [
            {
              status: 'Enabled',
              filter: {},
              noncurrentVersionExpiration: {
                noncurrentDays: 30,
                newerNoncurrentVersions: 3,
              },
            },
            {
              status: 'Disabled',
              filter: {},
              noncurrentVersionExpiration: { noncurrentDays: 1 },
            },
          ],
        },
        snapshotAt
      )
    ).toEqual([
      {
        cutoffAt: '2026-07-07T00:00:00.000Z',
        newerNoncurrentVersions: 3,
      },
    ])
  })

  test('prunes evaluation rules dominated under union semantics', () => {
    const snapshotAt = new Date('2026-08-06T17:42:01.000Z')

    expect(
      compileLifecycleEvaluationRules(
        {
          rules: [
            {
              status: 'Enabled',
              filter: {},
              noncurrentVersionExpiration: {
                noncurrentDays: 30,
                newerNoncurrentVersions: 3,
              },
            },
            {
              status: 'Enabled',
              filter: {},
              noncurrentVersionExpiration: {
                noncurrentDays: 10,
                newerNoncurrentVersions: 2,
              },
            },
            {
              status: 'Enabled',
              filter: {},
              noncurrentVersionExpiration: {
                noncurrentDays: 5,
                newerNoncurrentVersions: 5,
              },
            },
            {
              status: 'Enabled',
              filter: {},
              noncurrentVersionExpiration: { noncurrentDays: 60 },
            },
            {
              status: 'Enabled',
              filter: {},
              noncurrentVersionExpiration: {
                noncurrentDays: 60,
                newerNoncurrentVersions: 4,
              },
            },
          ],
        },
        snapshotAt
      )
    ).toEqual([
      {
        cutoffAt: '2026-07-27T00:00:00.000Z',
        newerNoncurrentVersions: 2,
      },
      {
        cutoffAt: '2026-08-01T00:00:00.000Z',
        newerNoncurrentVersions: 5,
      },
      { cutoffAt: '2026-06-07T00:00:00.000Z' },
    ])
  })

  test('compiles the maximum supported day policy to an empty finite timestamp range', () => {
    const snapshotAt = new Date('2026-08-06T17:42:01.000Z')
    const configuration = normalizeLifecycleConfiguration({
      rules: [
        {
          status: 'Enabled',
          filter: {},
          noncurrentVersionExpiration: {
            noncurrentDays: 2147483647,
          },
        },
      ],
    })
    expect(compileLifecycleEvaluationRules(configuration, snapshotAt)).toEqual([
      { cutoffAt: '-infinity' },
    ])
    expect(noncurrentCutoffAt(new Date('-004713-11-26T00:00:00Z'), 1)).toBe(
      '-004713-11-25T00:00:00.000Z'
    )
    expect(noncurrentCutoffAt(new Date('-004713-11-25T00:00:00Z'), 1)).toBe('-infinity')
    expect(noncurrentCutoffAt(new Date('-004713-11-25T00:00:00Z'), 2)).toBe('-infinity')
  })

  test('a finite cutoff dominates an otherwise equivalent oversized-day rule', () => {
    expect(
      compileLifecycleEvaluationRules(
        {
          rules: [2147483647, 1].map((noncurrentDays) => ({
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: { noncurrentDays },
          })),
        },
        new Date('2026-08-06T00:00:00Z')
      )
    ).toEqual([{ cutoffAt: '2026-08-05T00:00:00.000Z' }])
  })

  test('does not follow a DST-observing local timezone', () => {
    const previous = process.env.TZ
    process.env.TZ = 'America/Los_Angeles'
    try {
      expect(noncurrentCutoffAt(new Date('2026-03-09T07:30:00.000Z'), 1)).toBe(
        '2026-03-08T00:00:00.000Z'
      )
    } finally {
      if (previous === undefined) delete process.env.TZ
      else process.env.TZ = previous
    }
  })
})
