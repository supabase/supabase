import { Content } from 'mdast-util-to-markdown/lib/types'
import { Node } from 'unist'

const mdastContentTypes = [
  'blockquote',
  'break',
  'code',
  'definition',
  'delete',
  'emphasis',
  'footnote',
  'footnoteDefinition',
  'footnoteReference',
  'heading',
  'html',
  'image',
  'imageReference',
  'inlineCode',
  'link',
  'linkReference',
  'list',
  'listItem',
  'mdxjsEsm',
  'mdxJsxFlowElement',
  'mdxJsxTextElement',
  'mdxFlowExpression',
  'mdxTextExpression',
  'paragraph',
  'strong',
  'table',
  'tableCell',
  'tableRow',
  'text',
  'thematicBreak',
  'yaml',
] satisfies Content['type'][]

export function testIsContent(node: Node): node is Content {
  return mdastContentTypes.includes(node.type as Content['type'])
}
