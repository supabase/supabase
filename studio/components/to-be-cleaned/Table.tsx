import { PropsWithChildren } from 'react'

interface TableProps {
  body: JSX.Element | JSX.Element[]
  head?: JSX.Element | JSX.Element[]
  className?: string
  containerClassName?: string
  borderless?: boolean
  headTrClasses?: string
  bodyClassName?: string
  style?: React.StyleHTMLAttributes<HTMLTableElement>
}

function Table({
  body,
  head,
  className,
  containerClassName,
  borderless,
  headTrClasses,
  bodyClassName,
  style,
}: TableProps) {
  let containerClasses = ['table-container']
  if (containerClassName) containerClasses.push(containerClassName)
  if (borderless) containerClasses.push('table-container--borderless')

  let classes = ['table']
  if (className) classes.push(className)

  return (
    <div className={containerClasses.join(' ')}>
      <table className={classes.join(' ')} style={style}>
        <thead>
          <tr className={headTrClasses}>{head}</tr>
        </thead>
        <tbody className={bodyClassName}>{body}</tbody>
      </table>
    </div>
  )
}

interface ThProps {
  className?: string
  style?: React.CSSProperties
}

const Th = ({ children, className, style }: PropsWithChildren<ThProps>) => {
  const classes = ['p-3 px-4 text-left']
  if (className) classes.push(className)
  return (
    <th className={classes.join(' ')} style={style}>
      {children}
    </th>
  )
}

interface TrProps {
  className?: string
  hoverable?: boolean
  style?: React.CSSProperties
  onClick?: () => void
}

const Tr = ({ children, className, onClick, style, hoverable }: PropsWithChildren<TrProps>) => {
  let classes = [className]
  if (onClick || hoverable) classes.push('tr--link')
  return (
    <tr className={classes.join(' ')} onClick={onClick} style={style}>
      {children}
    </tr>
  )
}

interface TdProps extends React.HTMLProps<HTMLTableCellElement> {
  colSpan?: number
  className?: string
  style?: React.CSSProperties
  align?: 'left' | 'center' | 'right' | 'justify' | 'char' | undefined
}

const Td = ({ children, colSpan, className, style, ...rest }: PropsWithChildren<TdProps>) => {
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
