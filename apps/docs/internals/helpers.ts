import type { Root } from 'mdast'
import { visit } from 'unist-util-visit'

/**
 * Drops the custom anchor from headings like `## My heading [#my-anchor]`. The
 * anchor only matters to the rendered page; left in, it leaks into the exported
 * markdown and from there into search embeddings.
 */
export function stripHeadingCustomIds(tree: Root): void {
  visit(tree, 'heading', (node) => {
    const last = node.children.at(-1)
    if (last?.type !== 'text') return
    const text = last.value.trimEnd()
    const anchorStart = text.lastIndexOf('[#')
    if (anchorStart === -1 || text.indexOf(']', anchorStart) !== text.length - 1) return
    last.value = text.slice(0, anchorStart).trimEnd()
  })
}

export function flattenSections(sections: any[]): any[] {
  let a: any[] = []
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].id) {
      // only push a section that has an id
      // these are reserved for sidebar subtitles
      a.push(sections[i])
    }
    if (sections[i].items) {
      // if there are subitems, loop through
      a = a.concat(flattenSections(sections[i].items))
    }
  }
  return a
}
