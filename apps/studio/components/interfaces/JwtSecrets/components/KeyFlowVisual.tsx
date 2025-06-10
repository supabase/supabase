import { ArrowRight, Key, Timer } from 'lucide-react'
import { Badge, cn } from 'ui'
import { SigningKey } from 'state/jwt-secrets'
import { statusColors } from '../constants'

interface KeyFlowVisualProps {
  standbyKey: SigningKey | null
  inUseKey: SigningKey | null
  previouslyUsedKeys: SigningKey[]
  revokedKeys: SigningKey[]
}

export const KeyFlowVisual = ({
  standbyKey,
  inUseKey,
  previouslyUsedKeys,
  revokedKeys,
}: KeyFlowVisualProps) => {
  return (
    <div className="flex flex-col items-center space-y-4 py-4">
      {standbyKey && (
        <div className="flex items-center space-x-4">
          <div className={`${statusColors['standby']} p-2 rounded`}>Standby</div>
          <ArrowRight className="h-6 w-6" />
          <div className={`${statusColors['in_use']} p-2 rounded`}>In Use</div>
        </div>
      )}
      <div className="flex items-center space-x-4">
        <div className={`${statusColors['in_use']} p-2 rounded`}>In Use</div>
        <ArrowRight className="h-6 w-6" />
        <div className={`${statusColors['previously_used']} p-2 rounded`}>Previously Used</div>
      </div>
      {!standbyKey && (
        <div className="flex items-center space-x-4">
          <div className="bg-green-100 text-green-800 p-2 rounded">New Key</div>
          <ArrowRight className="h-6 w-6" />
          <div className={`${statusColors['in_use']} p-2 rounded`}>In Use</div>
        </div>
      )}
      {previouslyUsedKeys.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="text-sm text-foreground-light flex items-center">
            <Timer size={13} className="mr-1.5" />
            {previouslyUsedKeys.length} Previously Used{' '}
            {previouslyUsedKeys.length === 1 ? 'Key' : 'Keys'}
          </div>
        </div>
      )}
      {revokedKeys.length > 0 && (
        <div className="flex items-center space-x-4">
          <Badge className={cn(statusColors['revoked'], 'px-3 py-1')}>
            <Key size={13} className="mr-1.5" />
            Revoked Keys ({revokedKeys.length})
          </Badge>
        </div>
      )}
    </div>
  )
}
