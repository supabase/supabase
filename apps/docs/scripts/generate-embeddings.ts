import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import dotenv from 'dotenv'
import { ObjectExpression } from 'estree'
import { readdir, readFile, stat } from 'fs/promises'
import GithubSlugger from 'github-slugger'
import yaml from 'js-yaml'
import { Content, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown, MdxjsEsm } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { toString } from 'mdast-util-to-string'
import { mdxjs } from 'micromark-extension-mdxjs'
import 'openai'
import { Configuration, OpenAIApi } from 'openai'
import { OpenAPIV3 } from 'openapi-types'
import { basename, dirname, join } from 'path'
import { u } from 'unist-builder'
import { filter } from 'unist-util-filter'
import { inspect } from 'util'
import { ICommonFunc, IFunctionDefinition, ISpec } from '../components/reference/Reference.types'
import { CliCommand, CliSpec } from '../generator/types/CliSpec'
import { flattenSections } from '../lib/helpers'
import { enrichedOperation, gen_v3 } from '../lib/refGenerator/helpers'

dotenv.config()

const ignoredFiles = ['pages/404.mdx']

/**
 * Extracts ES literals from an `estree` `ObjectExpression`
 * into a plain JavaScript object.
 */
function getObjectFromExpression(node: ObjectExpression) {
  return node.properties.reduce<
    Record<string, string | number | bigint | true | RegExp | undefined>
  >((object, property) => {
    if (property.type !== 'Property') {
      return object
    }

    const key = (property.key.type === 'Identifier' && property.key.name) || undefined
    const value = (property.value.type === 'Literal' && property.value.value) || undefined

    if (!key) {
      return object
    }

    return {
      ...object,
      [key]: value,
    }
  }, {})
}

/**
 * Extracts the `meta` ESM export from the MDX file.
 *
 * This info is akin to frontmatter.
 */
function extractMetaExport(mdxTree: Root) {
  const metaExportNode = mdxTree.children.find((node): node is MdxjsEsm => {
    return (
      node.type === 'mdxjsEsm' &&
      node.data?.estree?.body[0]?.type === 'ExportNamedDeclaration' &&
      node.data.estree.body[0].declaration?.type === 'VariableDeclaration' &&
      node.data.estree.body[0].declaration.declarations[0]?.id.type === 'Identifier' &&
      node.data.estree.body[0].declaration.declarations[0].id.name === 'meta'
    )
  })

  if (!metaExportNode) {
    return undefined
  }

  const objectExpression =
    (metaExportNode.data?.estree?.body[0]?.type === 'ExportNamedDeclaration' &&
      metaExportNode.data.estree.body[0].declaration?.type === 'VariableDeclaration' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0]?.id.type === 'Identifier' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].id.name === 'meta' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].init?.type ===
        'ObjectExpression' &&
      metaExportNode.data.estree.body[0].declaration.declarations[0].init) ||
    undefined

  if (!objectExpression) {
    return undefined
  }

  return getObjectFromExpression(objectExpression)
}

/**
 * Splits a `mdast` tree into multiple trees based on
 * a predicate function. Will include the splitting node
 * at the beginning of each tree.
 *
 * Useful to split a markdown file into smaller sections.
 */
function splitTreeBy(tree: Root, predicate: (node: Content) => boolean) {
  return tree.children.reduce<Root[]>((trees, node) => {
    const [lastTree] = trees.slice(-1)

    if (!lastTree || predicate(node)) {
      const tree: Root = u('root', [node])
      return trees.concat(tree)
    }

    lastTree.children.push(node)
    return trees
  }, [])
}

type Meta = ReturnType<typeof extractMetaExport>

type Section = {
  content: string
  heading?: string
  slug?: string
}

type ProcessedMdx = {
  checksum: string
  meta: Meta
  sections: Section[]
}

/**
 * Processes MDX content for search indexing.
 * It extracts metadata, strips it of all JSX,
 * and splits it into sub-sections based on criteria.
 */
function processMdxForSearch(content: string): ProcessedMdx {
  const checksum = createHash('sha256').update(content).digest('base64')

  const mdxTree = fromMarkdown(content, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  })

  const meta = extractMetaExport(mdxTree)

  // Remove all MDX elements from markdown
  const mdTree = filter(
    mdxTree,
    (node) =>
      ![
        'mdxjsEsm',
        'mdxJsxFlowElement',
        'mdxJsxTextElement',
        'mdxFlowExpression',
        'mdxTextExpression',
      ].includes(node.type)
  )

  if (!mdTree) {
    return {
      checksum,
      meta,
      sections: [],
    }
  }

  const sectionTrees = splitTreeBy(mdTree, (node) => node.type === 'heading')

  const slugger = new GithubSlugger()

  const sections = sectionTrees.map((tree) => {
    const [firstNode] = tree.children

    const heading = firstNode.type === 'heading' ? toString(firstNode) : undefined
    const slug = heading ? slugger.slug(heading) : undefined

    return {
      content: toMarkdown(tree),
      heading,
      slug,
    }
  })

  return {
    checksum,
    meta,
    sections,
  }
}

type WalkEntry = {
  path: string
  parentPath?: string
}

async function walk(dir: string, parentPath?: string): Promise<WalkEntry[]> {
  const immediateFiles = await readdir(dir)

  const recursiveFiles = await Promise.all(
    immediateFiles.map(async (file) => {
      const path = join(dir, file)
      const stats = await stat(path)
      if (stats.isDirectory()) {
        // Keep track of document hierarchy (if this dir has corresponding doc file)
        const docPath = `${basename(path)}.mdx`

        return walk(
          path,
          immediateFiles.includes(docPath) ? join(dirname(path), docPath) : parentPath
        )
      } else if (stats.isFile()) {
        return [
          {
            path: path,
            parentPath,
          },
        ]
      } else {
        return []
      }
    })
  )

  const flattenedFiles = recursiveFiles.reduce(
    (all, folderContents) => all.concat(folderContents),
    []
  )

  return flattenedFiles.sort((a, b) => a.path.localeCompare(b.path))
}

abstract class BaseEmbeddingSource {
  checksum?: string
  meta?: Meta
  sections?: Section[]

  constructor(public source: string, public path: string, public parentPath?: string) {}

  abstract load(): Promise<{ checksum: string; meta?: Meta; sections: Section[] }>
}

class MarkdownEmbeddingSource extends BaseEmbeddingSource {
  type: 'markdown' = 'markdown'

  constructor(source: string, public filePath: string, public parentFilePath?: string) {
    const path = filePath.replace(/^pages/, '').replace(/\.mdx?$/, '')
    const parentPath = parentFilePath?.replace(/^pages/, '').replace(/\.mdx?$/, '')

    super(source, path, parentPath)
  }

  async load() {
    const contents = await readFile(this.filePath, 'utf8')

    const { checksum, meta, sections } = processMdxForSearch(contents)

    this.checksum = checksum
    this.meta = meta
    this.sections = sections

    return {
      checksum,
      meta,
      sections,
    }
  }
}

abstract class ReferenceEmbeddingSource<SpecSection> extends BaseEmbeddingSource {
  type: 'reference' = 'reference'

  constructor(
    source: string,
    path: string,
    public meta: Meta,
    public specFilePath: string,
    public sectionsFilePath: string
  ) {
    super(source, path)
  }

  async load() {
    const specContents = await readFile(this.specFilePath, 'utf8')
    const refSectionsContents = await readFile(this.sectionsFilePath, 'utf8')

    const refSections: ICommonFunc[] = JSON.parse(refSectionsContents)
    const flattenedRefSections = flattenSections(refSections)

    const checksum = createHash('sha256')
      .update(specContents + refSectionsContents)
      .digest('base64')

    const specSections = this.getSpecSections(specContents)

    const sections = flattenedRefSections
      .map((refSection) => {
        const specSection = this.matchSpecSection(specSections, refSection.id)

        if (!specSection) {
          return
        }

        return {
          heading: refSection.title,
          slug: refSection.slug,
          content: `${this.meta.title} for ${refSection.title}:\n${this.formatSection(
            specSection,
            refSection
          )}`,
        }
      })
      .filter((section) => !!section)

    this.checksum = checksum
    this.sections = sections

    return {
      checksum,
      sections,
      meta: this.meta,
    }
  }

  abstract getSpecSections(specContents: string): SpecSection[]
  abstract matchSpecSection(specSections: SpecSection[], id: string): SpecSection
  abstract formatSection(specSection: SpecSection, refSection: ICommonFunc): string
}

class OpenApiEmbeddingSource extends ReferenceEmbeddingSource<enrichedOperation> {
  getSpecSections(specContents: string): enrichedOperation[] {
    const spec: OpenAPIV3.Document<{}> = JSON.parse(specContents)

    const generatedSpec = gen_v3(spec, '', {
      apiUrl: 'apiv0',
    })

    return generatedSpec.operations
  }
  matchSpecSection(operations: enrichedOperation[], id: string): enrichedOperation {
    return operations.find((operation) => operation.operationId === id)
  }
  formatSection(specOperation: enrichedOperation) {
    const { summary, description, operation, path, tags } = specOperation
    return JSON.stringify({
      summary,
      description,
      operation,
      path,
      tags,
    })
  }
}

class ClientLibEmbeddingSource extends ReferenceEmbeddingSource<IFunctionDefinition> {
  getSpecSections(specContents: string): IFunctionDefinition[] {
    const spec = yaml.load(specContents) as ISpec

    return spec.functions
  }
  matchSpecSection(functionDefinitions: IFunctionDefinition[], id: string): IFunctionDefinition {
    return functionDefinitions.find((functionDefinition) => functionDefinition.id === id)
  }
  formatSection(functionDefinition: IFunctionDefinition, refSection: ICommonFunc): string {
    const { title } = refSection
    const { description, title: functionName } = functionDefinition

    return JSON.stringify({
      title,
      description,
      functionName,
    })
  }
}

class CliEmbeddingSource extends ReferenceEmbeddingSource<CliCommand> {
  getSpecSections(specContents: string): CliCommand[] {
    const spec = yaml.load(specContents) as CliSpec

    return spec.commands
  }
  matchSpecSection(cliCommands: CliCommand[], id: string): CliCommand {
    return cliCommands.find((cliCommand) => cliCommand.id === id)
  }
  formatSection(cliCommand: CliCommand): string {
    const { summary, description, usage } = cliCommand
    return JSON.stringify({
      summary,
      description,
      usage,
    })
  }
}

type EmbeddingSource =
  | MarkdownEmbeddingSource
  | OpenApiEmbeddingSource
  | ClientLibEmbeddingSource
  | CliEmbeddingSource

async function generateEmbeddings() {
  // TODO: use better CLI lib like yargs
  const args = process.argv.slice(2)
  const shouldRefresh = args.includes('--refresh')

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.OPENAI_KEY
  ) {
    return console.log(
      'Environment variables NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OPENAI_KEY are required: skipping embeddings generation'
    )
  }

  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )

  const embeddingSources: EmbeddingSource[] = [
    new OpenApiEmbeddingSource(
      'api',
      '/reference/api',
      { title: 'Management API Reference' },
      '../../spec/transforms/api_v0_openapi_deparsed.json',
      '../../spec/common-api-sections.json'
    ),
    new ClientLibEmbeddingSource(
      'js-lib',
      '/reference/javascript',
      { title: 'JavaScript Reference' },
      '../../spec/supabase_js_v2.yml',
      '../../spec/common-client-libs-sections.json'
    ),
    new ClientLibEmbeddingSource(
      'dart-lib',
      '/reference/dart',
      { title: 'Dart Reference' },
      '../../spec/supabase_dart_v1.yml',
      '../../spec/common-client-libs-sections.json'
    ),
    new ClientLibEmbeddingSource(
      'python-lib',
      '/reference/python',
      { title: 'Python Reference' },
      '../../spec/supabase_py_v2.yml',
      '../../spec/common-client-libs-sections.json'
    ),
    new ClientLibEmbeddingSource(
      'csharp-lib',
      '/reference/csharp',
      { title: 'C# Reference' },
      '../../spec/supabase_csharp_v0.yml',
      '../../spec/common-client-libs-sections.json'
    ),
    new CliEmbeddingSource(
      'cli',
      '/reference/cli',
      { title: 'CLI Reference' },
      '../../spec/cli_v1_commands.yaml',
      '../../spec/common-cli-sections.json'
    ),
    ...(await walk('pages'))
      .filter(({ path }) => /\.mdx?$/.test(path))
      .filter(({ path }) => !ignoredFiles.includes(path))
      .map((entry) => new MarkdownEmbeddingSource('guide', entry.path)),
  ]

  console.log(`Discovered ${embeddingSources.length} pages`)

  if (!shouldRefresh) {
    console.log('Checking which pages are new or have changed')
  } else {
    console.log('Refresh flag set, re-generating all pages')
  }

  for (const embeddingSource of embeddingSources) {
    const { type, source, path, parentPath } = embeddingSource

    try {
      const { checksum, meta, sections } = await embeddingSource.load()

      // Check for existing page in DB and compare checksums
      const { error: fetchPageError, data: existingPage } = await supabaseClient
        .from('page')
        .select('id, path, checksum, parentPage:parent_page_id(id, path)')
        .filter('path', 'eq', path)
        .limit(1)
        .maybeSingle()

      if (fetchPageError) {
        throw fetchPageError
      }

      type Singular<T> = T extends any[] ? undefined : T

      // We use checksum to determine if this page & its sections need to be regenerated
      if (!shouldRefresh && existingPage?.checksum === checksum) {
        const existingParentPage = existingPage?.parentPage as Singular<
          typeof existingPage.parentPage
        >

        // If parent page changed, update it
        if (existingParentPage?.path !== parentPath) {
          console.log(`[${path}] Parent page has changed. Updating to '${parentPath}'...`)
          const { error: fetchParentPageError, data: parentPage } = await supabaseClient
            .from('page')
            .select()
            .filter('path', 'eq', parentPath)
            .limit(1)
            .maybeSingle()

          if (fetchParentPageError) {
            throw fetchParentPageError
          }

          const { error: updatePageError } = await supabaseClient
            .from('page')
            .update({ parent_page_id: parentPage?.id })
            .filter('id', 'eq', existingPage.id)

          if (updatePageError) {
            throw updatePageError
          }
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

      const { error: fetchParentPageError, data: parentPage } = await supabaseClient
        .from('page')
        .select()
        .filter('path', 'eq', parentPath)
        .limit(1)
        .maybeSingle()

      if (fetchParentPageError) {
        throw fetchParentPageError
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
            parent_page_id: parentPage?.id,
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
        const input = content.replace(/\n/g, ' ')

        try {
          const configuration = new Configuration({ apiKey: process.env.OPENAI_KEY })
          const openai = new OpenAIApi(configuration)

          const embeddingResponse = await openai.createEmbedding({
            model: 'text-embedding-ada-002',
            input,
          })

          if (embeddingResponse.status !== 200) {
            throw new Error(inspect(embeddingResponse.data, false, 2))
          }

          const [responseData] = embeddingResponse.data.data

          const { error: insertPageSectionError, data: pageSection } = await supabaseClient
            .from('page_section')
            .insert({
              page_id: page.id,
              slug,
              heading,
              content,
              token_count: embeddingResponse.data.usage.total_tokens,
              embedding: responseData.embedding,
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

  console.log('Embedding generation complete')
}

async function main() {
  await generateEmbeddings()
}

main().catch((err) => console.error(err))
