import { toHtml } from 'hast-util-to-html'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { toHast } from 'mdast-util-to-hast'
import { mdxjs } from 'micromark-extension-mdxjs'
import { notFound } from 'next/navigation'
import { visit } from 'unist-util-visit'

import { REFERENCES } from '~/content/navigation.references'
import {
  getFlattenedSections,
  getFunctionsList,
  getTypeSpec,
} from '~/features/docs/Reference.generated.singleton'
import { getRefMarkdown } from '~/features/docs/Reference.mdx'
import type { MethodTypes, VariableTypes } from '~/features/docs/Reference.typeSpec'
import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { BASE_PATH } from '~/lib/constants'

export async function GET(request: Request) {
  const url = new URL(request.url)
  let [, , lib, maybeVersion, slug] = url.pathname.split('/')

  const libraryMeta = REFERENCES[lib]

  const isVersion = /^v\d+$/.test(maybeVersion)
  const version = isVersion ? maybeVersion : libraryMeta.versions[0]
  if (!isVersion) {
    slug = maybeVersion
  }

  let section: AbbrevApiReferenceSection | undefined
  let sectionsWithUrl: Array<AbbrevApiReferenceSection & { url: URL }> = []
  try {
    const flattenedSections = (await getFlattenedSections(lib, version)) ?? []
    sectionsWithUrl = flattenedSections.map((section) => {
      const url = new URL(request.url)
      url.pathname = [BASE_PATH, 'reference', lib, isVersion ? version : null, section.slug]
        .filter(Boolean)
        .join('/')

      return {
        ...section,
        url,
      }
    })
    section = flattenedSections.find(
      (section) =>
        (section.type === 'markdown' || section.type === 'function') && section.slug === slug
    )
  } catch {}

  if (!section) {
    notFound()
  }

  const html = htmlShell(
    lib,
    isVersion ? version : null,
    slug,
    section,
    libraryNav(sectionsWithUrl) + (await sectionDetails(lib, isVersion ? version : null, section))
  )
  const response = new Response(html)
  response.headers.set('Content-Type', 'text/html; charset=utf-8')

  return response
}

function htmlShell(
  lib: string,
  version: string | null,
  slug: string,
  section: AbbrevApiReferenceSection,
  body: string
) {
  const libraryName = REFERENCES[lib].name
  let title = libraryName + ': ' + (section.title ?? '')

  return (
    '<!doctype html><html>' +
    '<head>' +
    `<title>${title} | Supabase Docs</title>` +
    `<meta name="description" content="Supabase API reference for ${libraryName}${section.title ? ': ' + section.title : ''}">` +
    `<meta name="og:image" content="https://supabase.com/docs/img/supabase-og-image.png">` +
    `<meta name="twitter:image" content="https://supabase.com/docs/img/supabase-og-image.png">` +
    `<link rel="canonical" href="https://supabase.com/docs/reference/${lib}` +
    (slug ? '/' + slug : '') +
    `">` +
    '</head>' +
    '<body>' +
    body +
    '</body></html>'
  )
}

function libraryNav(sections: Array<AbbrevApiReferenceSection & { url: URL }>) {
  return (
    '<nav><ul>' +
    sections
      .map((section) => `<li><a href="${section.url}">${section.title ?? ''}</a></li>`)
      .join('') +
    '</ul></nav>'
  )
}

async function sectionDetails(lib: string, version: string, section: AbbrevApiReferenceSection) {
  const libraryName = REFERENCES[lib].name
  let result = '<h1>' + (libraryName + ': ' + (section.title ?? '')) + '</h1>'

  if (section.type === 'markdown') {
    result += await markdown(lib, version, section)
  } else {
    result += await functionDetails(lib, version, section)
  }

  return result
}

async function markdown(lib: string, version: string | null, section: AbbrevApiReferenceSection) {
  const dir = !!section.meta?.shared ? 'shared' : lib + (version ? '/' + version : '')

  let content = await getRefMarkdown(dir + '/' + section.slug)
  content = mdxToHtml(content)
  return content
}

async function functionDetails(
  lib: string,
  version: string | null,
  section: AbbrevApiReferenceSection
) {
  const libraryMeta = REFERENCES[lib]

  const fns = await getFunctionsList(lib, version ?? libraryMeta.versions[0])
  const fn = fns!.find((fn) => fn.id === section.id)
  if (!fn) return ''

  let types: MethodTypes | VariableTypes | undefined
  if (libraryMeta.typeSpec && '$ref' in fn) {
    types = await getTypeSpec(fn['$ref'] as string)
  }

  const fullDescription = [
    types?.comment?.shortText,
    'description' in fn && (fn.description as string),
    'notes' in fn && (fn.notes as string),
  ]
    .filter((x) => typeof x === 'string')
    .map(mdxToHtml)
    .join('')

  const parameters = parametersToHtml(fn, types)
  const examples = examplesToHtml(fn)

  return fullDescription + parameters + examples
}

function mdxToHtml(markdown: string): string {
  const mdast = fromMarkdown(markdown, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  })

  visit(mdast, 'text', (node) => {
    node.value = node.value.replace(/\n/g, ' ')
  })
  if (!mdast) return ''

  const hast = toHast(mdast)
  if (!hast) return ''

  // @ts-ignore
  const html = toHtml(hast)

  return html
}

function parametersToHtml(fn: any, types: MethodTypes | VariableTypes | undefined) {
  let result = '<h2 id="parameters">Parameters</h2>'

  if ('overwriteParams' in fn || 'params' in fn) {
    const params = fn.overwriteParams ?? fn.params
    if (params.length === 0) return ''

    result +=
      '<ul>' +
      params
        .map(
          (param) =>
            '<li>' +
            `<h3>${param.name}</h3>` +
            `<span>${param.isOptional ? '(Optional)' : '(Required)'}</span>` +
            `<p>${param.description}</p>` +
            '</li>'
        )
        .join('') +
      '</ul>'

    return result
  }

  if (!types || !('params' in types) || !types.params || types.params.length === 0) return ''

  result +=
    '<ul>' +
    types.params
      .map(
        (param) =>
          '<li>' +
          `<h3>${String(param.name)}</h3>` +
          `<span>${param.isOptional ? '(Optional)' : '(Required)'}</span>` +
          `<p>${param.comment?.shortText ?? ''}</p>` +
          '</li>'
      )
      .join('') +
    '</ul>'

  return result
}

function examplesToHtml(fn: any) {
  if (!fn.examples || fn.examples.length === 0) return ''

  let result = '<h2 id="examples">Examples</h2>'

  result += fn.examples
    .map((example) => `<h3>${example.name ?? ''}</h3>` + mdxToHtml(example.code ?? ''))
    .join('')

  return result
}
