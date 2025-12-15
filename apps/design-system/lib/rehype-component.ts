import fs from 'fs'
import path from 'path'
import { UnistNode, UnistTree } from 'types/unist'
import { u } from 'unist-builder'
import { visit } from 'unist-util-visit'

import { Index } from '../__registry__'
import { styles } from '../registry/styles'

// import { Column, IColumnProps } from './sample-component'

export function rehypeComponent() {
  return async (tree: UnistTree) => {
    visit(tree, (node: UnistNode) => {
      // src prop overrides both name and fileName.
      const { value: srcPath, name: componentName } =
        (getNodeAttributeByName(node, 'src') as {
          name: string
          value?: string
          type?: string
        }) || {}

      if (node.name === 'ComponentSource') {
        // console.log('DO NOT USE THIS COMPONENT')
        // This component should not be in use!
        // console.log('node', node)

        const name = getNodeAttributeByName(node, 'name')?.value as string
        const fileName = getNodeAttributeByName(node, 'fileName')?.value as string | undefined

        if (!name && !srcPath) {
          return null
        }

        try {
          for (const style of styles) {
            let src: string

            if (srcPath) {
              src = srcPath
            } else {
              const component = Index[style.name][name]
              // console.log('got to ELSE STATEMENT')
              // console.log('filename', fileName)
              // console.log('name', name)

              src = fileName
                ? component.files.find((file: string) => {
                    return file.endsWith(`${fileName}.tsx`) || file.endsWith(`${fileName}.ts`)
                  }) || component.files[0]
                : component.files[0]
              // console.log('got to END of ELSE STATEMENT')
            }

            // Read the source file.
            const filePath = path.join(process.cwd(), src)
            let source = fs.readFileSync(filePath, 'utf8')

            // Replace imports.
            // TODO: Use @swc/core and a visitor to replace this.
            // For now a simple regex should do.
            // source = source.replaceAll(`@/registry/${style.name}/`, '@/components/') // COMMENT THEE OUT
            // source = source.replaceAll('export default', 'export')

            // Add code as children so that rehype can take over at build time.
            node.children?.push(
              u('element', {
                tagName: 'pre',
                properties: {
                  __src__: src,
                  __style__: style.name,
                },
                attributes: [
                  {
                    name: 'styleName',
                    type: 'mdxJsxAttribute',
                    value: style.name,
                  },
                ],
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

      if (node.name === 'ComponentPreview') {
        const name = getNodeAttributeByName(node, 'name')?.value as string

        if (!name) {
          return null
        }

        try {
          for (const style of styles) {
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

      if (node.name === 'CodeFragment') {
        const name = getNodeAttributeByName(node, 'name')?.value as string

        if (!name) {
          return null
        }

        try {
          for (const style of styles) {
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

function getComponentSourceFileContent(node: UnistNode) {
  const src = getNodeAttributeByName(node, 'src')?.value as string

  if (!src) {
    return null
  }

  // Read the source file.
  const filePath = path.join(process.cwd(), src)
  console.log('filePath', filePath)
  const source = fs.readFileSync(filePath, 'utf8')

  return source
}
