/**
 * One model step for the local host. The browser runs the agent loop because
 * some tools live in mounted views (workspace tools); the server only holds the
 * provider credentials. Supports private deployments: Bedrock in your own AWS
 * account, or any OpenAI-compatible endpoint (vLLM, Ollama, an internal gateway).
 */
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { generateText, jsonSchema, tool, type LanguageModel, type ModelMessage } from 'ai'

import type { HostConfig } from './config.ts'

export interface ModelTool {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
}

export interface ModelStepRequest {
  system?: string
  messages: ModelMessage[]
  tools: ModelTool[]
}

export function resolveModel(config: HostConfig): LanguageModel {
  if (!config.model) throw new Error('No model is configured. Set HOST_MODEL to chat.')
  const separator = config.model.indexOf(':')
  const provider = config.model.slice(0, separator)
  const id = config.model.slice(separator + 1)
  if (separator < 1 || !id) throw new Error('HOST_MODEL must look like <provider>:<model>.')
  switch (provider) {
    case 'bedrock':
      return createAmazonBedrock({
        region: process.env.AWS_REGION ?? 'us-east-1',
        credentialProvider: fromNodeProviderChain(),
      })(id)
    case 'anthropic':
      return createAnthropic({
        apiKey: config.modelApiKey ?? process.env.ANTHROPIC_API_KEY,
        baseURL: config.modelBaseUrl,
      })(id)
    case 'openai':
      return createOpenAI({
        apiKey: config.modelApiKey ?? process.env.OPENAI_API_KEY,
        baseURL: config.modelBaseUrl,
      })(id)
    case 'openai-compatible':
      if (!config.modelBaseUrl)
        throw new Error('openai-compatible models need HOST_MODEL_BASE_URL.')
      return createOpenAI({
        apiKey: config.modelApiKey ?? 'unused',
        baseURL: config.modelBaseUrl,
      }).chat(id)
    default:
      throw new Error(
        `Unknown model provider "${provider}". Use bedrock, anthropic, openai or openai-compatible.`
      )
  }
}

/** Runs one step: the model either answers or asks for tool calls, which the browser executes. */
export async function runModelStep(
  config: HostConfig,
  request: ModelStepRequest,
  model: LanguageModel = resolveModel(config)
) {
  const tools = Object.fromEntries(
    request.tools.map((definition) => [
      definition.name,
      tool({
        description: definition.description,
        inputSchema: jsonSchema(definition.inputSchema as never),
      }),
    ])
  )
  const result = await generateText({
    model,
    system: request.system,
    messages: request.messages,
    tools,
  })
  return {
    text: result.text,
    toolCalls: result.toolCalls.map((call) => ({
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      input: call.input,
    })),
    messages: result.response.messages,
    finishReason: result.finishReason,
  }
}
