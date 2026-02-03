import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from 'ui'
import {
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

interface AccessTokenNewBannerProps<T> {
  token: T
  onClose: () => void
  getTokenValue: (token: T) => string
  getTokenPermissions?: (token: T) => string[] | undefined
  title?: string
  description?: string
}

const PERMISSIONS_COLLAPSE_THRESHOLD = 5 // Show inline if 5 or fewer, collapse if more

export const AccessTokenNewBanner = <T,>({
  token,
  onClose,
  getTokenValue,
  getTokenPermissions,
  title = 'Successfully generated a new token!',
  description = 'Do copy this access token and store it in a secure place - you will not be able to see it again.',
}: AccessTokenNewBannerProps<T>) => {
  const permissions = getTokenPermissions?.(token)
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const shouldCollapse = permissions && permissions.length > PERMISSIONS_COLLAPSE_THRESHOLD

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 relative">
        <CardTitle>{title}</CardTitle>
        <Button
          type="text"
          icon={<X />}
          className="w-7 h-7 absolute top-2.5 right-2.5"
          onClick={onClose}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-foreground-light">{description}</p>
        <div className="w-full pb-2">
          <Input
            copy
            readOnly
            size="small"
            className="w-full input-mono"
            id="access-token-value"
            value={getTokenValue(token)}
            onChange={() => { }}
            onCopy={() => toast.success('Token copied to clipboard')}
          />
        </div>

        {permissions && permissions.length > 0 && (
          <div className="pt-4 border-t border-default">
            {shouldCollapse ? (
              <Collapsible open={permissionsOpen} onOpenChange={setPermissionsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="text"
                    size="tiny"
                    className="w-full justify-start px-0.5 h-auto text-sm font-medium text-foreground-light hover:text-foreground"
                  >
                    <div className="flex items-center gap-1.5">
                      {permissionsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>Permissions assigned to this token ({permissions.length})</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3 transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <div className="flex flex-wrap gap-2">
                    {permissions.map((permission) => (
                      <Badge key={permission}>{permission}</Badge>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <>
                <h3 className="text-sm font-medium mb-3">Permissions assigned to this token:</h3>
                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => (
                    <Badge key={permission}>{permission}</Badge>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
