import { Link as RemixLink } from '@remix-run/react'

export default function Link({
  children,
  href,
  ...props
}: {
  children: React.ReactNode
  href: string
}) {
  return (
    <RemixLink to={href} {...props}>
      {children}
    </RemixLink>
  )
}
