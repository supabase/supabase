import { forwardRef, type AnchorHTMLAttributes } from 'react'

/** Surfaces never navigate in-document; links open through the host. */
const Link = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(
  function Link(props, ref) {
    return <a ref={ref} target="_blank" rel="noreferrer" {...props} />
  }
)

export default Link
