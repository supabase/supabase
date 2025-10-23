// @ts-ignore
import { ChevronRight } from 'lucide-react'
import BreadcrumbStyle from './Breadcrumb.module.css'

interface Props {
  children?: [React.ReactNode]
  className?: string
  style?: React.CSSProperties
  spacing?: 'small' | 'medium' | 'large'
}

/**
 * A breadcrumb component for navigation.
 * @param {object} props - The component props.
 * @param {React.ReactNode[]} [props.children] - The breadcrumb items.
 * @param {string} [props.className] - Additional CSS class names.
 * @param {React.CSSProperties} [props.style] - Inline CSS styles.
 * @param {'small' | 'medium' | 'large'} [props.spacing='small'] - The spacing between items.
 * @returns {React.ReactElement} The breadcrumb component.
 * @deprecated Use `import { Breadcrumb_shadcn_ } from "ui"` instead
 */
const Breadcrumb = ({ className, style, children, spacing = 'small' }: Props) => {
  let classes = [BreadcrumbStyle['sbui-breadcrumb--container']]
  let separatorClasses = [BreadcrumbStyle['sbui-breadcrumb--separator']]

  if (className) {
    classes.push(className)
  }

  if (spacing) {
    separatorClasses.push(`sbui-breadcrumb--separator-${spacing}`)
  }

  return (
    <ol className={classes.join(' ')} style={style} aria-label="Breadcrumb">
      {children!.map((child: React.ReactNode, idx: number) => (
        <li className={BreadcrumbStyle['sbui-breadcrumb--item-container']}>
          {child}
          {idx + 1 < children!.length && (
            <ChevronRight size={12} className={separatorClasses.join(' ')} aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  )
}

interface ItemProps {
  children: React.ReactNode
  active?: boolean
  onClick?: any
  style?: React.CSSProperties
}

/**
 * An item within the Breadcrumb component.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content of the item.
 * @param {boolean} [props.active] - Whether the item is active.
 * @param {Function} [props.onClick] - The click handler for the item.
 * @param {React.CSSProperties} [props.style] - Inline CSS styles.
 * @returns {React.ReactElement} The breadcrumb item component.
 * @deprecated Use ./BreadcrumbItem_shadcn_ instead
 */
export function Item({ children, active, onClick, style }: ItemProps) {
  let classes = [BreadcrumbStyle['sbui-breadcrumb--item']]
  if (active) classes.push(BreadcrumbStyle['sbui-breadcrumb--item__active'])
  return (
    <span
      className={classes.join(' ')}
      onClick={onClick}
      style={style}
      aria-current={active ? 'page' : false}
    >
      {children}
    </span>
  )
}

Breadcrumb.Item = Item

export default Breadcrumb
