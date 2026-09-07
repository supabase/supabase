import { dynamicTool, jsonSchema, tool, type ToolSet } from 'ai'
import { describe, expect, it, vi } from 'vitest'

import {
  composeTools,
  sanitizeToolErrorForModel,
  sanitizeToolOutput,
  sanitizeToolOutputForModel,
  withToolPolicy,
  type AgentToolPolicy,
} from './tools'

const inputSchema = jsonSchema<unknown>({ type: 'object' })
const options = { toolCallId: 'call', messages: [], context: {} }

function createTool(output: unknown = 'result') {
  return tool({ inputSchema, execute: vi.fn(async () => output) })
}

describe('composeTools', () => {
  it('composes distinct tools and permits replacements only in explicit overrides', () => {
    const first = createTool('first')
    const replacement = createTool('replacement')
    const base = { first }
    const extension = { second: first }
    const result = composeTools({
      base,
      extensions: [extension],
      overrides: { first: replacement, third: replacement },
    })
    expect(result).toEqual({ first: replacement, second: first, third: replacement })
    expect(base.first).toBe(first)
    expect(extension).toEqual({ second: first })
    expect(composeTools({})).toEqual({})
  })

  it('rejects collisions with the base and between extensions', () => {
    const tools = { read: createTool() }
    expect(() => composeTools({ base: tools, extensions: [tools] })).toThrow(
      'Duplicate tool name: read'
    )
    expect(() => composeTools({ extensions: [tools, tools] })).toThrow('Duplicate tool name: read')
  })

  it('handles prototype names as own entries and ignores inherited tools', () => {
    const source = createTool()
    const inherited: ToolSet = Object.create({ inherited: source })
    inherited.own = source
    const special = Object.fromEntries([
      ['__proto__', source],
      ['constructor', source],
    ])
    const result = composeTools({ base: inherited, extensions: [special] })
    expect(Object.keys(result)).toEqual(['own', '__proto__', 'constructor'])
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect(Object.hasOwn(result, '__proto__')).toBe(true)
    expect(result.__proto__).toBe(source)
    expect(() => composeTools({ base: special, extensions: [special] })).toThrow(
      'Duplicate tool name: __proto__'
    )
  })
})

describe('withToolPolicy', () => {
  it('separates tool visibility from execution and hides tools when visibility fails', async () => {
    const source = createTool('secret')
    const context = { visible: true }
    const result = withToolPolicy(
      { hidden: source, broken: source, explained: source },
      {
        context,
        policies: {
          hidden: { visible: () => false },
          broken: {
            visible: () => {
              throw new Error('private failure')
            },
          },
          explained: { visible: (current) => current.visible, canExecute: () => false },
        },
      }
    )
    expect(Object.keys(result)).toEqual(['explained'])
    expect(await result.explained.execute!({}, options)).toEqual({ message: expect.any(String) })
    expect(source.execute).not.toHaveBeenCalled()
    context.visible = false
    expect(
      await result.explained.toModelOutput!({ ...options, input: {}, output: 'secret' })
    ).toEqual({
      type: 'text',
      value: expect.not.stringContaining('secret'),
    })
  })

  it('supplies the call identity and input to execution policies', async () => {
    const source = createTool('allowed')
    const canExecute = vi.fn(
      (_context: undefined, call: { input: unknown }) =>
        typeof call.input === 'object' &&
        call.input !== null &&
        'scope' in call.input &&
        call.input.scope === 'owned'
    )
    const result = withToolPolicy(
      { read: source },
      { context: undefined, policies: { read: { canExecute } } }
    )
    expect(await result.read.execute!({ scope: 'other' }, options)).toEqual({
      message: expect.any(String),
    })
    expect(source.execute).not.toHaveBeenCalled()
    expect(
      await result.read.execute!({ scope: 'owned' }, { ...options, toolCallId: 'allowed-call' })
    ).toBe('allowed')
    expect(canExecute).toHaveBeenLastCalledWith(undefined, {
      name: 'read',
      input: { scope: 'owned' },
      toolCallId: 'allowed-call',
    })
  })

  it('combines input-dependent approval with intrinsic approval without weakening either', async () => {
    const configured = vi.fn(
      async (_context: undefined, call: { input: unknown }) =>
        typeof call.input === 'object' &&
        call.input !== null &&
        'publish' in call.input &&
        call.input.publish === true
    )
    const result = withToolPolicy(
      {
        conditional: { ...createTool(), needsApproval: (input: unknown) => input === 'intrinsic' },
        always: { ...createTool(), needsApproval: true },
        broken: createTool(),
      },
      {
        context: undefined,
        policies: {
          conditional: { needsApproval: configured },
          always: { needsApproval: async () => false },
          broken: {
            needsApproval: async () => {
              throw new Error('private failure')
            },
          },
        },
      }
    )
    const conditional = result.conditional.needsApproval
    const broken = result.broken.needsApproval
    if (typeof conditional !== 'function' || typeof broken !== 'function')
      throw new Error('Expected approval predicates')
    expect(await conditional({ publish: false }, options)).toBe(false)
    expect(await conditional({ publish: true }, options)).toBe(true)
    expect(configured).toHaveBeenLastCalledWith(undefined, {
      name: 'conditional',
      input: { publish: true },
      toolCallId: 'call',
    })
    expect(await conditional('intrinsic', options)).toBe(true)
    expect(result.always.needsApproval).toBe(true)
    expect(await broken({}, options)).toBe(true)
  })

  it('projects live and historical outputs using the same stored call input', async () => {
    const modelOutput = vi.fn((output: unknown, _context: undefined, call: { input: unknown }) =>
      typeof call.input === 'object' &&
      call.input !== null &&
      'share' in call.input &&
      call.input.share === true
        ? output
        : 'Redacted'
    )
    const policy = { context: undefined, policies: { read: { modelOutput } } }
    const result = withToolPolicy({ read: createTool('secret') }, policy)
    expect(
      await result.read.toModelOutput!({ ...options, input: { share: false }, output: 'secret' })
    ).toEqual({
      type: 'text',
      value: 'Redacted',
    })
    expect(
      sanitizeToolOutput('read', 'secret', {
        ...policy,
        input: { share: false },
        toolCallId: 'call',
      })
    ).toBe('Redacted')
    expect(modelOutput).toHaveBeenLastCalledWith('secret', undefined, {
      name: 'read',
      input: { share: false },
      toolCallId: 'call',
    })
    expect(
      sanitizeToolOutput('read', 'secret', {
        ...policy,
        input: { share: true },
        toolCallId: 'call',
      })
    ).toBe('secret')
  })

  it('exposes only tools with an own allowlist entry', () => {
    const source = createTool()
    const policies: Record<string, AgentToolPolicy<undefined>> = Object.create({ inherited: {} })
    policies.read = {}
    const result = withToolPolicy(
      { read: source, unknown: source, inherited: source, toString: source },
      { context: undefined, policies }
    )
    expect(Object.keys(result)).toEqual(['read'])
  })

  it('checks current context immediately before executing and bypasses conversion on denial', async () => {
    const context = { canUse: true }
    const execute = vi.fn(async () => 'secret')
    const convert = vi.fn(() => ({ type: 'text' as const, value: 'secret' }))
    const modelOutput = vi.fn(() => 'also secret')
    const tools = withToolPolicy(
      { read: tool({ inputSchema, execute, toModelOutput: convert }) },
      {
        context,
        policies: {
          read: { canExecute: (current) => current.canUse, deniedOutput: 'Denied', modelOutput },
        },
      }
    )
    context.canUse = false
    expect(await tools.read.execute!({}, options)).toBe('Denied')
    expect(execute).not.toHaveBeenCalled()
    context.canUse = true
    expect(await tools.read.toModelOutput!({ ...options, input: {}, output: 'Denied' })).toEqual({
      type: 'text',
      value: 'Denied',
    })
    expect(convert).not.toHaveBeenCalled()
    expect(modelOutput).not.toHaveBeenCalled()
  })

  it.each(['deny', 'throw', 'reject'] as const)(
    'fails closed when permissions %s',
    async (mode) => {
      const source = createTool('secret')
      const result = withToolPolicy(
        { read: source },
        {
          context: undefined,
          policies: {
            read: {
              canExecute: () => {
                if (mode === 'throw') throw new Error('private policy failure')
                return mode === 'reject' ? Promise.reject(new Error('private failure')) : false
              },
            },
          },
        }
      )
      const output = await result.read.execute!({}, options)
      expect(output).toEqual({ message: expect.stringContaining('permissions') })
      expect(source.execute).not.toHaveBeenCalled()
      expect(JSON.stringify(output)).not.toContain('private')
    }
  )

  it('executes with an asynchronous grant and returns the final streamed tool result', async () => {
    const source = tool({
      inputSchema,
      async *execute() {
        yield 'partial'
        yield 'complete'
      },
    })
    const result = withToolPolicy(
      { read: source },
      { context: undefined, policies: { read: { canExecute: async () => true } } }
    )
    expect(await result.read.execute!({}, options)).toBe('complete')
  })

  it.each(['throw', 'reject', 'stream'] as const)(
    'projects execution errors before SDK conversion when a tool fails by %s',
    async (failure) => {
      const original = new Error('secret database value')
      const source = tool({
        inputSchema,
        execute:
          failure === 'stream'
            ? async function* () {
                yield 'partial'
                throw original
              }
            : () => {
                if (failure === 'throw') throw original
                return Promise.reject(original)
              },
      })
      const context = { scope: 'project' }
      const modelError = vi.fn(() => 'The operation failed.')
      const guarded = withToolPolicy(
        { read: source },
        { context, policies: { read: { modelError } } }
      )
      const error = await Promise.resolve(guarded.read.execute!({ query: 'test' }, options)).catch(
        (error: unknown) => error
      )
      expect(error).toEqual(new Error('The operation failed.'))
      expect(error).not.toBe(original)
      expect(error).not.toHaveProperty('cause')
      expect(String(error)).not.toContain('secret')
      expect(modelError).toHaveBeenCalledWith(original, context, {
        name: 'read',
        input: { query: 'test' },
        toolCallId: 'call',
      })
    }
  )

  it('preserves execution error identity when no error projection is configured', async () => {
    const original = new TypeError('Authentication required')
    const guarded = withToolPolicy(
      {
        read: tool({
          inputSchema,
          execute: async (): Promise<unknown> => {
            throw original
          },
        }),
      },
      { context: undefined, policies: { read: {} } }
    )
    await expect(guarded.read.execute!({}, options)).rejects.toBe(original)
  })

  it.each(['throws', 'returns non-string'] as const)(
    'withholds execution details when the error projection %s',
    async (failure) => {
      const modelError = (() => {
        if (failure === 'throws') throw new Error('secret formatter failure')
        return { secret: 'invalid formatter output' }
      }) as unknown as AgentToolPolicy<undefined>['modelError']
      const policy = { context: undefined, policies: { read: { modelError } } }
      const guarded = withToolPolicy(
        {
          read: tool({
            inputSchema,
            execute: async (): Promise<unknown> => {
              throw new Error('secret execution failure')
            },
          }),
        },
        policy
      )
      await expect(guarded.read.execute!({}, options)).rejects.toThrow('Tool execution failed.')
      expect(await sanitizeToolErrorForModel('read', 'secret historical failure', policy)).toBe(
        'Tool execution failed.'
      )
    }
  )

  it('preserves intrinsic approval requirements and permits policies to add approval', () => {
    const dynamicApproval = vi.fn(() => true)
    const result = withToolPolicy(
      {
        always: { ...createTool(), needsApproval: true },
        conditional: { ...createTool(), needsApproval: dynamicApproval },
        added: createTool(),
        unchanged: createTool(),
      },
      {
        context: undefined,
        policies: {
          always: { needsApproval: false },
          conditional: { needsApproval: false },
          added: { needsApproval: true },
          unchanged: {},
        },
      }
    )
    expect(result.always.needsApproval).toBe(true)
    expect(result.conditional.needsApproval).toBe(dynamicApproval)
    expect(result.added.needsApproval).toBe(true)
    expect(result.unchanged.needsApproval).toBeUndefined()
  })

  it('retains dynamic identity, metadata, and schema', () => {
    const source = dynamicTool({
      inputSchema,
      execute: async () => 'result',
      metadata: { source: 'remote' },
    })
    const result = withToolPolicy(
      { remote: source },
      { context: undefined, policies: { remote: {} } }
    )
    expect(result.remote.type).toBe('dynamic')
    expect(result.remote.inputSchema).toBe(source.inputSchema)
    expect(result.remote.metadata).toBe(source.metadata)
  })

  it('applies the same redaction to live and historical output before original conversion', async () => {
    const secret = { customer: 'private' }
    const modelOutput = (_output: unknown, context: { canShare: boolean }) =>
      context.canShare ? _output : 'Redacted'
    const policy = { context: { canShare: false }, policies: { read: { modelOutput } } }
    const convert = vi.fn(({ output }: { output: unknown }) => ({
      type: 'text' as const,
      value: JSON.stringify(output),
    }))
    const result = withToolPolicy(
      { read: tool({ inputSchema, execute: async () => secret, toModelOutput: convert }) },
      policy
    )
    const output = await result.read.execute!({}, options)
    expect(output).toEqual(secret)
    expect(await result.read.toModelOutput!({ ...options, input: {}, output })).toEqual({
      type: 'text',
      value: '"Redacted"',
    })
    expect(convert).toHaveBeenCalledWith(expect.objectContaining({ output: 'Redacted' }))
    expect(sanitizeToolOutput('read', secret, policy)).toBe('Redacted')
  })

  it('withholds results when permissions change before model conversion', async () => {
    const context = { allowed: true }
    const convert = vi.fn(() => ({ type: 'text' as const, value: 'secret' }))
    const result = withToolPolicy(
      { read: tool({ inputSchema, execute: async () => 'secret', toModelOutput: convert }) },
      { context, policies: { read: { canExecute: (current) => current.allowed } } }
    )
    const output = await result.read.execute!({}, options)
    context.allowed = false
    const modelOutput = await result.read.toModelOutput!({ ...options, input: {}, output })
    expect(JSON.stringify(modelOutput)).not.toContain('secret')
    expect(convert).not.toHaveBeenCalled()
  })

  it('fails closed on redaction failures without invoking the original converter', async () => {
    const convert = vi.fn(() => ({ type: 'text' as const, value: 'secret' }))
    const policy = {
      context: undefined,
      policies: {
        read: {
          deniedOutput: null,
          modelOutput: () => {
            throw new Error('secret')
          },
        },
      },
    }
    const result = withToolPolicy(
      { read: tool({ inputSchema, execute: async () => 'secret', toModelOutput: convert }) },
      policy
    )
    expect(await result.read.toModelOutput!({ ...options, input: {}, output: 'secret' })).toEqual({
      type: 'text',
      value: 'null',
    })
    expect(sanitizeToolOutput('read', 'secret', policy)).toBeNull()
    expect(convert).not.toHaveBeenCalled()
  })

  it('serializes allowed output without an existing converter', async () => {
    const result = withToolPolicy(
      { read: createTool() },
      { context: undefined, policies: { read: {} } }
    )
    expect(
      await result.read.toModelOutput!({ ...options, input: {}, output: { safe: true } })
    ).toEqual({ type: 'text', value: '{"safe":true}' })
  })

  it('rejects guarded provider execution that would bypass local permissions', () => {
    expect(() =>
      withToolPolicy(
        {
          remote: {
            type: 'provider',
            id: 'provider.remote',
            args: {},
            isProviderExecuted: true,
            inputSchema,
          },
        },
        { context: undefined, policies: { remote: { canExecute: () => false } } }
      )
    ).toThrow('Cannot enforce local execution permissions')
  })
})

describe('sanitizeToolOutput', () => {
  it('withholds output from a tool hidden by its current visibility policy', () => {
    expect(
      sanitizeToolOutput('read', 'secret', {
        context: undefined,
        policies: { read: { visible: () => false, deniedOutput: 'Hidden' } },
      })
    ).toBe('Hidden')
  })
  it('withholds unknown outputs including inherited policy names', () => {
    const options = { context: undefined, policies: {} }
    expect(sanitizeToolOutput('unknown', 'secret', options)).toEqual({
      message: expect.stringContaining('permissions'),
    })
    expect(sanitizeToolOutput('toString', 'secret', { ...options, unknownOutput: 'Hidden' })).toBe(
      'Hidden'
    )
  })

  it('accepts an explicitly configured prototype name and preserves allowed output', () => {
    const policies = Object.fromEntries([['__proto__', {}]])
    expect(sanitizeToolOutput('__proto__', 'visible', { context: undefined, policies })).toBe(
      'visible'
    )
  })
})

describe('historical model sanitization', () => {
  it('checks asynchronous permissions against the stored input before sharing outputs or errors', async () => {
    const context = { allowedScope: 'owned' }
    const canExecute = vi.fn(async (current: typeof context, call: { input: unknown }) => {
      return (
        typeof call.input === 'object' &&
        call.input !== null &&
        'scope' in call.input &&
        call.input.scope === current.allowedScope
      )
    })
    const modelOutput = vi.fn(() => 'Shared output')
    const modelError = vi.fn(() => 'Shared error')
    const policy = {
      context,
      policies: { read: { canExecute, modelOutput, modelError, deniedOutput: 'Denied' } },
      input: { scope: 'owned' },
      toolCallId: 'stored-call',
    }
    expect(await sanitizeToolOutputForModel('read', 'secret output', policy)).toBe('Shared output')
    expect(await sanitizeToolErrorForModel('read', 'secret failure', policy)).toBe('Shared error')
    expect(canExecute).toHaveBeenLastCalledWith(context, {
      name: 'read',
      input: { scope: 'owned' },
      toolCallId: 'stored-call',
    })
    expect(modelError).toHaveBeenLastCalledWith('secret failure', context, {
      name: 'read',
      input: { scope: 'owned' },
      toolCallId: 'stored-call',
    })
    context.allowedScope = 'other'
    modelOutput.mockClear()
    modelError.mockClear()
    expect(await sanitizeToolOutputForModel('read', 'secret output', policy)).toBe('Denied')
    expect(await sanitizeToolErrorForModel('read', 'secret failure', policy)).toBe('Denied')
    expect(modelOutput).not.toHaveBeenCalled()
    expect(modelError).not.toHaveBeenCalled()
    // The synchronous helper remains an explicit sharing-only projection for compatibility.
    expect(sanitizeToolOutput('read', 'secret output', policy)).toBe('Shared output')
  })

  it.each(['hidden', 'rejected', 'missing'] as const)(
    'fails closed when a historical tool is %s under current policy',
    async (state) => {
      const modelOutput = vi.fn(() => 'secret output')
      const modelError = vi.fn(() => 'secret error')
      const policies: Record<string, AgentToolPolicy<undefined>> = {
        read: {
          visible: () => state !== 'hidden',
          canExecute: async () => {
            throw new Error('secret policy failure')
          },
          modelOutput,
          modelError,
          deniedOutput: 'Denied',
        },
      }
      if (state === 'missing') delete policies.read
      const policy = { context: undefined, policies, unknownOutput: 'Denied' }
      expect(await sanitizeToolOutputForModel('read', 'secret output', policy)).toBe('Denied')
      expect(await sanitizeToolErrorForModel('read', 'secret failure', policy)).toBe('Denied')
      expect(modelOutput).not.toHaveBeenCalled()
      expect(modelError).not.toHaveBeenCalled()
    }
  )

  it('ignores inherited policies and preserves an explicit null unknown output', async () => {
    const policy = { context: undefined, policies: {}, unknownOutput: null }
    expect(await sanitizeToolOutputForModel('toString', 'secret', policy)).toBeNull()
    expect(await sanitizeToolErrorForModel('toString', 'secret', policy)).toBe('null')
  })

  it('retains authorized historical errors without a formatter', async () => {
    const policy = { context: undefined, policies: { read: {} } }
    expect(await sanitizeToolErrorForModel('read', 'Stored error', policy)).toBe('Stored error')
    expect(await sanitizeToolErrorForModel('read', new Error('Stored error'), policy)).toBe(
      'Stored error'
    )
  })
})
