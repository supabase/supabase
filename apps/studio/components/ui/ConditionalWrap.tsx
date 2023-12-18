import { cloneElement } from 'react'

type ConditionalWrapProps = {
  condition: boolean
  wrap: (children: JSX.Element | null) => JSX.Element
  children: JSX.Element | null
}

const ConditionalWrap = ({ condition, children, wrap }: ConditionalWrapProps) =>
  condition ? cloneElement(wrap(children)) : children

export default ConditionalWrap
