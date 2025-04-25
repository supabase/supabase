import { type RootQueryTypeSearchDocsArgs } from '~/__generated__/graphql'
import { convertPostgrestToApiError, type ApiErrorGeneric } from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import { openAI } from '~/lib/openAi'
import { supabase } from '~/lib/supabase'
import { GuideModel } from '../guide/guideModel'

export abstract class SearchResultModel {
  static async search(
    args: RootQueryTypeSearchDocsArgs,
    requestedFields: Array<string>
  ): Promise<Result<SearchResultModel[], ApiErrorGeneric>> {
    const query = args.query.trim()
    const includeFullContent = requestedFields.includes('content')
    const embeddingResult = await openAI().createContentEmbedding(query)

    return embeddingResult.flatMapAsync(async (embedding) => {
      const matchResult = new Result(
        await supabase().rpc('search_content', {
          embedding,
          include_full_content: includeFullContent,
          max_result: args.limit,
        })
      )
        .map((matches) =>
          matches
            .map(({ type, page_title, href, content, subsections }) => {
              switch (type) {
                case 'markdown':
                  return new GuideModel({
                    title: page_title,
                    href,
                    content,
                    subsections,
                  })
                default:
                  return null
              }
            })
            .filter(Boolean)
        )
        .mapError(convertPostgrestToApiError)

      return matchResult
    })
  }
}
