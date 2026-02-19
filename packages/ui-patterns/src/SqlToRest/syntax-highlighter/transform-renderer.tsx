import { LazyMotion, m } from 'framer-motion'
import { PropsWithChildren } from 'react'
import { createElement, SyntaxHighlighterProps } from 'react-syntax-highlighter'

// Make sure to return the specific export containing the feature bundle.
const loadFramerFeatures = () => import('./framer-features').then((res) => res.default)

type RendererElementNode = {
  type: 'element'
  tagName: keyof JSX.IntrinsicElements | React.ComponentType<any>
  properties: { className: any[]; [key: string]: any }
  children: RendererNode[]
}

type RendererTextNode = {
  type: 'text'
  value: string | number
}

type RendererNode = RendererElementNode | RendererTextNode

export type WrapperProps = PropsWithChildren<{
  text: string
}>

export type TransformRendererProps = {
  search: (text: string) => boolean
  wrapper: ({ children, text }: WrapperProps) => JSX.Element
}

/**
 * Transforms the output of the syntax highlighter.
 *
 * It uses the provided `search` function to identify which
 * HTML elements contain the desired text. It then wraps those
 * elements using the provided `wrapper` React component.
 *
 * Useful for adding interactions within the code block,
 * such as clickable URLs.
 */
export function transformRenderer({
  search,
  wrapper,
}: TransformRendererProps): SyntaxHighlighterProps['renderer'] {
  return ({ rows, stylesheet, useInlineStyles }) => {
    const newRows = (rows as RendererNode[]).map((node, i) => {
      const element = createElement({
        node,
        stylesheet,
        useInlineStyles,
        key: `code-segment-${i}`,
      })

      if (node.type === 'text') {
        return element
      }

      const line = mergeValues([node])

      if (!search(line)) {
        return (
          <m.div key={line} layoutId={line}>
            {element}
          </m.div>
        )
      }

      const children = splitSpaceElements(node.children)

      let startIndex = -1

      while (search(mergeValues(children.slice(startIndex + 1)))) {
        startIndex++
      }

      let endIndex = children.length

      while (search(mergeValues(children.slice(startIndex, endIndex - 1)))) {
        endIndex--
      }

      const text = mergeValues(children.slice(startIndex, endIndex))

      const nodeChildren: RendererNode[] = []
      const wrapperElement = elementToRendererElementNode(wrapper, text)

      for (let i = 0; i < children.length; i++) {
        const child = children[i]

        if (i < startIndex || i >= endIndex) {
          nodeChildren.push(child)
        } else {
          if (i === startIndex) {
            nodeChildren.push(wrapperElement)
          }
          wrapperElement.children.push(child)
        }
      }

      node.children = nodeChildren

      const reactElement = createElement({
        node,
        stylesheet,
        useInlineStyles,
        key: `code-segment-${i}`,
      })

      return (
        <m.div key={line} layoutId={line}>
          {reactElement}
        </m.div>
      )
    })

    return <LazyMotion features={loadFramerFeatures}>{newRows}</LazyMotion>
  }
}

/**
 * Recursively merges text nodes into a single string.
 */
function mergeValues(nodes: RendererNode[]): string {
  return nodes
    .map((node) => {
      const { type } = node

      if (type === 'text') {
        return node.value.toString()
      } else if (type === 'element') {
        return mergeValues(node.children)
      } else {
        throw new Error(`Unknown node type '${type}'`)
      }
    })
    .join('')
}

/**
 * Searches for space characters at the start or end of an element's text nodes
 * and splits them out into their own element + text node.
 */
function splitSpaceElements(nodes: RendererNode[]) {
  const children: RendererNode[] = []

  for (const child of nodes) {
    const newChild = { ...child }

    if (newChild.type === 'element') {
      let splitNodes = splitSpaceElements(newChild.children)

      if (splitNodes.length === 1) {
        children.push({
          ...newChild,
          children: splitNodes,
        })
        continue
      }

      const [firstNode] = splitNodes.slice(0, 1)
      const [lastNode] = splitNodes.slice(-1)

      let newFirstNode: RendererElementNode | undefined = undefined
      let newLastNode: RendererElementNode | undefined = undefined

      if (firstNode.type === 'text' && firstNode.value.toString().match(/^[ ]+$/)) {
        newFirstNode = {
          ...newChild,
          children: [firstNode],
        }
        splitNodes.shift()
      }

      if (lastNode.type === 'text' && lastNode.value.toString().match(/^[ ]+$/)) {
        newLastNode = {
          ...newChild,
          children: [lastNode],
        }
        splitNodes.pop()
      }

      if (newFirstNode) {
        children.push(newFirstNode)
      }

      children.push({
        ...newChild,
        children: splitNodes,
      })

      if (newLastNode) {
        children.push(newLastNode)
      }
    } else {
      const stringValue = newChild.value.toString()
      const startNonWhitespaceIndex = stringValue.search(/[^ ]/)
      const endNonWhitespaceIndex = stringValue.search(/[^ ][ ]+$/) + 1

      if (startNonWhitespaceIndex > 0) {
        const whitespaceChild: RendererTextNode = {
          ...newChild,
          value: stringValue.substring(0, startNonWhitespaceIndex),
        }
        children.push(whitespaceChild)
      }

      if (startNonWhitespaceIndex > 0 || endNonWhitespaceIndex > 0) {
        const nonWhitespaceChild: RendererTextNode = {
          ...newChild,
          value: stringValue.substring(
            startNonWhitespaceIndex > 0 ? startNonWhitespaceIndex : 0,
            endNonWhitespaceIndex > 0 ? endNonWhitespaceIndex : undefined
          ),
        }
        children.push(nonWhitespaceChild)
      } else {
        children.push(newChild)
      }

      if (endNonWhitespaceIndex > 0) {
        const whitespaceChild: RendererTextNode = {
          ...newChild,
          value: stringValue.substring(endNonWhitespaceIndex),
        }
        children.push(whitespaceChild)
      }
    }
  }

  return children
}

/**
 * Converts a JSX element to a RendererElementNode
 * that the syntax highlighter can work with.
 */
function elementToRendererElementNode(
  element: ({ children, text }: WrapperProps) => JSX.Element,
  text: string
): RendererElementNode {
  const {
    type,
    props: { children, className, ...props },
  } = element({ children: [], text })

  return {
    type: 'element',
    tagName: type,
    properties: {
      className: className ? [className] : [],
      ...props,
    },
    children,
  }
}
