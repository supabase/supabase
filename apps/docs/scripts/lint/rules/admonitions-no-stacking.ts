import { MdxJsxFlowElement } from 'mdast-util-mdx'
import { NODE_TYPE_FOR_RULE } from '../utils/symbols'

function admonitionsNoStacking(content: MdxJsxFlowElement) {
  if (content.name !== 'Admonition') {
    return
  }

  console.log(JSON.stringify(content, null, 2))
}

admonitionsNoStacking[NODE_TYPE_FOR_RULE] = 'mdxJsxFlowElement'

export { admonitionsNoStacking }
