import { MdxJsxFlowElement } from 'mdast-util-mdx'

function admonitionsNoStacking(content: MdxJsxFlowElement) {
  if (content.name !== 'Admonition') {
    return
  }

  console.log(JSON.stringify(content, null, 2))
}

export { admonitionsNoStacking }
