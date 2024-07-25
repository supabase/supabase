import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

// @ts-ignore
function nodeEqualsType({ types, node }) {
  return (Array.isArray(types) && types.includes(node.type)) || node.type === types
}

/**
 * Extension based on:
 * - https://github.com/ueberdosis/tiptap/blob/v1/packages/tiptap-extensions/src/extensions/TrailingNode.js
 * - https://github.com/remirror/remirror/blob/e0f1bec4a1e8073ce8f5500d62193e52321155b9/packages/prosemirror-trailing-node/src/trailing-node-plugin.ts
 */

export interface TrailingNodeOptions {
  node: string
  notAfter: string[]
}

export const TrailingNode = Extension.create<TrailingNodeOptions>({
  name: 'trailingNode',

  addOptions() {
    return {
      node: 'paragraph',
      notAfter: ['paragraph'],
    }
  },

  addProseMirrorPlugins() {
    const plugin = new PluginKey(this.name)
    const disabledNodes = Object.entries(this.editor.schema.nodes)
      .map(([, value]) => value)
      .filter((node) => this.options.notAfter.includes(node.name))

    return [
      new Plugin({
        key: plugin,
        appendTransaction: (_, __, state) => {
          const { doc, tr, schema } = state
          const shouldInsertNodeAtEnd = plugin.getState(state)
          const endPosition = doc.content.size
          const type = schema.nodes[this.options.node]

          if (!shouldInsertNodeAtEnd) {
            return
          }

          return tr.insert(endPosition, type.create())
        },
        state: {
          init: (_, state) => {
            const lastNode = state.tr.doc.lastChild

            return !nodeEqualsType({ node: lastNode, types: disabledNodes })
          },
          apply: (tr, value) => {
            if (!tr.docChanged) {
              return value
            }

            const lastNode = tr.doc.lastChild

            return !nodeEqualsType({ node: lastNode, types: disabledNodes })
          },
        },
      }),
    ]
  },
})
