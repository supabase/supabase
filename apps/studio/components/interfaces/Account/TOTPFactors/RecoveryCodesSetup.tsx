import { RectangleEllipsisIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

export const RecoveryCodesSetup = ({ children }: { children: ReactNode }) => (
  <EmptyStatePresentational
    icon={RectangleEllipsisIcon}
    title="No recovery codes"
    description="Generate recovery codes so you can still sign in if you lose access to your MFA methods."
  >
    {children}
  </EmptyStatePresentational>
)
