import {
  createElement,
  forwardRef,
  ForwardRefExoticComponent,
  ReactSVG,
  RefAttributes,
  SVGProps,
} from 'react'

import defaultAttributes from './defaultAttributes'

export type IconNode = [elementName: keyof ReactSVG, attrs: Record<string, string>][]

export type SVGAttributes = Partial<SVGProps<SVGSVGElement>>
type ComponentAttributes = RefAttributes<SVGSVGElement> & SVGAttributes

export interface LucideProps extends ComponentAttributes {
  size?: string | number
  absoluteStrokeWidth?: boolean
}

export type LucideIcon = ForwardRefExoticComponent<LucideProps>
/**
 * Converts string to KebabCase
 * Copied from scripts/helper. If anyone knows how to properly import it here
 * then please fix it.
 *
 * @param {string} string
 * @returns {string} A kebabized string
 */
export const toKebabCase = (string: string) =>
  string
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .trim()

/**
 * Converts kebab-case string to camelCase
 * @param {string} string
 * @returns {string} A camelCased string
 */
export const toCamelCase = (string: string) =>
  string.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()).trim()

/**
 * Converts kebab-case attributes to camelCase for React compatibility
 * @param {Record<string, string>} attrs
 * @returns {Record<string, string>} Attributes with camelCase keys
 */
export const convertAttributesToCamelCase = (
  attrs: Record<string, string>
): Record<string, string> => {
  const converted: Record<string, string> = {}

  for (const [key, value] of Object.entries(attrs)) {
    // Convert kebab-case to camelCase, but keep some special cases
    const camelKey = key.includes('-') ? toCamelCase(key) : key
    converted[camelKey] = value
  }

  return converted
}

const createLucideIcon = (iconName: string, iconNode: IconNode): LucideIcon => {
  const Component = forwardRef<SVGSVGElement, LucideProps>(
    (
      {
        color = 'currentColor',
        size = 24,
        strokeWidth = 2,
        absoluteStrokeWidth,
        className = '',
        children,
        ...rest
      },
      ref
    ) => {
      return createElement(
        'svg',
        {
          ref,
          ...defaultAttributes,
          width: size,
          height: size,
          stroke: color,
          strokeWidth: absoluteStrokeWidth
            ? (Number(strokeWidth) * 24) / Number(size)
            : strokeWidth,
          className: ['lucide', `lucide-${toKebabCase(iconName)}`, className].join(' '),
          ...rest,
        },
        [
          ...iconNode.map(([tag, attrs]) =>
            createElement(tag, convertAttributesToCamelCase(attrs))
          ),
          ...(Array.isArray(children) ? children : [children]),
        ]
      )
    }
  )

  Component.displayName = `${iconName}`

  return Component
}

export default createLucideIcon
