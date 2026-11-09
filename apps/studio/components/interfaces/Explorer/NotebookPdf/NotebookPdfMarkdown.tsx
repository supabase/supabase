import { Link as PdfLink, Text, View } from '@react-pdf/renderer'
import type { ListItem, Content as MdastContent, Root as MdastRoot, PhrasingContent } from 'mdast'
import type { ReactElement, ReactNode } from 'react'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import { pdfStyles } from './theme'

const HEADING_STYLES = [
  pdfStyles.heading1,
  pdfStyles.heading2,
  pdfStyles.heading3,
  pdfStyles.heading4,
  pdfStyles.heading5,
  pdfStyles.heading6,
]

export function parseMarkdownToMdast(markdown: string): MdastRoot {
  return unified().use(remarkParse).use(remarkGfm).parse(markdown) as MdastRoot
}

function mapInline(node: PhrasingContent, key: string): ReactNode {
  switch (node.type) {
    case 'text':
      return node.value
    case 'strong':
      return (
        <Text key={key} style={pdfStyles.bold}>
          {node.children.map((child, index) => mapInline(child, `${key}-${index}`))}
        </Text>
      )
    case 'emphasis':
      return (
        <Text key={key} style={pdfStyles.italic}>
          {node.children.map((child, index) => mapInline(child, `${key}-${index}`))}
        </Text>
      )
    case 'delete':
      return (
        <Text key={key} style={{ textDecoration: 'line-through' }}>
          {node.children.map((child, index) => mapInline(child, `${key}-${index}`))}
        </Text>
      )
    case 'inlineCode':
      return (
        <Text key={key} style={pdfStyles.inlineCode}>
          {node.value}
        </Text>
      )
    case 'link':
      return (
        <PdfLink key={key} src={node.url} style={pdfStyles.link}>
          {node.children.map((child, index) => mapInline(child, `${key}-${index}`))}
        </PdfLink>
      )
    case 'break':
      return '\n'
    default:
      return null
  }
}

function mapListItem(
  item: ListItem,
  ordered: boolean,
  start: number,
  index: number,
  key: string
): ReactElement {
  const marker = ordered ? `${start + index}.` : '•'

  return (
    <View key={key} style={pdfStyles.listItem}>
      <Text style={pdfStyles.listItemMarker}>{marker}</Text>
      <View style={{ flex: 1 }}>
        {item.children.map((child, childIndex) =>
          mapBlock(child, `${key}-${childIndex}`, { tight: true })
        )}
      </View>
    </View>
  )
}

function mapBlock(
  node: MdastContent,
  key: string,
  { tight = false }: { tight?: boolean } = {}
): ReactElement | null {
  switch (node.type) {
    case 'heading':
      return (
        <Text key={key} style={HEADING_STYLES[Math.min(node.depth, 6) - 1]}>
          {node.children.map((child, index) => mapInline(child, `${key}-${index}`))}
        </Text>
      )
    case 'paragraph':
      return (
        <Text
          key={key}
          style={tight ? [pdfStyles.paragraph, { marginBottom: 0 }] : pdfStyles.paragraph}
        >
          {node.children.map((child, index) => mapInline(child, `${key}-${index}`))}
        </Text>
      )
    case 'list': {
      const ordered = node.ordered ?? false
      const start = node.start ?? 1
      return (
        <View key={key} style={pdfStyles.list}>
          {node.children.map((item, index) =>
            mapListItem(item, ordered, start, index, `${key}-${index}`)
          )}
        </View>
      )
    }
    case 'blockquote':
      return (
        <View key={key} style={pdfStyles.blockquote}>
          {node.children.map((child, index) => mapBlock(child, `${key}-${index}`))}
        </View>
      )
    case 'thematicBreak':
      return <View key={key} style={pdfStyles.thematicBreak} />
    case 'code':
      return (
        <View key={key} style={pdfStyles.sqlBox}>
          <Text style={pdfStyles.sqlText}>{node.value}</Text>
        </View>
      )
    case 'table': {
      const [headerRow, ...bodyRows] = node.children
      return (
        <View key={key} style={pdfStyles.table}>
          <View style={pdfStyles.tableHeaderRow}>
            {headerRow.children.map((cell, cellIndex) => (
              <Text key={`${key}-header-${cellIndex}`} style={pdfStyles.tableHeaderCell}>
                {cell.children.map((child, childIndex) =>
                  mapInline(child, `${key}-header-${cellIndex}-${childIndex}`)
                )}
              </Text>
            ))}
          </View>
          {bodyRows.map((row, rowIndex) => (
            <View key={`${key}-row-${rowIndex}`} style={pdfStyles.tableRow}>
              {row.children.map((cell, cellIndex) => (
                <Text key={`${key}-row-${rowIndex}-${cellIndex}`} style={pdfStyles.tableCell}>
                  {cell.children.map((child, childIndex) =>
                    mapInline(child, `${key}-row-${rowIndex}-${cellIndex}-${childIndex}`)
                  )}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )
    }
    default:
      return null
  }
}

export function markdownToPdfBlocks(markdown: string): ReactElement[] {
  const root = parseMarkdownToMdast(markdown)
  return root.children
    .map((child, index) => mapBlock(child, `md-${index}`))
    .filter((element): element is ReactElement => element !== null)
}

export function NotebookPdfMarkdown({ markdown }: { markdown: string }) {
  return <View style={pdfStyles.cellSpacing}>{markdownToPdfBlocks(markdown)}</View>
}
