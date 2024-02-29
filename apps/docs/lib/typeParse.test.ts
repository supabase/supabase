import { parseParam } from './typeParse'

const EMPTY_PARENT = {}
const EMPTY_FN_REF = ''

describe('parses intrinsics', () => {
  it('intrinsic string', () => {
    const intrinsicSchema = {
      id: 119,
      name: 'supabaseUrl',
      kind: 32768,
      kindString: 'Parameter',
      flags: {},
      comment: {
        shortText:
          'The unique Supabase URL which is supplied when you create a new project in your project dashboard.',
      },
      type: {
        type: 'intrinsic',
        name: 'string',
      },
    }

    const result = {
      name: 'supabaseUrl',
      comment: {
        shortText:
          'The unique Supabase URL which is supplied when you create a new project in your project dashboard.',
      },
      type: {
        type: 'string',
      },
    }

    expect(parseParam('intrinsic', intrinsicSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(
      result
    )
  })

  it('intrinsic boolean', () => {
    const intrinsicSchema = {
      id: 67,
      name: 'autoRefreshToken',
      kind: 1024,
      kindString: 'Property',
      flags: {
        isOptional: true,
      },
      comment: {
        shortText: 'Automatically refreshes the token for logged-in users. Defaults to true.',
      },
      sources: [
        {
          fileName: 'src/lib/types.ts',
          line: 23,
          character: 4,
        },
      ],
      type: {
        type: 'intrinsic',
        name: 'boolean',
      },
    }

    const result = {
      name: 'autoRefreshToken',
      optional: true,
      comment: {
        shortText: 'Automatically refreshes the token for logged-in users. Defaults to true.',
      },
      type: {
        type: 'boolean',
      },
    }

    expect(parseParam('intrinsic', intrinsicSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(
      result
    )
  })
})

describe('parses literals', () => {
  it('string literal', () => {
    const literalSchema = {
      id: 436,
      name: 'format',
      kind: 1024,
      kindString: 'Property',
      flags: {
        isOptional: true,
      },
      comment: {
        shortText: 'Specify the format of the image requested.',
        text: "When using 'origin' we force the format to be the same as the original image.\nWhen this option is not passed in, images are optimized to modern image formats like Webp.\n",
      },
      sources: [
        {
          fileName: 'src/lib/types.ts',
          line: 110,
          character: 2,
        },
      ],
      type: {
        type: 'literal',
        value: 'origin',
      },
    }

    const result = {
      name: 'format',
      comment: {
        shortText: 'Specify the format of the image requested.',
        text: "When using 'origin' we force the format to be the same as the original image.\nWhen this option is not passed in, images are optimized to modern image formats like Webp.\n",
      },
      optional: true,
      type: {
        type: 'literal',
        value: 'origin',
      },
    }

    expect(parseParam('literal', literalSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(result)
  })

  it('null literal', () => {
    const literalSchema = {
      id: 161,
      name: 'error',
      kind: 1024,
      kindString: 'Property',
      flags: {},
      sources: [
        {
          fileName: 'src/packages/StorageFileApi.ts',
          line: 202,
          character: 10,
        },
      ],
      type: {
        type: 'literal',
        value: null,
      },
      defaultValue: 'null',
    }

    const result = {
      name: 'error',
      defaultValue: 'null',
      type: {
        type: 'literal',
        value: null,
      },
    }

    expect(parseParam('literal', literalSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(result)
  })
})

describe('parses unions', () => {
  it('simple union of literals', () => {
    const unionSchema = {
      id: 575,
      name: 'RealtimeRemoveChannelResponse',
      kind: 4194304,
      kindString: 'Type alias',
      flags: {},
      sources: [
        {
          fileName: 'src/RealtimeClient.ts',
          line: 42,
          character: 12,
        },
      ],
      type: {
        type: 'union',
        types: [
          {
            type: 'literal',
            value: 'ok',
          },
          {
            type: 'literal',
            value: 'timed out',
          },
          {
            type: 'literal',
            value: 'error',
          },
        ],
      },
    }

    const result = {
      name: 'RealtimeRemoveChannelResponse',
      type: {
        type: 'union',
        types: [
          {
            type: {
              type: 'literal',
              value: 'ok',
            },
          },
          {
            type: {
              type: 'literal',
              value: 'timed out',
            },
          },
          {
            type: {
              type: 'literal',
              value: 'error',
            },
          },
        ],
      },
    }

    expect(parseParam('union', unionSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(result)
  })

  it('complex union with undefined reference types', () => {
    const unionSchema = {
      id: 11,
      name: 'input',
      kind: 32768,
      kindString: 'Parameter',
      flags: {},
      type: {
        type: 'union',
        types: [
          {
            type: 'reference',
            qualifiedName: 'RequestInfo',
            package: 'typescript',
            name: 'RequestInfo',
          },
          {
            type: 'reference',
            qualifiedName: 'URL',
            package: 'typescript',
            name: 'URL',
          },
        ],
      },
    }

    const result = {
      name: 'input',
      type: {
        type: 'union',
        types: [
          {
            name: 'RequestInfo',
            type: {
              type: 'reference',
              typeArguments: [],
            },
          },
          {
            name: 'URL',
            type: {
              type: 'reference',
              typeArguments: [],
            },
          },
        ],
      },
    }

    expect(parseParam('union', unionSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(result)
  })

  it('undefined union', () => {
    const unionSchema = {
      id: 58,
      name: 'FunctionsResponse',
      kind: 4194304,
      kindString: 'Type alias',
      flags: {},
      sources: [
        {
          fileName: 'src/types.ts',
          line: 15,
          character: 12,
        },
      ],
      typeParameter: [
        {
          id: 59,
          name: 'T',
          kind: 131072,
          kindString: 'Type parameter',
          flags: {},
        },
      ],
      type: {
        type: 'union',
        types: [null, null],
      },
    }

    const result = {
      name: 'FunctionsResponse',
      type: {
        type: 'union',
        types: [],
      },
    }

    expect(parseParam('union', unionSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(result)
  })

  it('union of reflection types', () => {
    const unionSchema = {
      id: 1098,
      name: 'details',
      kind: 1024,
      kindString: 'Property',
      flags: {},
      sources: [
        {
          fileName: 'src/lib/errors.ts',
          line: 85,
          character: 2,
        },
      ],
      type: {
        type: 'union',
        types: [
          {
            type: 'literal',
            value: null,
          },
          {
            type: 'reflection',
            declaration: {
              id: 1099,
              name: '__type',
              kind: 65536,
              kindString: 'Type literal',
              flags: {},
              children: [
                {
                  id: 1101,
                  name: 'code',
                  kind: 1024,
                  kindString: 'Property',
                  flags: {},
                  sources: [
                    {
                      fileName: 'src/lib/errors.ts',
                      line: 85,
                      character: 28,
                    },
                  ],
                  type: {
                    type: 'intrinsic',
                    name: 'string',
                  },
                },
                {
                  id: 1100,
                  name: 'error',
                  kind: 1024,
                  kindString: 'Property',
                  flags: {},
                  sources: [
                    {
                      fileName: 'src/lib/errors.ts',
                      line: 85,
                      character: 13,
                    },
                  ],
                  type: {
                    type: 'intrinsic',
                    name: 'string',
                  },
                },
              ],
              groups: [
                {
                  title: 'Properties',
                  kind: 1024,
                  children: [1101, 1100],
                },
              ],
            },
          },
        ],
      },
      defaultValue: 'null',
    }

    const result = {
      name: 'details',
      defaultValue: 'null',
      type: {
        type: 'union',
        types: [
          {
            type: {
              type: 'literal',
              value: null,
            },
          },
          {
            type: {
              type: 'interface',
              properties: [
                {
                  name: 'code',
                  type: {
                    type: 'string',
                  },
                },
                {
                  name: 'error',
                  type: {
                    type: 'string',
                  },
                },
              ],
            },
          },
        ],
      },
    }

    expect(parseParam('union', unionSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(result)
  })

  it('union of complex types', () => {
    const unionSchema = {
      id: 278,
      name: 'value',
      kind: 32768,
      kindString: 'Parameter',
      flags: {},
      comment: {
        shortText: 'The jsonb, array, or range value to filter with\n',
      },
      type: {
        type: 'union',
        types: [
          {
            type: 'intrinsic',
            name: 'string',
          },
          {
            type: 'reference',
            typeArguments: [
              {
                type: 'intrinsic',
                name: 'string',
              },
              {
                type: 'intrinsic',
                name: 'unknown',
              },
            ],
            qualifiedName: 'Record',
            package: 'typescript',
            name: 'Record',
          },
          {
            type: 'typeOperator',
            operator: 'readonly',
            target: {
              type: 'array',
              elementType: {
                type: 'indexedAccess',
                indexType: {
                  type: 'reference',
                  id: 276,
                  name: 'ColumnName',
                },
                objectType: {
                  type: 'reference',
                  id: 148,
                  name: 'Row',
                },
              },
            },
          },
        ],
      },
    }

    /** This test needs a parent because the type parameter needs to be
     * read from the parent defintion.
     */
    const parent = {
      id: 275,
      name: 'containedBy',
      kind: 4096,
      kindString: 'Call signature',
      flags: {},
      comment: {
        shortText:
          'Only relevant for jsonb, array, and range columns. Match only rows where\nevery element appearing in `column` is contained by `value`.',
      },
      typeParameter: [
        {
          id: 276,
          name: 'ColumnName',
          kind: 131072,
          kindString: 'Type parameter',
          flags: {},
          type: {
            type: 'intrinsic',
            name: 'string',
          },
        },
      ],
      parameters: [
        {
          id: 277,
          name: 'column',
          kind: 32768,
          kindString: 'Parameter',
          flags: {},
          comment: {
            shortText: 'The jsonb, array, or range column to filter on',
          },
          type: {
            type: 'reference',
            id: 276,
            name: 'ColumnName',
            dereferenced: {},
          },
        },
        {
          id: 278,
          name: 'value',
          kind: 32768,
          kindString: 'Parameter',
          flags: {},
          comment: {
            shortText: 'The jsonb, array, or range value to filter with\n',
          },
          type: {
            type: 'union',
            types: [
              {
                type: 'intrinsic',
                name: 'string',
              },
              {
                type: 'reference',
                typeArguments: [
                  {
                    type: 'intrinsic',
                    name: 'string',
                  },
                  {
                    type: 'intrinsic',
                    name: 'unknown',
                  },
                ],
                qualifiedName: 'Record',
                package: 'typescript',
                name: 'Record',
              },
              {
                type: 'typeOperator',
                operator: 'readonly',
                target: {
                  type: 'array',
                  elementType: {
                    type: 'indexedAccess',
                    indexType: {
                      type: 'reference',
                      id: 276,
                      name: 'ColumnName',
                    },
                    objectType: {
                      type: 'reference',
                      id: 148,
                      name: 'Row',
                    },
                  },
                },
              },
            ],
          },
        },
      ],
      type: {
        type: 'reference',
        id: 144,
        typeArguments: [
          {
            type: 'reference',
            id: 147,
            name: 'Schema',
          },
          {
            type: 'reference',
            id: 148,
            name: 'Row',
          },
          {
            type: 'reference',
            id: 149,
            name: 'Result',
          },
          {
            type: 'reference',
            id: 150,
            name: 'RelationName',
          },
          {
            type: 'reference',
            id: 151,
            name: 'Relationships',
          },
        ],
        name: 'default',
      },
    }

    const result = {
      name: 'value',
      comment: {
        shortText: 'The jsonb, array, or range value to filter with\n',
      },
      type: {
        type: 'union',
        types: [
          {
            type: {
              type: 'string',
            },
          },
          {
            name: 'Record',
            type: {
              type: 'reference',
              typeArguments: [
                {
                  type: {
                    type: 'string',
                  },
                },
                {
                  type: {
                    type: 'unknown',
                  },
                },
              ],
            },
          },
          {
            type: {
              type: 'readonly array',
              innerType: {
                type: {
                  type: 'array',
                  elementType: {
                    type: {
                      type: 'indexedAccess',
                      objectType: {
                        name: 'Row',
                        type: {
                          type: 'reference',
                          typeArguments: [],
                        },
                      },
                      indexType: {
                        name: 'ColumnName',
                        type: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }

    expect(parseParam('union', unionSchema, parent, EMPTY_FN_REF)).toStrictEqual(result)
  })
})

describe('parses arrays', () => {
  it('array of intrinsics', () => {
    const arraySchema = {
      id: 502,
      name: 'args',
      kind: 32768,
      kindString: 'Parameter',
      flags: {
        isRest: true,
      },
      type: {
        type: 'array',
        elementType: {
          type: 'intrinsic',
          name: 'any',
        },
      },
    }

    const result = {
      name: 'args',
      type: {
        type: 'array',
        elementType: {
          type: {
            type: 'any',
          },
        },
      },
    }

    expect(parseParam('array', arraySchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(result)
  })

  it('array of unresolved references', () => {
    const arraySchema = {
      id: 275,
      name: 'data',
      kind: 1024,
      kindString: 'Property',
      flags: {},
      sources: [
        {
          fileName: 'src/packages/StorageFileApi.ts',
          line: 555,
          character: 8,
        },
      ],
      type: {
        type: 'array',
        elementType: {
          type: 'reference',
          id: 404,
          name: 'FileObject',
        },
      },
    }

    const result = {
      name: 'data',
      type: {
        type: 'array',
        elementType: {
          name: 'FileObject',
          type: {
            type: 'reference',
            typeArguments: [],
          },
        },
      },
    }

    expect(parseParam('array', arraySchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(result)
  })
})

describe('indexed access types', () => {
  it('simple indexed access', () => {
    const indexedAccessSchema = {
      id: 73,
      name: 'debug',
      kind: 1024,
      kindString: 'Property',
      flags: {
        isOptional: true,
      },
      comment: {
        shortText:
          'If debug messages for authentication client are emitted. Can be used to inspect the behavior of the library.',
      },
      sources: [
        {
          fileName: 'src/lib/types.ts',
          line: 47,
          character: 4,
        },
      ],
      type: {
        type: 'indexedAccess',
        indexType: {
          type: 'literal',
          value: 'debug',
        },
        objectType: {
          type: 'reference',
          id: 58,
          name: 'SupabaseAuthClientOptions',
        },
      },
    }

    const result = {
      name: 'debug',
      comment: {
        shortText:
          'If debug messages for authentication client are emitted. Can be used to inspect the behavior of the library.',
      },
      optional: true,
      type: {
        type: 'indexedAccess',
        indexType: {
          type: {
            type: 'literal',
            value: 'debug',
          },
        },
        objectType: {
          name: 'SupabaseAuthClientOptions',
          type: {
            type: 'reference',
            typeArguments: [],
          },
        },
      },
    }

    expect(
      parseParam('indexedAccess', indexedAccessSchema, EMPTY_PARENT, EMPTY_FN_REF)
    ).toStrictEqual(result)
  })
})

describe('parses intersections', () => {
  it('simple intersection', () => {
    const intersectionSchema = {
      id: 51,
      name: 'data',
      kind: 1024,
      kindString: 'Property',
      flags: {},
      sources: [
        {
          fileName: 'src/GoTrueAdminApi.ts',
          line: 177,
          character: 8,
        },
      ],
      type: {
        type: 'intersection',
        types: [
          {
            type: 'reflection',
            declaration: {
              id: 52,
              name: '__type',
              kind: 65536,
              kindString: 'Type literal',
              flags: {},
              children: [
                {
                  id: 54,
                  name: 'aud',
                  kind: 1024,
                  kindString: 'Property',
                  flags: {},
                  sources: [
                    {
                      fileName: 'src/GoTrueAdminApi.ts',
                      line: 177,
                      character: 31,
                    },
                  ],
                  type: {
                    type: 'intrinsic',
                    name: 'string',
                  },
                },
                {
                  id: 53,
                  name: 'users',
                  kind: 1024,
                  kindString: 'Property',
                  flags: {},
                  sources: [
                    {
                      fileName: 'src/GoTrueAdminApi.ts',
                      line: 177,
                      character: 16,
                    },
                  ],
                  type: {
                    type: 'array',
                    elementType: {
                      type: 'reference',
                      id: 616,
                      name: 'User',
                    },
                  },
                },
              ],
              groups: [
                {
                  title: 'Properties',
                  kind: 1024,
                  children: [54, 53],
                },
              ],
            },
          },
          {
            type: 'reference',
            id: 984,
            name: 'Pagination',
          },
        ],
      },
    }

    const result = {
      name: 'data',
      type: {
        type: 'intersection',
        types: [
          {
            type: {
              type: 'interface',
              properties: [
                {
                  name: 'aud',
                  type: {
                    type: 'string',
                  },
                },
                {
                  name: 'users',
                  type: {
                    type: 'array',
                    elementType: {
                      name: 'User',
                      type: {
                        type: 'reference',
                        typeArguments: [],
                      },
                    },
                  },
                },
              ],
            },
          },
          {
            name: 'Pagination',
            type: {
              type: 'reference',
              typeArguments: [],
            },
          },
        ],
      },
    }

    expect(
      parseParam('intersection', intersectionSchema, EMPTY_PARENT, EMPTY_FN_REF)
    ).toStrictEqual(result)
  })
})

describe('parse referenced types', () => {
  it('referenced type with dereference', () => {
    const referenceSchema = {
      id: 425,
      name: 'params',
      kind: 32768,
      kindString: 'Parameter',
      flags: {},
      type: {
        type: 'reference',
        id: 347,
        name: 'RealtimeChannelOptions',
        dereferenced: {
          id: 347,
          name: 'RealtimeChannelOptions',
          kind: 4194304,
          kindString: 'Type alias',
          flags: {},
          sources: [
            {
              fileName: 'src/RealtimeChannel.ts',
              line: 15,
              character: 12,
            },
          ],
          type: {
            type: 'reflection',
            declaration: {
              id: 348,
              name: '__type',
              kind: 65536,
              kindString: 'Type literal',
              flags: {},
              children: [
                {
                  id: 349,
                  name: 'config',
                  kind: 1024,
                  kindString: 'Property',
                  flags: {},
                  sources: [
                    {
                      fileName: 'src/RealtimeChannel.ts',
                      line: 16,
                      character: 2,
                    },
                  ],
                  type: {
                    type: 'reflection',
                    declaration: {
                      id: 350,
                      name: '__type',
                      kind: 65536,
                      kindString: 'Type literal',
                      flags: {},
                      children: [
                        {
                          id: 351,
                          name: 'broadcast',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {
                            isOptional: true,
                          },
                          comment: {
                            shortText:
                              'self option enables client to receive message it broadcast\nack option instructs server to acknowledge that broadcast message was received',
                          },
                          sources: [
                            {
                              fileName: 'src/RealtimeChannel.ts',
                              line: 21,
                              character: 4,
                            },
                          ],
                          type: {
                            type: 'reflection',
                            declaration: {
                              id: 352,
                              name: '__type',
                              kind: 65536,
                              kindString: 'Type literal',
                              flags: {},
                              children: [
                                {
                                  id: 354,
                                  name: 'ack',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/RealtimeChannel.ts',
                                      line: 21,
                                      character: 34,
                                    },
                                  ],
                                  type: {
                                    type: 'intrinsic',
                                    name: 'boolean',
                                  },
                                },
                                {
                                  id: 353,
                                  name: 'self',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/RealtimeChannel.ts',
                                      line: 21,
                                      character: 18,
                                    },
                                  ],
                                  type: {
                                    type: 'intrinsic',
                                    name: 'boolean',
                                  },
                                },
                              ],
                              groups: [
                                {
                                  title: 'Properties',
                                  kind: 1024,
                                  children: [354, 353],
                                },
                              ],
                              sources: [
                                {
                                  fileName: 'src/RealtimeChannel.ts',
                                  line: 21,
                                  character: 16,
                                },
                              ],
                            },
                          },
                        },
                        {
                          id: 355,
                          name: 'presence',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {
                            isOptional: true,
                          },
                          comment: {
                            shortText:
                              'key option is used to track presence payload across clients',
                          },
                          sources: [
                            {
                              fileName: 'src/RealtimeChannel.ts',
                              line: 25,
                              character: 4,
                            },
                          ],
                          type: {
                            type: 'reflection',
                            declaration: {
                              id: 356,
                              name: '__type',
                              kind: 65536,
                              kindString: 'Type literal',
                              flags: {},
                              children: [
                                {
                                  id: 357,
                                  name: 'key',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/RealtimeChannel.ts',
                                      line: 25,
                                      character: 17,
                                    },
                                  ],
                                  type: {
                                    type: 'intrinsic',
                                    name: 'string',
                                  },
                                },
                              ],
                              groups: [
                                {
                                  title: 'Properties',
                                  kind: 1024,
                                  children: [357],
                                },
                              ],
                              sources: [
                                {
                                  fileName: 'src/RealtimeChannel.ts',
                                  line: 25,
                                  character: 15,
                                },
                              ],
                            },
                          },
                        },
                      ],
                      groups: [
                        {
                          title: 'Properties',
                          kind: 1024,
                          children: [351, 355],
                        },
                      ],
                      sources: [
                        {
                          fileName: 'src/RealtimeChannel.ts',
                          line: 16,
                          character: 10,
                        },
                      ],
                    },
                  },
                },
              ],
              groups: [
                {
                  title: 'Properties',
                  kind: 1024,
                  children: [349],
                },
              ],
              sources: [
                {
                  fileName: 'src/RealtimeChannel.ts',
                  line: 15,
                  character: 37,
                },
              ],
            },
          },
        },
      },
      defaultValue: '...',
    }

    const result = {
      name: 'params',
      defaultValue: '...',
      type: {
        name: 'RealtimeChannelOptions',
        type: 'interface',
        properties: [
          {
            name: 'config',
            type: {
              type: 'interface',
              properties: [
                {
                  name: 'broadcast',
                  optional: true,
                  comment: {
                    shortText:
                      'self option enables client to receive message it broadcast\nack option instructs server to acknowledge that broadcast message was received',
                  },
                  type: {
                    type: 'interface',
                    properties: [
                      {
                        name: 'ack',
                        optional: true,
                        type: {
                          type: 'boolean',
                        },
                      },
                      {
                        name: 'self',
                        optional: true,
                        type: {
                          type: 'boolean',
                        },
                      },
                    ],
                  },
                },
                {
                  name: 'presence',
                  optional: true,
                  comment: {
                    shortText: 'key option is used to track presence payload across clients',
                  },
                  type: {
                    type: 'interface',
                    properties: [
                      {
                        name: 'key',
                        optional: true,
                        type: {
                          type: 'string',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    }

    expect(parseParam('reference', referenceSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(
      result
    )
  })
})
