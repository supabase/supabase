import type { UIMessage } from 'ai'

import type { AgentStreamStatus } from './stream'

type MaybePromise<T> = T | Promise<T>

export type AgentRunInput = { messages: UIMessage[]; trigger?: string }
export type AgentRunOutcome = { responseMessage?: UIMessage; status: AgentStreamStatus }
export type AgentToolOperation = {
  toolCallId: string
  name: string
  input: unknown
  execute: () => Promise<unknown>
}

/**
 * Application-owned persistence. Context and state may use any identity, revision,
 * storage layout, or transaction implementation; neither is sent to the model.
 */
export type AgentPersistence<Context, State> = {
  /** Authorize, claim the turn, and reconcile canonical history atomically. */
  startRun: (
    context: Context,
    input: AgentRunInput
  ) => MaybePromise<{
    state: State
    messages: UIMessage[]
  }>
  /** Save the outcome and release the claim together, fenced against newer runs. */
  finishRun: (context: Context, state: State, outcome: AgentRunOutcome) => MaybePromise<void>
  /** Commit a durable claim before invoking execute; never repeat an uncertain write. */
  executeTool?: (context: Context, state: State, operation: AgentToolOperation) => Promise<unknown>
}

export type AgentRun<State> = {
  readonly state: State
  readonly messages: UIMessage[]
  finish: (outcome: AgentRunOutcome) => Promise<void>
  executeTool: (operation: AgentToolOperation) => Promise<unknown>
}

/**
 * Await persistence before starting the model. A successful finish is idempotent;
 * a failed save permits a later failure-settlement attempt by the stream handler.
 */
export async function startAgentRun<Context, State>({
  persistence,
  context,
  messages,
  trigger,
}: {
  persistence: AgentPersistence<Context, State>
  context: Context
} & AgentRunInput): Promise<AgentRun<State>> {
  const started = await persistence.startRun(context, { messages, trigger })
  let finished = false
  let finishStarted = false
  let finishing: Promise<void> | undefined

  return {
    state: started.state,
    messages: started.messages,
    finish(outcome) {
      if (finishing) return finishing
      if (finished) return Promise.resolve()
      finishStarted = true
      finishing = Promise.resolve()
        .then(() => persistence.finishRun(context, started.state, outcome))
        .then(() => {
          finished = true
        })
        .finally(() => {
          finishing = undefined
        })
      return finishing
    },
    async executeTool(operation) {
      if (finishStarted) throw new Error('This agent run is no longer active.')
      if (!persistence.executeTool) throw new Error('Tool execution persistence is not configured.')
      return persistence.executeTool(context, started.state, operation)
    },
  }
}
