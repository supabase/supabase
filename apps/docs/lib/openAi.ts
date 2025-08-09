import OpenAI from 'openai'
import 'server-only'
import {
  convertUnknownToApiError,
  InvalidRequestError,
  type ApiError,
  type ApiErrorGeneric,
} from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'

type Embedding = Array<number>

export interface EmbeddingWithTokens {
  embedding: Embedding
  token_count: number
}

interface ModerationFlaggedDetails {
  flagged: boolean
  categories: OpenAI.Moderations.Moderation.Categories
}

export interface OpenAIClientInterface {
  createContentEmbedding(text: string): Promise<Result<EmbeddingWithTokens, ApiErrorGeneric>>
}

let openAIClient: OpenAIClientInterface | null

class OpenAIClient implements OpenAIClientInterface {
  static CONTENT_EMBEDDING_MODEL = 'text-embedding-ada-002'

  constructor(private client: OpenAI) {}

  async createContentEmbedding(
    text: string
  ): Promise<Result<EmbeddingWithTokens, ApiErrorGeneric>> {
    return await Result.tryCatchFlat(
      this.createContentEmbeddingImpl.bind(this),
      convertUnknownToApiError,
      text
    )
  }

  private async createContentEmbeddingImpl(
    text: string
  ): Promise<Result<EmbeddingWithTokens, ApiError<ModerationFlaggedDetails>>> {
    const query = text.trim()

    const moderationResponse = await this.client.moderations.create({ input: query })
    const [result] = moderationResponse.results
    if (result.flagged) {
      return Result.error(
        new InvalidRequestError('Content flagged as inappropriate', undefined, {
          flagged: true,
          categories: result.categories,
        })
      )
    }

    const embeddingsResponse = await this.client.embeddings.create({
      model: OpenAIClient.CONTENT_EMBEDDING_MODEL,
      input: query,
    })
    const [{ embedding: queryEmbedding }] = embeddingsResponse.data
    const tokenCount = embeddingsResponse.usage.total_tokens

    return Result.ok({
      embedding: queryEmbedding,
      token_count: tokenCount,
    })
  }
}

export function openAI(): OpenAIClientInterface {
  if (!openAIClient) {
    openAIClient = new OpenAIClient(new OpenAI())
  }
  return openAIClient
}
