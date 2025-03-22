import { Button } from 'ui'
import { Badge, cn } from 'ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui/src/components/shadcn/ui/dialog'
import { SigningKey, JWTAlgorithm } from 'state/jwt-secrets'
import { algorithmLabels, statusColors } from '../../constants'
import { ArrowRight, Key, Timer } from 'lucide-react'
import DotGrid from 'components/ui/DotGrid'

interface ConfirmRotateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  standbyKey: SigningKey | null
  inUseKey: SigningKey | null
  algorithm: JWTAlgorithm
  onConfirm: () => Promise<void>
  isLoading: boolean
}

export const ConfirmRotateDialog = ({
  open,
  onOpenChange,
  standbyKey,
  inUseKey,
  algorithm,
  onConfirm,
  isLoading,
}: ConfirmRotateDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Confirm Key Rotation</DialogTitle>
          <DialogDescription>
            Review the key rotation process below. This action will update your signing keys and
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="relative bg">
          <div className="absolute inset-0 opacity-[0.15]">
            <DotGrid rows={20} columns={20} count={100} />
          </div>
          <div className="relative flex flex-col items-center space-y-6 py-6">
            {standbyKey ? (
              <div className="flex items-center space-x-4">
                <Badge className={cn(statusColors['standby'], 'px-3 py-1 space-x-1')}>
                  <Timer size={13} className="mr-1.5" />
                  Standby Key
                  <span className="text-xs font-mono text-foreground-light">
                    {algorithmLabels[standbyKey.algorithm]}
                  </span>
                </Badge>
                <ArrowRight className="h-4 w-4 text-foreground-light" />
                <Badge className={cn(statusColors['in_use'], 'px-3 py-1')}>
                  <Key size={13} className="mr-1.5" />
                  In Use
                </Badge>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Badge
                  className={cn(
                    'bg-surface-300 bg-opacity-100 text-foreground border border-foreground-muted px-3 py-1 space-x-1'
                  )}
                >
                  <Key size={13} className="mr-1.5" />
                  <span>New Key</span>
                  <span className="text-xs font-mono text-foreground-light">
                    {algorithmLabels[algorithm]}
                  </span>
                </Badge>
                <ArrowRight className="h-4 w-4 text-foreground-light" />
                <Badge className={cn(statusColors['in_use'], 'px-3 py-1')}>
                  <Key size={13} className="mr-1.5" />
                  In Use
                </Badge>
              </div>
            )}
            <div className="flex items-center space-x-4">
              <Badge className={cn(statusColors['in_use'], 'px-3 py-1')}>
                <Key size={13} className="mr-1.5" />
                In Use
              </Badge>
              <ArrowRight className="h-4 w-4 text-foreground-light" />
              <Badge className={cn(statusColors['previously_used'], 'px-3 py-1 space-x-1')}>
                <Timer size={13} className="mr-1.5" />
                <span>Previously Used</span>
                <span className="text-xs font-mono text-foreground-light">
                  {inUseKey?.algorithm && algorithmLabels[inUseKey.algorithm]}
                </span>
              </Badge>
            </div>
          </div>
        </DialogSection>
        <DialogFooter>
          <Button type="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} loading={isLoading}>
            Confirm Rotation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
