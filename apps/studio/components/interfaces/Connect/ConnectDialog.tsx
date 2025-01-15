import { Plug } from 'lucide-react'

import { PoolingModesModal } from 'components/interfaces/Settings/Database/PoolingModesModal'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  cn,
} from 'ui'

export const ConnectDialog = () => {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button type="primary" icon={<Plug className="rotate-90" />}>
            <span>Connect</span>
          </Button>
        </DialogTrigger>
        <DialogContent className={cn('sm:max-w-5xl p-0')}>
          <DialogHeader className="pb-3">
            <DialogTitle>Connect to your project</DialogTitle>
            <DialogDescription>
              Get the connection strings and environment variables for your app
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <PoolingModesModal />
    </>
  )
}
