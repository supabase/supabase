import { anthropic } from '@ai-sdk/anthropic'
import type { LanguageModel, ToolSet, UIMessage } from 'ai'
import { IS_PLATFORM } from 'common'
import type { NextApiRequest, NextApiResponse } from 'next'
import z from 'zod'

import { DEFAULT_AI_SRE_FOCUS_WEIGHTS } from '@/data/ai-sre/ai-sre.types'
import type { AiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { getAIDetails } from '@/lib/ai/ai-details'
import { isTracingAllowed } from '@/lib/ai/braintrust-logger'
import { generateAssistantResponse } from '@/lib/ai/generate-assistant-response'
import { createGitHubMCPClient, GITHUB_SRE_ALLOWED_TOOLS } from '@/lib/ai/github-mcp'
import { getModel } from '@/lib/ai/model'
import { DEFAULT_ASSISTANT_BASE_MODEL_ID, getAssistantModelEntry } from '@/lib/ai/model.utils'
import { buildSreRunPrompt, parseSreReport } from '@/lib/ai/sre-prompt'
import { createSupabaseMCPClient } from '@/lib/ai/supabase-mcp'
import { apiWrapper } from '@/lib/api/apiWrapper'

export const maxDuration = 300

/**
 * Read-only MCP tools the SRE is allowed to use. Unlike the chat assistant (which
 * curates MCP tools down and runs SQL through a client-side tool), the headless SRE
 * talks to the hosted MCP directly and uses its own server-executed `execute_sql`.
 * The client sets `read_only=true`, so writes throw; this list is a second gate that
 * keeps only read/diagnostic tools.
 */
const SRE_ALLOWED_MCP_TOOLS = new Set([
  'execute_sql',
  'get_advisors',
  'query_logs',
  'get_logs',
  'list_tables',
  'list_extensions',
  'list_migrations',
  'list_edge_functions',
  'search_docs',
])

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req
  if (method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: { message: `Method ${method} Not Allowed` } })
  }
  return handlePost(req, res)
}

const wrapper = (req: NextApiRequest, res: NextApiResponse) =>
  apiWrapper(req, res, handler, { withAuth: true })

export default wrapper

const requestBodySchema = z.object({
  projectRef: z.string(),
  connectionString: z.string(),
  orgSlug: z.string().optional(),
  focusAreas: z
    .object({
      performance: z.number().min(0).max(5),
      security: z.number().min(0).max(5),
      billing: z.number().min(0).max(5),
    })
    .optional(),
  githubAccessLevel: z.enum(['read_only', 'draft_pr', 'merge_pr']).optional(),
  hasGithubConnection: z.boolean().optional(),
  // Session-only GitHub PAT (read-only). Used transient-per-run, never persisted or logged.
  githubToken: z.string().optional(),
})

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const authorization = req.headers.authorization
  const accessToken = authorization?.replace('Bearer ', '')

  if (IS_PLATFORM && !accessToken) {
    return res.status(401).json({ error: 'Authorization token is required' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const { data, error: parseError } = requestBodySchema.safeParse(body)
  if (parseError) {
    return res.status(400).json({ error: 'Invalid request body', issues: parseError.issues })
  }

  const {
    projectRef,
    orgSlug: rawOrgSlug,
    focusAreas = DEFAULT_AI_SRE_FOCUS_WEIGHTS,
    githubAccessLevel = 'read_only',
    githubToken,
  } = data

  // Default locally to schema_and_log so the agent can reach logs/advisors tools.
  let aiOptInLevel: AiOptInLevel = IS_PLATFORM ? 'disabled' : 'schema_and_log'
  let projectRegion: string | undefined
  let orgId: number | undefined
  let orgSlug: string | undefined
  let planId: string | undefined
  let isHighComplianceProject: boolean | undefined

  if (IS_PLATFORM && rawOrgSlug && authorization) {
    try {
      const aiDetails = await getAIDetails({ orgSlug: rawOrgSlug, projectRef, authorization })
      aiOptInLevel = aiDetails.aiOptInLevel
      orgId = aiDetails.orgId
      orgSlug = aiDetails.orgSlug
      planId = aiDetails.planId
      projectRegion = aiDetails.region
      isHighComplianceProject = aiDetails.isHighComplianceProject
    } catch (error) {
      return res
        .status(400)
        .json({ error: 'There was an error fetching your organization details' })
    }
  }

  if (aiOptInLevel === 'disabled') {
    return res.status(403).json({
      error: 'AI features are disabled for this organization. Enable AI opt-in to run the AI SRE.',
    })
  }

  // Prefer the developer's Anthropic key when present (prototype convenience).
  // getModel() only wires OpenAI/Bedrock, so Anthropic is constructed directly here.
  let modelParams: { model: LanguageModel; providerOptions?: Record<string, any> }
  let systemProviderOptions: Record<string, any> | undefined

  if (process.env.ANTHROPIC_API_KEY) {
    // Current Sonnet alias. Claude 3.5 ids (claude-3-5-sonnet-*) are retired and 404.
    // Override with ANTHROPIC_MODEL (e.g. claude-opus-4-8) if your workspace prefers another.
    const anthropicModelId = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
    modelParams = { model: anthropic(anthropicModelId) }
  } else {
    const result = await getModel({
      provider: 'openai',
      modelEntry: getAssistantModelEntry(DEFAULT_ASSISTANT_BASE_MODEL_ID),
    })
    if (result.error) {
      return res.status(500).json({
        error: `${result.error.message}. Set ANTHROPIC_API_KEY (or OPENAI_API_KEY) in apps/studio/.env.local.`,
      })
    }
    modelParams = result.modelParams
    systemProviderOptions = result.systemProviderOptions
  }

  let mcpClient: Awaited<ReturnType<typeof createSupabaseMCPClient>> | undefined
  let githubMcpClient: Awaited<ReturnType<typeof createGitHubMCPClient>> | undefined
  let clientsClosed = false
  const closeClients = () => {
    if (clientsClosed) return
    clientsClosed = true
    void mcpClient?.close().catch(() => {})
    void githubMcpClient?.close().catch(() => {})
  }

  try {
    const abortController = new AbortController()
    req.on('close', () => abortController.abort())
    res.on('close', () => abortController.abort())

    // Connect to the hosted MCP directly (read_only=true, scoped to project_ref) and take
    // its server-executed tools — including execute_sql — so the headless agent can run its
    // own read-only diagnostic SQL. We bypass the chat assistant's client-side execute_sql,
    // which can't resolve without a browser and would stall the run.
    let tools: ToolSet = {}
    if (IS_PLATFORM && accessToken) {
      mcpClient = await createSupabaseMCPClient({ accessToken, projectRef })
      const allTools = (await mcpClient.tools()) as ToolSet
      tools = Object.fromEntries(
        Object.entries(allTools).filter(([name]) => SRE_ALLOWED_MCP_TOOLS.has(name))
      )
    }

    // Optionally connect the developer's GitHub repo (read-only), via a GitHub MCP client
    // authenticated with their session-only PAT. Lets the SRE correlate a Supabase symptom to
    // code. A failure here degrades to a Supabase-only run rather than failing the whole sweep.
    let hasGithubConnection = false
    if (githubToken) {
      try {
        githubMcpClient = await createGitHubMCPClient({ githubToken })
        const githubTools = (await githubMcpClient.tools()) as ToolSet
        const allowedGithubTools = Object.fromEntries(
          Object.entries(githubTools).filter(([name]) => GITHUB_SRE_ALLOWED_TOOLS.has(name))
        )
        tools = { ...tools, ...allowedGithubTools }
        hasGithubConnection = Object.keys(allowedGithubTools).length > 0
      } catch (error) {
        console.error('Failed to connect GitHub MCP:', error)
      }
    }

    const prompt = buildSreRunPrompt({ focusAreas, githubAccessLevel, hasGithubConnection })
    const messages: UIMessage[] = [
      { id: 'sre-run', role: 'user', parts: [{ type: 'text', text: prompt }] },
    ]

    const result = await generateAssistantResponse({
      messages,
      ...modelParams,
      tools,
      aiOptInLevel,
      projectRef,
      allowTracing: isTracingAllowed({ projectRegion }),
      orgId,
      orgSlug,
      planId,
      isHighComplianceProject,
      effectiveModel: DEFAULT_ASSISTANT_BASE_MODEL_ID,
      systemProviderOptions,
      abortSignal: abortController.signal,
    })

    // Stream the run transcript to the client as newline-delimited JSON so the UI
    // can show a live console, then send the parsed report as the final line.
    res.status(200)
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')

    const write = (obj: unknown) => {
      res.write(JSON.stringify(obj) + '\n')
      ;(res as unknown as { flush?: () => void }).flush?.()
    }

    try {
      for await (const part of result.fullStream) {
        const line = serializeStreamPart(part)
        if (line) write(line)
      }
      const text = await result.text
      write({ type: 'report', report: parseSreReport(text) })
    } catch (streamError) {
      console.error('Error during AI SRE run stream:', streamError)
      write({
        type: 'error',
        message: streamError instanceof Error ? streamError.message : String(streamError),
      })
    } finally {
      res.end()
    }
  } catch (error) {
    console.error('Error in AI SRE run:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    if (!res.headersSent) return res.status(500).json({ error: message })
    res.end()
  } finally {
    closeClients()
  }
}

/** Compact a streamText part into a small console event. Returns null to skip noise. */
function serializeStreamPart(part: {
  type: string
  [key: string]: any
}): Record<string, any> | null {
  const truncate = (value: unknown, max = 600): string => {
    const str = typeof value === 'string' ? value : JSON.stringify(value ?? '')
    return str.length > max ? `${str.slice(0, max)}…` : str
  }

  switch (part.type) {
    case 'text-delta':
      return { type: 'text', text: part.text ?? part.textDelta ?? '' }
    case 'reasoning-delta':
      return { type: 'reasoning', text: part.text ?? part.textDelta ?? '' }
    case 'tool-call':
      return {
        type: 'tool-call',
        toolName: part.toolName,
        input: truncate(part.input ?? part.args),
      }
    case 'tool-result':
      return {
        type: 'tool-result',
        toolName: part.toolName,
        output: truncate(part.output ?? part.result),
      }
    case 'tool-error':
      return {
        type: 'tool-error',
        toolName: part.toolName,
        error: truncate(part.error instanceof Error ? part.error.message : part.error),
      }
    case 'error':
      return {
        type: 'error',
        message: truncate(part.error instanceof Error ? part.error.message : part.error),
      }
    case 'finish':
      return { type: 'finish', finishReason: part.finishReason }
    default:
      return null
  }
}
