import type { Tool, ToolSet } from 'ai'

export type AgentToolCall = {
  readonly name: string
  readonly input: unknown
  readonly toolCallId: string
}

export type AgentToolPolicy<TContext> = {
  /** Controls discovery separately from permission to execute an exposed tool. */
  visible?: (context: TContext) => boolean
  canExecute?: (context: TContext, call: AgentToolCall) => boolean | Promise<boolean>
  needsApproval?: boolean | ((context: TContext, call: AgentToolCall) => boolean | Promise<boolean>)
  deniedOutput?: unknown
  modelOutput?: (output: unknown, context: TContext, call: AgentToolCall) => unknown
  /** Projects execution errors before the SDK can include their text in model history. */
  modelError?: (error: unknown, context: TContext, call: AgentToolCall) => string
}

type ToolPolicyOptions<TContext> = {
  context: TContext
  policies: Record<string, AgentToolPolicy<TContext>>
}

type ToolOutputPolicyOptions<TContext> = ToolPolicyOptions<TContext> & {
  unknownOutput?: unknown
  input?: unknown
  /** Supply the stored ID for input-aware sharing policies; omitted IDs remain empty. */
  toolCallId?: string
}

const DENIED_OUTPUT = { message: 'This tool is not available with the current permissions.' }

function getDeniedOutput<TContext>(policy: AgentToolPolicy<TContext>): unknown {
  return Object.hasOwn(policy, 'deniedOutput') ? policy.deniedOutput : DENIED_OUTPUT
}

function isVisible<TContext>(policy: AgentToolPolicy<TContext>, context: TContext): boolean {
  try {
    return policy.visible ? policy.visible(context) === true : true
  } catch {
    return false
  }
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Symbol.asyncIterator in value &&
    typeof value[Symbol.asyncIterator] === 'function'
  )
}

function setTool(tools: ToolSet, name: string, tool: ToolSet[string]) {
  // Tool names are external data. Defining an own property also handles __proto__ safely.
  Object.defineProperty(tools, name, {
    value: tool,
    enumerable: true,
    configurable: true,
    writable: true,
  })
}

/** Ordinary tool sets must have unique names; replacing a tool requires an explicit override. */
export function composeTools({
  base = {},
  extensions = [],
  overrides = {},
}: {
  base?: ToolSet
  extensions?: readonly ToolSet[]
  overrides?: ToolSet
}): ToolSet {
  const tools: ToolSet = {}
  for (const source of [base, ...extensions]) {
    for (const [name, tool] of Object.entries(source)) {
      if (Object.hasOwn(tools, name)) throw new Error(`Duplicate tool name: ${name}`)
      setTool(tools, name, tool)
    }
  }
  for (const [name, tool] of Object.entries(overrides)) setTool(tools, name, tool)
  return tools
}

/** Apply output sharing without evaluating asynchronous execution permissions. */
export function sanitizeToolOutput<TContext>(
  name: string,
  output: unknown,
  {
    context,
    policies,
    unknownOutput = DENIED_OUTPUT,
    input,
    toolCallId = '',
  }: ToolOutputPolicyOptions<TContext>
): unknown {
  if (!Object.hasOwn(policies, name)) return unknownOutput
  const policy = policies[name]
  if (!isVisible(policy, context)) return getDeniedOutput(policy)
  try {
    return policy.modelOutput
      ? policy.modelOutput(output, context, { name, input, toolCallId })
      : output
  } catch {
    return getDeniedOutput(policy)
  }
}

/** Recheck current execution permission before sharing a stored result with the model. */
export async function sanitizeToolOutputForModel<TContext>(
  name: string,
  output: unknown,
  options: ToolOutputPolicyOptions<TContext>
): Promise<unknown> {
  const { unknownOutput = DENIED_OUTPUT } = options
  if (!Object.hasOwn(options.policies, name)) return unknownOutput
  const policy = options.policies[name]
  const call = { name, input: options.input, toolCallId: options.toolCallId ?? '' }
  if (!(await canExecute(policy, options.context, call))) return getDeniedOutput(policy)
  return sanitizeToolOutput(name, output, options)
}

function projectToolError<TContext>(
  policy: AgentToolPolicy<TContext>,
  error: unknown,
  context: TContext,
  call: AgentToolCall
): string {
  try {
    if (policy.modelError) {
      const projected: unknown = policy.modelError(error, context, call)
      return typeof projected === 'string' ? projected : 'Tool execution failed.'
    }
    if (error instanceof Error) return error.message
    return typeof error === 'string' ? error : (JSON.stringify(error) ?? 'Tool execution failed.')
  } catch {
    return 'Tool execution failed.'
  }
}

/** Apply the same error policy to historical failures, which bypass SDK output conversion. */
export async function sanitizeToolErrorForModel<TContext>(
  name: string,
  error: unknown,
  options: ToolOutputPolicyOptions<TContext>
): Promise<string> {
  const { unknownOutput = DENIED_OUTPUT } = options
  if (!Object.hasOwn(options.policies, name)) return textOutput(unknownOutput).value
  const policy = options.policies[name]
  const call = { name, input: options.input, toolCallId: options.toolCallId ?? '' }
  if (!(await canExecute(policy, options.context, call))) {
    return textOutput(getDeniedOutput(policy)).value
  }
  return projectToolError(policy, error, options.context, call)
}

async function canExecute<TContext>(
  policy: AgentToolPolicy<TContext>,
  context: TContext,
  call: AgentToolCall
) {
  if (!isVisible(policy, context)) return false
  try {
    return policy.canExecute ? (await policy.canExecute(context, call)) === true : true
  } catch {
    return false
  }
}

function approvalRequirement<TContext>(
  tool: Tool,
  policy: AgentToolPolicy<TContext>,
  context: TContext,
  name: string
): Tool['needsApproval'] {
  const intrinsic = tool.needsApproval
  const configured = policy.needsApproval
  if (intrinsic === true || configured === true) return true
  if (typeof configured !== 'function') return intrinsic
  return async (input, options) => {
    try {
      if (typeof intrinsic === 'function' && (await intrinsic(input, options)) !== false)
        return true
      return (await configured(context, { name, input, toolCallId: options.toolCallId })) !== false
    } catch {
      // An unavailable approval policy must never let a call execute automatically.
      return true
    }
  }
}

function textOutput(output: unknown): { type: 'text'; value: string } {
  try {
    return {
      type: 'text',
      value: typeof output === 'string' ? output : (JSON.stringify(output) ?? 'null'),
    }
  } catch {
    return { type: 'text', value: JSON.stringify(DENIED_OUTPUT) }
  }
}

/**
 * Only explicitly listed tools are exposed. Permission checks happen at execution time,
 * including approval continuations, and cannot remove an intrinsic approval requirement.
 */
export function withToolPolicy<TContext>(
  tools: ToolSet,
  { context, policies }: ToolPolicyOptions<TContext>
): ToolSet {
  const allowed: ToolSet = {}
  for (const [name, tool] of Object.entries(tools)) {
    if (!Object.hasOwn(policies, name)) continue
    const policy = policies[name]
    if (!isVisible(policy, context)) continue
    if (
      tool.type === 'provider' &&
      tool.isProviderExecuted &&
      (policy.visible || policy.canExecute || policy.needsApproval || tool.needsApproval)
    ) {
      throw new Error(`Cannot enforce local execution permissions for provider tool: ${name}`)
    }
    const execute = tool.execute
    const originalToModelOutput = tool.toModelOutput
    const deniedCalls = new Set<string>()
    const deniedOutput = () => getDeniedOutput(policy)
    const wrapped: Tool = {
      ...tool,
      needsApproval: approvalRequirement(tool, policy, context, name),
      ...(execute && {
        execute: async (input, options) => {
          const call = { name, input, toolCallId: options.toolCallId }
          if (!(await canExecute(policy, context, call))) {
            deniedCalls.add(options.toolCallId)
            return deniedOutput()
          }
          try {
            const output: unknown = await execute(input, options)
            if (!isAsyncIterable(output)) return output
            // Permission checks are asynchronous. Return the final value rather than a
            // Promise<AsyncIterable>, which the SDK would mistake for a tool result.
            let finalOutput: unknown
            for await (const value of output) finalOutput = value
            return finalOutput
          } catch (error) {
            if (!policy.modelError) throw error
            throw new Error(projectToolError(policy, error, context, call))
          }
        },
      }),
      toModelOutput: async (options) => {
        const call = { name, input: options.input, toolCallId: options.toolCallId }
        if (deniedCalls.has(options.toolCallId) || !(await canExecute(policy, context, call))) {
          return textOutput(deniedOutput())
        }
        let output: unknown
        try {
          output = policy.modelOutput
            ? policy.modelOutput(options.output, context, call)
            : options.output
        } catch {
          return textOutput(deniedOutput())
        }
        return originalToModelOutput
          ? originalToModelOutput({ ...options, output })
          : textOutput(output)
      },
    }
    setTool(allowed, name, wrapped)
  }
  return allowed
}
