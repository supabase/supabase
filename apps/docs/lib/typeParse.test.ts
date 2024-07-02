import { type ParentBase, parseParam } from './typeParse'

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

describe('parses reflections', () => {
  it('simple reflection', () => {
    const reflectionSchema = {
      id: 86,
      name: 'filter',
      kind: 1024,
      kindString: 'Property',
      flags: {},
      sources: [
        {
          fileName: 'src/RealtimeChannel.ts',
          line: 119,
          character: 6,
        },
      ],
      type: {
        type: 'reflection',
        declaration: {
          id: 87,
          name: '__type',
          kind: 65536,
          kindString: 'Type literal',
          flags: {},
          sources: [
            {
              fileName: 'src/RealtimeChannel.ts',
              line: 119,
              character: 14,
            },
          ],
          indexSignature: {
            id: 88,
            name: '__index',
            kind: 8192,
            kindString: 'Index signature',
            flags: {},
            parameters: [
              {
                id: 89,
                name: 'key',
                kind: 32768,
                flags: {},
                type: {
                  type: 'intrinsic',
                  name: 'string',
                },
              },
            ],
            type: {
              type: 'intrinsic',
              name: 'any',
            },
          },
        },
      },
    }

    const result = {
      name: 'filter',
      type: {
        type: 'indexedObject',
        indexes: [
          {
            name: 'key',
            type: {
              type: 'string',
            },
          },
        ],
        value: {
          type: {
            type: 'any',
          },
        },
      },
    }

    expect(parseParam('reflection', reflectionSchema, EMPTY_PARENT, EMPTY_FN_REF)).toStrictEqual(
      result
    )
  })
})

describe('miscellaneous combinations', () => {
  it('from.select()', () => {
    const parent = {
      id: 86,
      name: 'select',
      kind: 4096,
      kindString: 'Call signature',
      flags: {},
      comment: {
        shortText: 'Perform a SELECT query on the table or view.',
      },
      typeParameter: [
        {
          id: 87,
          name: 'Query',
          kind: 131072,
          kindString: 'Type parameter',
          flags: {},
          type: {
            type: 'intrinsic',
            name: 'string',
          },
          default: {
            type: 'literal',
            value: '*',
          },
        },
        {
          id: 88,
          name: 'ResultOne',
          kind: 131072,
          kindString: 'Type parameter',
          flags: {},
          default: {
            type: 'reference',
            typeArguments: [
              {
                type: 'reference',
                id: 60,
                name: 'Schema',
              },
              {
                type: 'indexedAccess',
                indexType: {
                  type: 'literal',
                  value: 'Row',
                },
                objectType: {
                  type: 'reference',
                  id: 61,
                  name: 'Relation',
                },
              },
              {
                type: 'reference',
                id: 62,
                name: 'RelationName',
              },
              {
                type: 'reference',
                id: 65,
                name: 'Relationships',
              },
              {
                type: 'reference',
                id: 87,
                name: 'Query',
              },
            ],
            name: 'GetResult',
          },
        },
      ],
      parameters: [
        {
          id: 89,
          name: 'columns',
          kind: 32768,
          kindString: 'Parameter',
          flags: {
            isOptional: true,
          },
          comment: {
            shortText:
              'The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`\n',
          },
          type: {
            type: 'reference',
            id: 87,
            name: 'Query',
            dereferenced: {},
          },
        },
        {
          id: 90,
          name: 'options',
          kind: 32768,
          kindString: 'Parameter',
          flags: {},
          comment: {
            shortText: 'Named parameters\n',
          },
          originalName: '__namedParameters',
          type: {
            type: 'reflection',
            declaration: {
              id: 91,
              name: '__type',
              kind: 65536,
              kindString: 'Type literal',
              flags: {},
              children: [
                {
                  id: 93,
                  name: 'count',
                  kind: 1024,
                  kindString: 'Property',
                  flags: {
                    isOptional: true,
                  },
                  comment: {
                    shortText:
                      'Count algorithm to use to count rows in the table or view.\n\n`"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the\nhood.\n\n`"planned"`: Approximated but fast count algorithm. Uses the Postgres\nstatistics under the hood.\n\n`"estimated"`: Uses exact count for low numbers and planned count for high\nnumbers.\n',
                  },
                  sources: [
                    {
                      fileName: 'src/PostgrestQueryBuilder.ts',
                      line: 67,
                      character: 6,
                    },
                  ],
                  type: {
                    type: 'union',
                    types: [
                      {
                        type: 'literal',
                        value: 'exact',
                      },
                      {
                        type: 'literal',
                        value: 'planned',
                      },
                      {
                        type: 'literal',
                        value: 'estimated',
                      },
                    ],
                  },
                },
                {
                  id: 92,
                  name: 'head',
                  kind: 1024,
                  kindString: 'Property',
                  flags: {
                    isOptional: true,
                  },
                  comment: {
                    shortText:
                      'When set to `true`, `data` will not be returned.\nUseful if you only need the count.\n',
                  },
                  sources: [
                    {
                      fileName: 'src/PostgrestQueryBuilder.ts',
                      line: 66,
                      character: 6,
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
                  children: [93, 92],
                },
              ],
            },
          },
          defaultValue: '{}',
        },
      ],
      type: {
        type: 'reference',
        id: 144,
        typeArguments: [
          {
            type: 'reference',
            id: 60,
            name: 'Schema',
          },
          {
            type: 'indexedAccess',
            indexType: {
              type: 'literal',
              value: 'Row',
            },
            objectType: {
              type: 'reference',
              id: 61,
              name: 'Relation',
            },
          },
          {
            type: 'array',
            elementType: {
              type: 'reference',
              id: 88,
              name: 'ResultOne',
            },
          },
          {
            type: 'reference',
            id: 62,
            name: 'RelationName',
          },
          {
            type: 'reference',
            id: 65,
            name: 'Relationships',
          },
        ],
        name: 'default',
      },
    }

    const param1 = parent.parameters[0]
    const param2 = parent.parameters[1]

    const result1 = {
      name: 'columns',
      optional: true,
      comment: {
        shortText:
          'The columns to retrieve, separated by commas. Columns can be renamed when returned with `customName:columnName`\n',
      },
      type: {
        type: 'string',
      },
    }

    const result2 = {
      name: 'options',
      comment: {
        shortText: 'Named parameters\n',
      },
      defaultValue: '{}',
      type: {
        type: 'interface',
        properties: [
          {
            name: 'count',
            optional: true,
            comment: {
              shortText:
                'Count algorithm to use to count rows in the table or view.\n\n`"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the\nhood.\n\n`"planned"`: Approximated but fast count algorithm. Uses the Postgres\nstatistics under the hood.\n\n`"estimated"`: Uses exact count for low numbers and planned count for high\nnumbers.\n',
            },
            type: {
              type: 'union',
              types: [
                {
                  type: {
                    type: 'literal',
                    value: 'exact',
                  },
                },
                {
                  type: {
                    type: 'literal',
                    value: 'planned',
                  },
                },
                {
                  type: {
                    type: 'literal',
                    value: 'estimated',
                  },
                },
              ],
            },
          },
          {
            name: 'head',
            optional: true,
            comment: {
              shortText:
                'When set to `true`, `data` will not be returned.\nUseful if you only need the count.\n',
            },
            type: {
              type: 'boolean',
            },
          },
        ],
      },
    }

    expect(parseParam('reference', param1, parent, EMPTY_FN_REF)).toStrictEqual(result1)
    expect(parseParam('reflection', param2, parent, EMPTY_FN_REF)).toStrictEqual(result2)
  })

  it('storage.from().download()', () => {
    const parent = {
      id: 249,
      name: 'download',
      kind: 4096,
      kindString: 'Call signature',
      flags: {},
      comment: {
        shortText:
          'Downloads a file from a private bucket. For public buckets, make a request to the URL returned from `getPublicUrl` instead.',
      },
      parameters: [
        {
          id: 250,
          name: 'path',
          kind: 32768,
          kindString: 'Parameter',
          flags: {},
          comment: {
            shortText:
              'The full path and file name of the file to be downloaded. For example `folder/image.png`.',
          },
          type: {
            type: 'intrinsic',
            name: 'string',
          },
        },
        {
          id: 251,
          name: 'options',
          kind: 32768,
          kindString: 'Parameter',
          flags: {
            isOptional: true,
          },
          type: {
            type: 'reflection',
            declaration: {
              id: 252,
              name: '__type',
              kind: 65536,
              kindString: 'Type literal',
              flags: {},
              children: [
                {
                  id: 253,
                  name: 'transform',
                  kind: 1024,
                  kindString: 'Property',
                  flags: {
                    isOptional: true,
                  },
                  comment: {
                    shortText: 'Transform the asset before serving it to the client.\n',
                  },
                  sources: [
                    {
                      fileName: 'src/packages/StorageFileApi.ts',
                      line: 472,
                      character: 16,
                    },
                  ],
                  type: {
                    type: 'reference',
                    id: 431,
                    name: 'TransformOptions',
                    dereferenced: {
                      id: 431,
                      name: 'TransformOptions',
                      kind: 256,
                      kindString: 'Interface',
                      flags: {},
                      children: [
                        {
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
                        },
                        {
                          id: 433,
                          name: 'height',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {
                            isOptional: true,
                          },
                          comment: {
                            shortText: 'The height of the image in pixels.',
                          },
                          sources: [
                            {
                              fileName: 'src/lib/types.ts',
                              line: 90,
                              character: 2,
                            },
                          ],
                          type: {
                            type: 'intrinsic',
                            name: 'number',
                          },
                        },
                        {
                          id: 435,
                          name: 'quality',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {
                            isOptional: true,
                          },
                          comment: {
                            shortText:
                              'Set the quality of the returned image.\nA number from 20 to 100, with 100 being the highest quality.\nDefaults to 80',
                          },
                          sources: [
                            {
                              fileName: 'src/lib/types.ts',
                              line: 103,
                              character: 2,
                            },
                          ],
                          type: {
                            type: 'intrinsic',
                            name: 'number',
                          },
                        },
                        {
                          id: 434,
                          name: 'resize',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {
                            isOptional: true,
                          },
                          comment: {
                            shortText:
                              "The resize mode can be cover, contain or fill. Defaults to cover.\nCover resizes the image to maintain it's aspect ratio while filling the entire width and height.\nContain resizes the image to maintain it's aspect ratio while fitting the entire image within the width and height.\nFill resizes the image to fill the entire width and height. If the object's aspect ratio does not match the width and height, the image will be stretched to fit.",
                          },
                          sources: [
                            {
                              fileName: 'src/lib/types.ts',
                              line: 97,
                              character: 2,
                            },
                          ],
                          type: {
                            type: 'union',
                            types: [
                              {
                                type: 'literal',
                                value: 'cover',
                              },
                              {
                                type: 'literal',
                                value: 'contain',
                              },
                              {
                                type: 'literal',
                                value: 'fill',
                              },
                            ],
                          },
                        },
                        {
                          id: 432,
                          name: 'width',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {
                            isOptional: true,
                          },
                          comment: {
                            shortText: 'The width of the image in pixels.',
                          },
                          sources: [
                            {
                              fileName: 'src/lib/types.ts',
                              line: 86,
                              character: 2,
                            },
                          ],
                          type: {
                            type: 'intrinsic',
                            name: 'number',
                          },
                        },
                      ],
                      groups: [
                        {
                          title: 'Properties',
                          kind: 1024,
                          children: [436, 433, 435, 434, 432],
                        },
                      ],
                      sources: [
                        {
                          fileName: 'src/lib/types.ts',
                          line: 82,
                          character: 17,
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
                  children: [253],
                },
              ],
            },
          },
        },
      ],
      type: {
        type: 'reference',
        typeArguments: [
          {
            type: 'union',
            types: [
              {
                type: 'reflection',
                declaration: {
                  id: 254,
                  name: '__type',
                  kind: 65536,
                  kindString: 'Type literal',
                  flags: {},
                  children: [
                    {
                      id: 255,
                      name: 'data',
                      kind: 1024,
                      kindString: 'Property',
                      flags: {},
                      sources: [
                        {
                          fileName: 'src/packages/StorageFileApi.ts',
                          line: 475,
                          character: 8,
                        },
                      ],
                      type: {
                        type: 'reference',
                        qualifiedName: 'Blob',
                        package: 'typescript',
                        name: 'Blob',
                      },
                    },
                    {
                      id: 256,
                      name: 'error',
                      kind: 1024,
                      kindString: 'Property',
                      flags: {},
                      sources: [
                        {
                          fileName: 'src/packages/StorageFileApi.ts',
                          line: 476,
                          character: 8,
                        },
                      ],
                      type: {
                        type: 'literal',
                        value: null,
                      },
                    },
                  ],
                  groups: [
                    {
                      title: 'Properties',
                      kind: 1024,
                      children: [255, 256],
                    },
                  ],
                },
              },
              {
                type: 'reflection',
                declaration: {
                  id: 257,
                  name: '__type',
                  kind: 65536,
                  kindString: 'Type literal',
                  flags: {},
                  children: [
                    {
                      id: 258,
                      name: 'data',
                      kind: 1024,
                      kindString: 'Property',
                      flags: {},
                      sources: [
                        {
                          fileName: 'src/packages/StorageFileApi.ts',
                          line: 479,
                          character: 8,
                        },
                      ],
                      type: {
                        type: 'literal',
                        value: null,
                      },
                    },
                    {
                      id: 259,
                      name: 'error',
                      kind: 1024,
                      kindString: 'Property',
                      flags: {},
                      sources: [
                        {
                          fileName: 'src/packages/StorageFileApi.ts',
                          line: 480,
                          character: 8,
                        },
                      ],
                      type: {
                        type: 'reference',
                        id: 440,
                        name: 'StorageError',
                      },
                    },
                  ],
                  groups: [
                    {
                      title: 'Properties',
                      kind: 1024,
                      children: [258, 259],
                    },
                  ],
                },
              },
            ],
          },
        ],
        qualifiedName: 'Promise',
        package: 'typescript',
        name: 'Promise',
      },
    }

    const param1 = parent.parameters[0]
    const param2 = parent.parameters[1]

    const result1 = {
      name: 'path',
      comment: {
        shortText:
          'The full path and file name of the file to be downloaded. For example `folder/image.png`.',
      },
      type: {
        type: 'string',
      },
    }

    const result2 = {
      name: 'options',
      optional: true,
      type: {
        type: 'interface',
        properties: [
          {
            name: 'transform',
            optional: true,
            comment: {
              shortText: 'Transform the asset before serving it to the client.\n',
            },
            type: {
              type: 'interface',
              properties: [
                {
                  name: 'format',
                  optional: true,
                  comment: {
                    shortText: 'Specify the format of the image requested.',
                    text: "When using 'origin' we force the format to be the same as the original image.\nWhen this option is not passed in, images are optimized to modern image formats like Webp.\n",
                  },
                  type: {
                    type: 'literal',
                    value: 'origin',
                  },
                },
                {
                  name: 'height',
                  optional: true,
                  comment: {
                    shortText: 'The height of the image in pixels.',
                  },
                  type: {
                    type: 'number',
                  },
                },
                {
                  name: 'quality',
                  optional: true,
                  comment: {
                    shortText:
                      'Set the quality of the returned image.\nA number from 20 to 100, with 100 being the highest quality.\nDefaults to 80',
                  },
                  type: {
                    type: 'number',
                  },
                },
                {
                  name: 'resize',
                  optional: true,
                  comment: {
                    shortText:
                      "The resize mode can be cover, contain or fill. Defaults to cover.\nCover resizes the image to maintain it's aspect ratio while filling the entire width and height.\nContain resizes the image to maintain it's aspect ratio while fitting the entire image within the width and height.\nFill resizes the image to fill the entire width and height. If the object's aspect ratio does not match the width and height, the image will be stretched to fit.",
                  },
                  type: {
                    type: 'union',
                    types: [
                      {
                        type: {
                          type: 'literal',
                          value: 'cover',
                        },
                      },
                      {
                        type: {
                          type: 'literal',
                          value: 'contain',
                        },
                      },
                      {
                        type: {
                          type: 'literal',
                          value: 'fill',
                        },
                      },
                    ],
                  },
                },
                {
                  name: 'width',
                  optional: true,
                  comment: {
                    shortText: 'The width of the image in pixels.',
                  },
                  type: {
                    type: 'number',
                  },
                },
              ],
            },
          },
        ],
      },
    }

    expect(parseParam('intrinsic', param1, parent as ParentBase, EMPTY_FN_REF)).toStrictEqual(
      result1
    )
    expect(parseParam('reflection', param2, parent as ParentBase, EMPTY_FN_REF)).toStrictEqual(
      result2
    )
  })

  it('auth.signInWithOTP()', () => {
    const parent = {
      id: 163,
      name: 'signInWithOtp',
      kind: 4096,
      kindString: 'Call signature',
      flags: {},
      comment: {
        shortText: 'Log in a user using magiclink or a one-time password (OTP).',
        text: "If the `{{ .ConfirmationURL }}` variable is specified in the email template, a magiclink will be sent.\nIf the `{{ .Token }}` variable is specified in the email template, an OTP will be sent.\nIf you're using phone sign-ins, only an OTP will be sent. You won't be able to send a magiclink for phone sign-ins.\n\nBe aware that you may get back an error message that will not distinguish\nbetween the cases where the account does not exist or, that the account\ncan only be accessed via social login.\n\nDo note that you will need to configure a Whatsapp sender on Twilio\nif you are using phone sign in with the 'whatsapp' channel. The whatsapp\nchannel is not supported on other providers\nat this time.\nThis method supports PKCE when an email is passed.\n",
      },
      parameters: [
        {
          id: 164,
          name: 'credentials',
          kind: 32768,
          kindString: 'Parameter',
          flags: {},
          type: {
            type: 'reference',
            id: 697,
            name: 'SignInWithPasswordlessCredentials',
            dereferenced: {
              id: 697,
              name: 'SignInWithPasswordlessCredentials',
              kind: 4194304,
              kindString: 'Type alias',
              flags: {},
              sources: [
                {
                  fileName: 'src/lib/types.ts',
                  line: 479,
                  character: 12,
                },
              ],
              type: {
                type: 'union',
                types: [
                  {
                    type: 'reflection',
                    declaration: {
                      id: 698,
                      name: '__type',
                      kind: 65536,
                      kindString: 'Type literal',
                      flags: {},
                      children: [
                        {
                          id: 699,
                          name: 'email',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {},
                          comment: {
                            shortText: "The user's email address.",
                          },
                          sources: [
                            {
                              fileName: 'src/lib/types.ts',
                              line: 482,
                              character: 6,
                            },
                          ],
                          type: {
                            type: 'intrinsic',
                            name: 'string',
                          },
                        },
                        {
                          id: 700,
                          name: 'options',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {
                            isOptional: true,
                          },
                          sources: [
                            {
                              fileName: 'src/lib/types.ts',
                              line: 483,
                              character: 6,
                            },
                          ],
                          type: {
                            type: 'reflection',
                            declaration: {
                              id: 701,
                              name: '__type',
                              kind: 65536,
                              kindString: 'Type literal',
                              flags: {},
                              children: [
                                {
                                  id: 705,
                                  name: 'captchaToken',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  comment: {
                                    shortText:
                                      'Verification token received when the user completes the captcha on the site.',
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/lib/types.ts',
                                      line: 495,
                                      character: 8,
                                    },
                                  ],
                                  type: {
                                    type: 'intrinsic',
                                    name: 'string',
                                  },
                                },
                                {
                                  id: 704,
                                  name: 'data',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  comment: {
                                    shortText:
                                      "A custom data object to store the user's metadata. This maps to the `auth.users.user_metadata` column.",
                                    text: 'The `data` should be a JSON object that includes user-specific info, such as their first and last name.\n',
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/lib/types.ts',
                                      line: 493,
                                      character: 8,
                                    },
                                  ],
                                  type: {
                                    type: 'intrinsic',
                                    name: 'object',
                                  },
                                },
                                {
                                  id: 702,
                                  name: 'emailRedirectTo',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  comment: {
                                    shortText: 'The redirect url embedded in the email link',
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/lib/types.ts',
                                      line: 485,
                                      character: 8,
                                    },
                                  ],
                                  type: {
                                    type: 'intrinsic',
                                    name: 'string',
                                  },
                                },
                                {
                                  id: 703,
                                  name: 'shouldCreateUser',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  comment: {
                                    shortText:
                                      'If set to false, this method will not create a new user. Defaults to true.',
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/lib/types.ts',
                                      line: 487,
                                      character: 8,
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
                                  children: [705, 704, 702, 703],
                                },
                              ],
                              sources: [
                                {
                                  fileName: 'src/lib/types.ts',
                                  line: 483,
                                  character: 16,
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
                          children: [699, 700],
                        },
                      ],
                      sources: [
                        {
                          fileName: 'src/lib/types.ts',
                          line: 480,
                          character: 4,
                        },
                      ],
                    },
                  },
                  {
                    type: 'reflection',
                    declaration: {
                      id: 706,
                      name: '__type',
                      kind: 65536,
                      kindString: 'Type literal',
                      flags: {},
                      children: [
                        {
                          id: 708,
                          name: 'options',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {
                            isOptional: true,
                          },
                          sources: [
                            {
                              fileName: 'src/lib/types.ts',
                              line: 501,
                              character: 6,
                            },
                          ],
                          type: {
                            type: 'reflection',
                            declaration: {
                              id: 709,
                              name: '__type',
                              kind: 65536,
                              kindString: 'Type literal',
                              flags: {},
                              children: [
                                {
                                  id: 712,
                                  name: 'captchaToken',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  comment: {
                                    shortText:
                                      'Verification token received when the user completes the captcha on the site.',
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/lib/types.ts',
                                      line: 511,
                                      character: 8,
                                    },
                                  ],
                                  type: {
                                    type: 'intrinsic',
                                    name: 'string',
                                  },
                                },
                                {
                                  id: 713,
                                  name: 'channel',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  comment: {
                                    shortText: 'Messaging channel to use (e.g. whatsapp or sms)',
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/lib/types.ts',
                                      line: 513,
                                      character: 8,
                                    },
                                  ],
                                  type: {
                                    type: 'union',
                                    types: [
                                      {
                                        type: 'literal',
                                        value: 'sms',
                                      },
                                      {
                                        type: 'literal',
                                        value: 'whatsapp',
                                      },
                                    ],
                                  },
                                },
                                {
                                  id: 711,
                                  name: 'data',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  comment: {
                                    shortText:
                                      "A custom data object to store the user's metadata. This maps to the `auth.users.user_metadata` column.",
                                    text: 'The `data` should be a JSON object that includes user-specific info, such as their first and last name.\n',
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/lib/types.ts',
                                      line: 509,
                                      character: 8,
                                    },
                                  ],
                                  type: {
                                    type: 'intrinsic',
                                    name: 'object',
                                  },
                                },
                                {
                                  id: 710,
                                  name: 'shouldCreateUser',
                                  kind: 1024,
                                  kindString: 'Property',
                                  flags: {
                                    isOptional: true,
                                  },
                                  comment: {
                                    shortText:
                                      'If set to false, this method will not create a new user. Defaults to true.',
                                  },
                                  sources: [
                                    {
                                      fileName: 'src/lib/types.ts',
                                      line: 503,
                                      character: 8,
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
                                  children: [712, 713, 711, 710],
                                },
                              ],
                              sources: [
                                {
                                  fileName: 'src/lib/types.ts',
                                  line: 501,
                                  character: 16,
                                },
                              ],
                            },
                          },
                        },
                        {
                          id: 707,
                          name: 'phone',
                          kind: 1024,
                          kindString: 'Property',
                          flags: {},
                          comment: {
                            shortText: "The user's phone number.",
                          },
                          sources: [
                            {
                              fileName: 'src/lib/types.ts',
                              line: 500,
                              character: 6,
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
                          children: [708, 707],
                        },
                      ],
                      sources: [
                        {
                          fileName: 'src/lib/types.ts',
                          line: 498,
                          character: 4,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      ],
      type: {
        type: 'reference',
        typeArguments: [
          {
            type: 'reference',
            id: 517,
            name: 'AuthOtpResponse',
          },
        ],
        qualifiedName: 'Promise',
        package: 'typescript',
        name: 'Promise',
      },
    }

    const param = parent.parameters[0]

    const result = {
      name: 'credentials',
      type: {
        name: 'SignInWithPasswordlessCredentials',
        type: 'union',
        types: [
          {
            type: {
              type: 'interface',
              properties: [
                {
                  name: 'email',
                  comment: {
                    shortText: "The user's email address.",
                  },
                  type: {
                    type: 'string',
                  },
                },
                {
                  name: 'options',
                  optional: true,
                  type: {
                    type: 'interface',
                    properties: [
                      {
                        name: 'captchaToken',
                        optional: true,
                        comment: {
                          shortText:
                            'Verification token received when the user completes the captcha on the site.',
                        },
                        type: {
                          type: 'string',
                        },
                      },
                      {
                        name: 'data',
                        optional: true,
                        comment: {
                          shortText:
                            "A custom data object to store the user's metadata. This maps to the `auth.users.user_metadata` column.",
                          text: 'The `data` should be a JSON object that includes user-specific info, such as their first and last name.\n',
                        },
                        type: {
                          type: 'object',
                        },
                      },
                      {
                        name: 'emailRedirectTo',
                        optional: true,
                        comment: {
                          shortText: 'The redirect url embedded in the email link',
                        },
                        type: {
                          type: 'string',
                        },
                      },
                      {
                        name: 'shouldCreateUser',
                        optional: true,
                        comment: {
                          shortText:
                            'If set to false, this method will not create a new user. Defaults to true.',
                        },
                        type: {
                          type: 'boolean',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            type: {
              type: 'interface',
              properties: [
                {
                  name: 'options',
                  optional: true,
                  type: {
                    type: 'interface',
                    properties: [
                      {
                        name: 'captchaToken',
                        optional: true,
                        comment: {
                          shortText:
                            'Verification token received when the user completes the captcha on the site.',
                        },
                        type: {
                          type: 'string',
                        },
                      },
                      {
                        name: 'channel',
                        optional: true,
                        comment: {
                          shortText: 'Messaging channel to use (e.g. whatsapp or sms)',
                        },
                        type: {
                          type: 'union',
                          types: [
                            {
                              type: {
                                type: 'literal',
                                value: 'sms',
                              },
                            },
                            {
                              type: {
                                type: 'literal',
                                value: 'whatsapp',
                              },
                            },
                          ],
                        },
                      },
                      {
                        name: 'data',
                        optional: true,
                        comment: {
                          shortText:
                            "A custom data object to store the user's metadata. This maps to the `auth.users.user_metadata` column.",
                          text: 'The `data` should be a JSON object that includes user-specific info, such as their first and last name.\n',
                        },
                        type: {
                          type: 'object',
                        },
                      },
                      {
                        name: 'shouldCreateUser',
                        optional: true,
                        comment: {
                          shortText:
                            'If set to false, this method will not create a new user. Defaults to true.',
                        },
                        type: {
                          type: 'boolean',
                        },
                      },
                    ],
                  },
                },
                {
                  name: 'phone',
                  comment: {
                    shortText: "The user's phone number.",
                  },
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

    expect(parseParam('reference', param, parent as ParentBase, EMPTY_FN_REF)).toStrictEqual(result)
  })
})
