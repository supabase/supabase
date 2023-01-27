import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join } from 'path'
import { readdir, readFile, stat } from 'fs/promises'
import { ObjectExpression } from 'estree'
import { Content, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown, MdxjsEsm } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxjs } from 'micromark-extension-mdxjs'
import { u } from 'unist-builder'
import { filter } from 'unist-util-filter'
import { createHash } from 'crypto'

dotenv.config()

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

/**
 * Processes MDX content for search indexing.
 * It extracts metadata, strips it of all JSX,
 * and splits it into sub-sections based on criteria.
 */
function processMdxForSearch(content: string) {
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
      meta,
      sections: [],
    }
  }

  const sectionTrees = splitTreeBy(mdTree, (node) => node.type === 'heading')

  const sections = sectionTrees.map((tree) => toMarkdown(tree))

  return {
    checksum,
    meta,
    sections,
  }
}

async function walk(dir: string): Promise<string[]> {
  const immediateFiles = await readdir(dir)

  const recursiveFiles = await Promise.all(
    immediateFiles.map(async (file) => {
      const filePath = join(dir, file)
      const stats = await stat(filePath)
      if (stats.isDirectory()) {
        return walk(filePath)
      } else if (stats.isFile()) {
        return [filePath]
      } else {
        return []
      }
    })
  )

  const flattenedFiles = recursiveFiles.reduce(
    (all, folderContents) => all.concat(folderContents),
    []
  )

  return flattenedFiles
}

async function generateEmbeddings() {
  if (!process.env.DOCS_SEARCH_SUPABASE_URL || !process.env.DOCS_SEARCH_SUPABASE_SERVICE_KEY) {
    return console.log(
      'Environment variables DOCS_SEARCH_SUPABASE_URL and DOCS_SEARCH_SUPABASE_SERVICE_KEY are required: skipping saving of document embeddings'
    )
  }

  const supabaseClient = createClient(
    process.env.DOCS_SEARCH_SUPABASE_URL,
    process.env.DOCS_SEARCH_SUPABASE_SERVICE_KEY
  )

  const markdownFiles = (await walk('pages')).filter((fileName) => /\.mdx?$/.test(fileName))

  // TODO: purge old data from DB
  for (const markdownFile of markdownFiles) {
    const path = markdownFile.replace(/^pages/, '').replace(/\.mdx?$/, '')

    const contents = await readFile(markdownFile, 'utf8')

    const { checksum, meta, sections } = processMdxForSearch(contents)

    const { error: fetchPageError, data: existingPage } = await supabaseClient
      .from('page')
      .select()
      .filter('path', 'eq', path)
      .limit(1)
      .maybeSingle()

    if (fetchPageError) {
      throw fetchPageError
    }

    if (existingPage?.checksum === checksum) {
      continue
    }

    console.log({ checksum, path, meta })

    if (existingPage) {
      console.log(`Docs have changed for '${path}', removing old page sections/embeddings`)

      const { error: deletePageSectionError } = await supabaseClient
        .from('page_section')
        .delete()
        .filter('page_id', 'eq', existingPage.id)

      if (deletePageSectionError) {
        throw deletePageSectionError
      }
    }

    const { error: upsertPageError, data: page } = await supabaseClient
      .from('page')
      .upsert({ path, checksum }, { onConflict: 'path' })
      .select()
      .limit(1)
      .single()

    if (upsertPageError) {
      throw upsertPageError
    }

    console.log(`Adding page sections/embeddings for '${path}'`)
    for (const section of sections) {
      const { error, data: pageSection } = await supabaseClient
        .from('page_section')
        .insert({ page_id: page.id, content: section })
        .select()
        .limit(1)
        .single()

      if (error) {
        throw error
      }
    }
  }
}

async function main() {
  await generateEmbeddings()
}

main().catch((err) => console.error(err))
