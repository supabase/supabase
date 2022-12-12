import { FC } from 'react'

const InlineCodeTag = ({ children }: any) => {
  // If children isn't a string, just return it as is, just in case
  if (typeof children !== 'string') return children

  // check the length of the string inside the <code> tag
  // if it's fewer than 70 characters, add a white-space: pre so it doesn't wrap
  const className = children.length < 70 ? 'short-inline-codeblock' : ''

  return <code className={className}> HELLO WORLD {children}</code>
}
export default InlineCodeTag
