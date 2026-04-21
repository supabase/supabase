import { type RootQueryTypeSearchDocsArgs } from '~/__generated__/graphql'
import { convertPostgrestToApiError, type ApiErrorGeneric } from '~/app/api/utils'
import { Result } from '~/features/helpers.fn'
import { openAI } from '~/lib/openAi'
import { supabase, type DatabaseCorrected } from '~/lib/supabase'

import { isFeatureEnabled } from '../../../../packages/common/enabled-features'
import { GuideModel } from '../guide/guideModel'
import {
  DB_METADATA_TAG_PLATFORM_CLI,
  ReferenceCLICommandModel,
} from '../reference/referenceCLIModel'
import { ReferenceManagementApiModel } from '../reference/referenceManagementApiModel'
import { ReferenceSDKFunctionModel, SDKLanguageValues } from '../reference/referenceSDKModel'
import { TroubleshootingModel } from '../troubleshooting/troubleshootingModel'
import { SearchResultInterface } from './globalSearchInterface'

type SearchFunction = 'search_content' | 'search_content_nimbus'
type SearchHybridFunction = 'search_content_hybrid' | 'search_content_hybrid_nimbus'

export abstract class SearchResultModel {
  static async search(
    args: RootQueryTypeSearchDocsArgs,
    requestedFields: Array<string>
  ): Promise<Result<SearchResultModel[], ApiErrorGeneric>> {
    const query = args.query.trim()
    const includeFullContent = requestedFields.includes('content')
    const embeddingResult = await openAI().createContentEmbedding(query)

    const useAltSearchIndex = !isFeatureEnabled('search:fullIndex')
    const searchFunction: SearchFunction = useAltSearchIndex
      ? 'search_content_nimbus'
      : 'search_content'

    return embeddingResult.flatMapAsync(async ({ embedding }) => {
      const matchResult = new Result(
        await supabase().rpc(searchFunction, {
          embedding,
          include_full_content: includeFullContent,
          max_result: args.limit ?? undefined,
        })
      )
        .map((matches) =>
          matches
            .map(createModelFromMatch)
            .filter((item): item is SearchResultInterface => item !== null)
        )
        .mapError(convertPostgrestToApiError)

      return matchResult
    })
  }

  static async searchHybrid(
    args: RootQueryTypeSearchDocsArgs,
    requestedFields: Array<string>
  ): Promise<Result<SearchResultModel[], ApiErrorGeneric>> {
    const query = args.query.trim()
    const includeFullContent = requestedFields.includes('content')
    const embeddingResult = await openAI().createContentEmbedding(query)

    const useAltSearchIndex = !isFeatureEnabled('search:fullIndex')
    const searchFunction: SearchHybridFunction = useAltSearchIndex
      ? 'search_content_hybrid_nimbus'
      : 'search_content_hybrid'

    return embeddingResult.flatMapAsync(async ({ embedding }) => {
      const matchResult = new Result(
        await supabase().rpc(searchFunction, {
          query_text: query,
          query_embedding: embedding,
          include_full_content: includeFullContent,
          max_result: args.limit ?? 30,
        })
      )
        .map((matches) =>
          matches
            .map(createModelFromMatch)
            .filter((item): item is SearchResultInterface => item !== null)
        )
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
      if (language && SDKLanguageValues.includes(language)) {
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
        // TODO [Charis 2025-06-09] replace with less hacky check
      } else if (metadata.subtitle?.startsWith('Management API Reference')) {
        return new ReferenceManagementApiModel({
          title: page_title,
          href,
          content,
        })
      } else {
        return null
      }
    case 'troubleshooting':
      return new TroubleshootingModel({
        title: page_title,
        href,
        content,
      })
    default:
      return null
  }
}
