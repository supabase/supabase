import * as React from 'react'
import { Typography } from '@supabase/ui'

type TableProps = {
  body: JSX.Element | JSX.Element[]
  head?: JSX.Element | JSX.Element[]
  className?: string
  containerClassName?: string
  borderless?: boolean
  headTrClasses?: string
}

function Table({
  body,
  head,
  className,
  containerClassName,
  borderless,
  headTrClasses,
}: TableProps) {
  let containerClasses = ['table-container']
  if (containerClassName) containerClasses.push(containerClassName)
  if (borderless) containerClasses.push('table-container--borderless')

  let classes = ['table']
  if (className) classes.push(className)

  return (
    <div className={containerClasses.join(' ')}>
      <table className={classes.join(' ')}>
        <thead>
          <tr className={headTrClasses}>{head}</tr>
        </thead>
        <tbody>{body}</tbody>
      </table>
    </div>
  )
}

type ThProps = {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const Th: React.FC<ThProps> = ({ children, className, style }) => {
  const classes = ['p-3 px-4 text-left']
  if (className) classes.push(className)
  return (
    <th className={classes.join(' ')} style={style}>
      {children}
    </th>
  )
}

type TrProps = {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  style?: React.CSSProperties
  onClick?: () => void
}

const Tr: React.FC<TrProps> = ({ children, className, onClick, style, hoverable }) => {
  let classes = [className]
  if (onClick || hoverable) classes.push('tr--link')
  return (
    <tr className={classes.join(' ')} onClick={onClick} style={style}>
      {children}
    </tr>
  )
}

type TdProps = {
  children: React.ReactNode
  colSpan?: number
  className?: string
  style?: React.CSSProperties
} & React.HTMLProps<HTMLTableCellElement>
const Td: React.FC<TdProps> = ({ children, colSpan, className, style, ...rest }) => {
  return (
    <td className={className} colSpan={colSpan} style={style} {...rest}>
      {children}
    </td>
  )
}

Table.th = Th
Table.td = Td
Table.tr = Tr

export default Table
