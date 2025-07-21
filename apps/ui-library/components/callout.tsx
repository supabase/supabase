import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

interface CalloutProps {
  icon?: string
  title?: string
  children?: React.ReactNode
}

export function Callout({ title, children, icon, ...props }: CalloutProps) {
  return (
    <Alert_Shadcn_ {...props}>
      {icon && <span className="mr-4 text-2xl">{icon}</span>}
      {title && <AlertTitle_Shadcn_>{title}</AlertTitle_Shadcn_>}
      <AlertDescription_Shadcn_>{children}</AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
