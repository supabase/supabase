import fs from 'fs'
import path from 'path'
import { UnistNode, UnistTree } from 'types/unist'
import { u } from 'unist-builder'
import { visit } from 'unist-util-visit'

import { Index } from '../__registry__'
import { styles } from '../registry/styles'

// import { parse } from 'react-docgen'

// import * as reactDocgenTypescript from 'react-docgen-typescript'

// import { Column, IColumnProps } from './sample-component'
import React from 'react' // ComponentType

function inspectComponentProps<T>(component: React.ComponentType<T>): void {
  // Assert the component's props type
  const defaultProps = (component as React.ComponentType<any>).defaultProps || {}

  // console.log('Component props:')
  // console.log('----------------')

  for (const propName in defaultProps) {
    const propType = typeof defaultProps[propName]
    console.log(`${propName}: ${propType}`)
  }
}

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

      // console.log(srcPath, componentName)

      // inspectComponentProps(Column)

      // console.log('NEW NODE: ', node.name)

      // if (node.name === 'ComponentProps') {
      //   // Parse a file for docgen info
      //   const options = {
      //     // savePropValueAsString: true,
      //   }

      //   // const parser = reactDocgenTypescript.parse('./sample-component.tsx', options)

      //   // console.log('PARSER', parser)

      //   const code = `
      //   /** My first component */
      //   export default ({ name, title }: {
      //     /** My first component */
      //     name: string,
      //     /** My first component */
      //     title: string
      //   }) => <div>{{name}}</div>;
      //   `
      //   // console.log('node', node)

      //   const documentation = parse(code)[0]

      //   // console.log('documentation', documentation)

      //   // Add attributes to object

      //   node.attributes?.push({
      //     type: 'mdxJsxAttribute',
      //     name: 'docs',
      //     value: JSON.stringify(documentation),
      //   })

      //   // console.log('node after', node)

      //   // Add random text as children
      //   // node.children?.push({
      //   //   type: 'text',
      //   //   value: 'I am random text', // Generate a random UUID as text content
      //   // })

      //   // node.data = {
      //   //   ...node.data,
      //   //   name: 'documentation',
      //   //   type: 'mdxJsxAttribute',
      //   //   value: documentation,
      //   // }
      // }

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

      // if (node.name === "ComponentExample") {
      //   const source = getComponentSourceFileContent(node)
      //   if (!source) {
      //     return
      //   }

      //   // Replace the Example component with a pre element.
      //   node.children?.push(
      //     u("element", {
      //       tagName: "pre",
      //       properties: {
      //         __src__: src,
      //       },
      //       children: [
      //         u("element", {
      //           tagName: "code",
      //           properties: {
      //             className: ["language-tsx"],
      //           },
      //           children: [
      //             {
      //               type: "text",
      //               value: source,
      //             },
      //           ],
      //         }),
      //       ],
      //     })
      //   )

      //   const extractClassname = getNodeAttributeByName(
      //     node,
      //     "extractClassname"
      //   )
      //   if (
      //     extractClassname &&
      //     typeof extractClassname.value !== "undefined" &&
      //     extractClassname.value !== "false"
      //   ) {
      //     // Extract className from string
      //     // TODO: Use @swc/core and a visitor to extract this.
      //     // For now, a simple regex should do.
      //     const values = source.match(/className="(.*)"/)
      //     const className = values ? values[1] : ""

      //     // Add the className as a jsx prop so we can pass it to the copy button.
      //     node.attributes?.push({
      //       name: "extractedClassNames",
      //       type: "mdxJsxAttribute",
      //       value: className,
      //     })

      //     // Add a pre element with the className only.
      //     node.children?.push(
      //       u("element", {
      //         tagName: "pre",
      //         properties: {},
      //         children: [
      //           u("element", {
      //             tagName: "code",
      //             properties: {
      //               className: ["language-tsx"],
      //             },
      //             children: [
      //               {
      //                 type: "text",
      //                 value: className,
      //               },
      //             ],
      //           }),
      //         ],
      //       })
      //     )
      //   }
      // }

      // if (node.name === "ComponentSource") {
      //   const source = getComponentSourceFileContent(node)
      //   if (!source) {
      //     return
      //   }

      //   // Replace the Source component with a pre element.
      //   node.children?.push(
      //     u("element", {
      //       tagName: "pre",
      //       properties: {
      //         __src__: src,
      //       },
      //       children: [
      //         u("element", {
      //           tagName: "code",
      //           properties: {
      //             className: ["language-tsx"],
      //           },
      //           children: [
      //             {
      //               type: "text",
      //               value: source,
      //             },
      //           ],
      //         }),
      //       ],
      //     })
      //   )
      // }
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
