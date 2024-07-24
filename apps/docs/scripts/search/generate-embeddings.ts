import type { Tensor } from '@xenova/transformers'
import { pipeline } from '@xenova/transformers'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { parseArgs } from 'node:util'
import { OpenAI } from 'openai'
import { v4 as uuidv4 } from 'uuid'

import type { Json, Section } from '../helpers.mdx'
import { fetchSources } from './sources'

dotenv.config()

const args = parseArgs({
  options: {
    refresh: {
      type: 'boolean',
    },
  },
})

/**
 * Embeddings are historically generated with OpenAI. There is now an
 * additional local pipeline to test local embeddings.
 */
interface Extractor {
  extract: (input: string) => Promise<Tensor>
}
let extractor: Extractor
async function getExtractor() {
  if (!extractor) {
    const pipe = await pipeline('feature-extraction', 'Supabase/gte-small')

    const extract = (input: string) => {
      return pipe(input, { pooling: 'mean', normalize: true })
    }
    extractor = { extract }
  }

  return extractor
}

async function generateEmbeddings() {
  const shouldRefresh = Boolean(args.values.refresh)

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_MISC_USE_URL',
    'NEXT_PUBLIC_MISC_USE_ANON_KEY',
    'SEARCH_GITHUB_APP_ID',
    'SEARCH_GITHUB_APP_INSTALLATION_ID',
    'SEARCH_GITHUB_APP_PRIVATE_KEY',
  ]

  if (requiredEnvVars.some((name) => !process.env[name])) {
    throw new Error(
      `Environment variables ${requiredEnvVars.join(
        ', '
      )} are required: skipping embeddings generation`
    )
  }

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  // Use this version to track which pages to purge
  // after the refresh
  const refreshVersion = uuidv4()

  const refreshDate = new Date()

  const embeddingSources = await fetchSources()

  console.log(`Discovered ${embeddingSources.length} pages`)

  if (!shouldRefresh) {
    console.log('Checking which pages are new or have changed')
  } else {
    console.log('Refresh flag set, re-generating all pages')
  }

  for (const embeddingSource of embeddingSources) {
    const { type, source, path } = embeddingSource

    try {
      const {
        checksum,
        sections,
        meta = {},
        ragIgnore = false,
      }: {
        checksum: string
        sections: Section[]
        ragIgnore?: boolean
        meta?: Json
      } = embeddingSource.process()

      // Check for existing page in DB and compare checksums
      const { error: fetchPageError, data: existingPage } = await supabaseClient
        .from('page')
        .select('id, path, checksum')
        .filter('path', 'eq', path)
        .limit(1)
        .maybeSingle()

      if (fetchPageError) {
        throw fetchPageError
      }

      // We use checksum to determine if this page & its sections need to be regenerated
      if (!shouldRefresh && existingPage?.checksum === checksum) {
        // No content/embedding update required on this page
        // Update other meta info
        const { error: updatePageError } = await supabaseClient
          .from('page')
          .update({
            type,
            source,
            meta,
            version: refreshVersion,
            last_refresh: refreshDate,
          })
          .filter('id', 'eq', existingPage.id)

        if (updatePageError) {
          throw updatePageError
        }

        continue
      }

      if (existingPage) {
        if (!shouldRefresh) {
          console.log(
            `[${path}] Docs have changed, removing old page sections and their embeddings`
          )
        } else {
          console.log(`[${path}] Refresh flag set, removing old page sections and their embeddings`)
        }

        const { error: deletePageSectionError } = await supabaseClient
          .from('page_section')
          .delete()
          .filter('page_id', 'eq', existingPage.id)

        if (deletePageSectionError) {
          throw deletePageSectionError
        }
      }

      // Create/update page record. Intentionally clear checksum until we
      // have successfully generated all page sections.
      const { error: upsertPageError, data: page } = await supabaseClient
        .from('page')
        .upsert(
          {
            checksum: null,
            path,
            type,
            source,
            meta,
            content: embeddingSource.extractIndexedContent(),
            version: refreshVersion,
            last_refresh: refreshDate,
          },
          { onConflict: 'path' }
        )
        .select()
        .limit(1)
        .single()

      if (upsertPageError) {
        throw upsertPageError
      }

      console.log(`[${path}] Adding ${sections.length} page sections (with embeddings)`)
      for (const { slug, heading, content } of sections) {
        // OpenAI recommends replacing newlines with spaces for best results (specific to embeddings)
        // force a redeploy
        const input = content.replace(/\n/g, ' ')

        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

          const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input,
          })

          const [responseData] = embeddingResponse.data

          const extractor = await getExtractor()
          const featureArray = (await extractor.extract(input)).tolist()[0]

          const { error: insertPageSectionError } = await supabaseClient
            .from('page_section')
            .insert({
              page_id: page.id,
              slug,
              heading,
              content,
              token_count: embeddingResponse.usage.total_tokens,
              embedding: responseData.embedding,
              hf_embedding: featureArray,
              rag_ignore: ragIgnore,
            })
            .select()
            .limit(1)
            .single()

          if (insertPageSectionError) {
            throw insertPageSectionError
          }
        } catch (err) {
          // TODO: decide how to better handle failed embeddings
          console.error(
            `Failed to generate embeddings for '${path}' page section starting with '${input.slice(
              0,
              40
            )}...'`
          )

          throw err
        }
      }

      // Set page checksum so that we know this page was stored successfully
      const { error: updatePageError } = await supabaseClient
        .from('page')
        .update({ checksum })
        .filter('id', 'eq', page.id)

      if (updatePageError) {
        throw updatePageError
      }
    } catch (err) {
      console.error(
        `Page '${path}' or one/multiple of its page sections failed to store properly. Page has been marked with null checksum to indicate that it needs to be re-generated.`
      )
      console.error(err)
    }
  }

  console.log(`Removing old pages and their sections`)

  // Delete pages that have been removed (and their sections via cascade)
  const { error: deletePageError } = await supabaseClient
    .from('page')
    .delete()
    .filter('version', 'neq', refreshVersion)

  if (deletePageError) {
    throw deletePageError
  }

  console.log('Embedding generation complete')
}

async function main() {
  await generateEmbeddings()
}

main().catch((err) => {
  console.error(err)

  // Exit with non-zero code
  process.exit(1)
})
