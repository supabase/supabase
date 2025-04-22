import { convertPostgrestToApiError, type ApiErrorGeneric } from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import { openAI } from '~/lib/openAi'
import { supabase } from '~/lib/supabase'
import { type ISearchResultArgs } from './globalSearchSchema'

export class SearchResultModel {
  static async search(
    args: ISearchResultArgs
  ): Promise<Result<SearchResultModel[], ApiErrorGeneric>> {
    const query = args.query.trim()
    const embeddingResult = await openAI().createContentEmbedding(query)

    return embeddingResult.flatMapAsync(async (embedding) => {
      const matchResult = new Result(
        await supabase().rpc('match_page_sections_v2', {
          embedding,
          match_threshold: 0.78,
          min_content_length: 50,
        })
      )
        .map((matches) =>
          matches.map(
            ({ id, heading, content }) =>
              new SearchResultModel({ id: String(id), title: heading, content })
          )
        )
        .mapError(convertPostgrestToApiError)

      return matchResult
    })
  }

  public id: string
  public title?: string
  public description?: string
  public content?: string

  constructor({
    id,
    title,
    description,
    content,
  }: {
    id: string
    title?: string
    description?: string
    content?: string
  }) {
    this.id = id
    this.title = title
    this.description = description
    this.content = content
  }
}
