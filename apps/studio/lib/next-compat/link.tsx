import { Link as TanstackRouterLink } from '@tanstack/react-router'

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
    <TanstackRouterLink to={href} {...props}>
      {children}
    </TanstackRouterLink>
  )
}
