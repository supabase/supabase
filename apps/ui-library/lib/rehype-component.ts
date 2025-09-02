import fs from 'fs'
import path from 'path'
import { u } from 'unist-builder'
import { visit } from 'unist-util-visit'

import { UnistNode, UnistTree } from 'types/unist'
import { Index } from '../__registry__'
import { styles } from '../registry/styles'

export function rehypeComponent() {
  return async (tree: UnistTree) => {
    visit(tree, (node: UnistNode) => {
      if (node.name === 'ComponentPreview') {
        try {
          for (const style of styles) {
            const name = getNodeAttributeByName(node, 'name')
              ?.value as keyof (typeof Index)[typeof style.name]

            if (!name) {
              return null
            }

            const component = Index[style.name][name]
            // console.log('GOT HERE')
            const src = component.files[0]

            // Read the source file.
            const filePath = path.join(process.cwd(), src)
            let source = fs.readFileSync(filePath, 'utf8')

            // Replace imports.
            // TODO: Use @swc/core and a visitor to replace this.
            // For now a simple regex should do.
            source = source.replaceAll(`@/registry/${style.name}/`, '@/components/')
            source = source.replaceAll('export default', 'export')

            // Add code as children so that rehype can take over at build time.
            node.children?.push(
              u('element', {
                tagName: 'pre',
                properties: {
                  __src__: src,
                },
                children: [
                  u('element', {
                    tagName: 'code',
                    properties: {
                      className: ['language-tsx'],
                    },
                    children: [
                      {
                        type: 'text',
                        value: source,
                      },
                    ],
                  }),
                ],
              })
            )
          }
        } catch (error) {
          console.error(error)
        }
      }
    })
  }
}

function getNodeAttributeByName(node: UnistNode, name: string) {
  return node.attributes?.find((attribute) => attribute.name === name)
}
