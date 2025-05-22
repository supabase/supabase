import { type RootQueryTypeSearchDocsArgs } from '~/__generated__/graphql'
import { convertPostgrestToApiError, type ApiErrorGeneric } from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import { openAI } from '~/lib/openAi'
import { supabase, type DatabaseCorrected } from '~/lib/supabase'
import { GuideModel } from '../guide/guideModel'
import {
  DB_METADATA_TAG_PLATFORM_CLI,
  ReferenceCLICommandModel,
} from '../reference/referenceCLIModel'
import { ReferenceSDKFunctionModel, SDKLanguageValues } from '../reference/referenceSDKModel'
import { TroubleshootingModel } from '../troubleshooting/troubleshootingModel'
import { SearchResultInterface } from './globalSearchInterface'

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
        .map((matches) => matches.map(createModelFromMatch).filter(Boolean))
        .mapError(convertPostgrestToApiError)

      return matchResult
    })
  }
}

function createModelFromMatch({
  type,
  page_title,
  href,
  content,
  metadata,
  subsections,
}: DatabaseCorrected['public']['Functions']['search_content']['Returns'][number]): SearchResultInterface | null {
  switch (type) {
    case 'markdown':
      return new GuideModel({
        title: page_title,
        href,
        content,
        subsections,
      })
    case 'reference':
      const { language } = metadata
      if (SDKLanguageValues.includes(language)) {
        return new ReferenceSDKFunctionModel({
          title: page_title,
          href,
          content,
          language,
          methodName: metadata.methodName,
        })
      } else if (metadata.platform === DB_METADATA_TAG_PLATFORM_CLI) {
        return new ReferenceCLICommandModel({
          title: page_title,
          href,
          content,
          subsections,
        })
      } else {
        break
      }
    case 'github-discussions':
      return new TroubleshootingModel({
        title: page_title,
        href,
        content,
      })
    default:
      return null
  }
}
