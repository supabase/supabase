import { Link as RemixLink } from 'react-router'

export default function Link({
  children,
  href,
  passHref,
  ...props
}: {
  children: React.ReactNode
  href: string
  passHref?: boolean
}) {
  return (
    <RemixLink to={href} {...props}>
      {children}
    </RemixLink>
  )
}
