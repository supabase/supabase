import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import type {
  MdxJsxAttribute,
  MdxJsxAttributeValueExpression,
  MdxJsxExpressionAttribute,
  MdxJsxFlowElement,
  MdxJsxFlowElementHast,
  MdxJsxTextElement,
  MdxJsxTextElementHast,
} from 'mdast-util-mdx-jsx'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'

export function getAttributeValue(
  node: MdxJsxFlowElement | MdxJsxFlowElementHast | MdxJsxTextElement | MdxJsxTextElementHast,
  attributeName: string
) {
  return (
    node.attributes.find(
      (attr: MdxJsxAttribute | MdxJsxExpressionAttribute) =>
        'name' in attr && attr.name === attributeName
    )?.value ?? undefined
  )
}

export function getAttributeValueExpression(
  node: MdxJsxAttributeValueExpression | string | undefined
) {
  if (typeof node === 'string' || node?.type !== 'mdxJsxAttributeValueExpression') return undefined
  return node.value
}

export function fromDocsMarkdown(markdown: string) {
  return fromMarkdown(markdown, {
    mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()],
    extensions: [mdxjs(), gfm()],
  })
}
