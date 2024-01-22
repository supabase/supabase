'use client'

import { useAppStateSnapshot } from '@/lib/state'
import { DialogContent_Shadcn_, Dialog_Shadcn_ } from 'ui'

const LoginDialog = ({ children }: { children: React.ReactNode }) => {
  const snap = useAppStateSnapshot()

  return (
    <Dialog_Shadcn_
      open={snap.loginDialogOpen}
      onOpenChange={() => snap.setLoginDialogOpen(!snap.loginDialogOpen)}
    >
      <DialogContent_Shadcn_ className="max-w-md">{children}</DialogContent_Shadcn_>
    </Dialog_Shadcn_>
  )
}

export { LoginDialog }
