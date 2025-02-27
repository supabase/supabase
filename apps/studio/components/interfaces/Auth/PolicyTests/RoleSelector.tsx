import { useState } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Switch,
  cn,
} from 'ui'
import { ChevronDown, Database, User as UserIcon, Users } from 'lucide-react'
import { PolicyTestRole } from './types'
import { v4 as uuidv4 } from 'uuid'

type AuthenticatorAssuranceLevels = 'aal1' | 'aal2'

interface RoleSelectorProps {
  currentRole: PolicyTestRole | undefined
  onRoleChange: (role: PolicyTestRole | undefined) => void
}

const RoleSelector = ({ currentRole, onRoleChange }: RoleSelectorProps) => {
  const [userEmail, setUserEmail] = useState<string>(currentRole?.email || '')
  const [userId, setUserId] = useState<string>(currentRole?.userId || uuidv4())
  const [externalSub, setExternalSub] = useState<string>(currentRole?.externalSub || '')
  const [additionalClaims, setAdditionalClaims] = useState<string>('{}')
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false)
  const [aal, setAal] = useState<AuthenticatorAssuranceLevels>('aal1')

  const selectedRole = currentRole?.role || 'service_role'

  const handleRoleChange = (value: string) => {
    if (value === 'service_role') {
      // For service role we don't set a role as it's the default
      onRoleChange(undefined)
    } else if (value === 'anon') {
      onRoleChange({
        role: 'anon',
      })
    } else if (value === 'authenticated') {
      setAdvancedOpen(true)
      // If already has email, keep it
      if (currentRole?.email) {
        onRoleChange({
          role: 'authenticated',
          email: currentRole.email,
          userId: currentRole.userId || userId,
          aal: aal,
        })
      } else if (currentRole?.externalSub) {
        onRoleChange({
          role: 'authenticated',
          externalSub: currentRole.externalSub,
          aal: aal,
        })
      } else {
        // Basic authenticated role without specific user
        onRoleChange({
          role: 'authenticated',
          aal: aal,
        })
      }
    }
  }

  const handleSetNativeUser = () => {
    if (!userEmail) return

    onRoleChange({
      role: 'authenticated',
      email: userEmail,
      userId: userId || uuidv4(),
      aal: aal,
    })

    setAdvancedOpen(false)
  }

  const handleSetExternalUser = () => {
    if (!externalSub) return

    onRoleChange({
      role: 'authenticated',
      externalSub,
      additionalClaims: additionalClaims,
      aal: aal,
    })

    setAdvancedOpen(false)
  }

  const toggleAalState = () => {
    const newAal = aal === 'aal2' ? 'aal1' : 'aal2'
    setAal(newAal)

    // Update current role with new AAL if it exists
    if (currentRole?.role === 'authenticated') {
      onRoleChange({
        ...currentRole,
        aal: newAal,
      })
    }
  }

  const getDisplayText = () => {
    if (!currentRole) return 'service_role'

    if (currentRole.role === 'authenticated') {
      if (currentRole.email) {
        return `${currentRole.role} (${currentRole.email})`
      } else if (currentRole.externalSub) {
        return `${currentRole.role} (${currentRole.externalSub})`
      }
      return `${currentRole.role} ${currentRole.aal === 'aal2' ? '(AAL2)' : ''}`
    }
    return currentRole.role
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="default" className="h-[26px] gap-1">
          <span className="flex items-center gap-1">
            <span>{getDisplayText()}</span>
            <ChevronDown className="text-muted" strokeWidth={1} size={12} />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuRadioGroup value={selectedRole} onValueChange={handleRoleChange}>
          <DropdownMenuRadioItem value="service_role" className="gap-2">
            <Database size={14} className="text-foreground-light" />
            <span>service_role</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="anon" className="gap-2">
            <UserIcon size={14} className="text-foreground-light" />
            <span>anon</span>
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="authenticated" className="gap-2">
            <Users size={14} className="text-foreground-light" />
            <span>authenticated</span>
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        {selectedRole === 'authenticated' && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 flex justify-between items-center">
              <span className="text-xs">MFA Assurance Level</span>
              <div className="flex flex-row items-center gap-x-2 text-xs font-bold">
                <p className={aal === 'aal1' ? undefined : 'text-foreground-lighter'}>AAL1</p>
                <Switch checked={aal === 'aal2'} onCheckedChange={toggleAalState} />
                <p className={aal === 'aal2' ? undefined : 'text-foreground-lighter'}>AAL2</p>
              </div>
            </div>
          </>
        )}

        {advancedOpen && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 flex flex-col gap-2">
              <div>
                <div className="text-xs font-medium mb-1">Authenticated as native user</div>
                <div className="flex flex-col gap-1">
                  <Input
                    size="tiny"
                    placeholder="user@example.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full"
                    label="Email"
                  />
                  <Input
                    size="tiny"
                    placeholder="User ID (UUID)"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full mt-1"
                    label="User ID"
                    descriptionText="Optional. Random UUID used if empty"
                  />
                  <Button size="tiny" onClick={handleSetNativeUser} className="mt-1 self-end">
                    Set user
                  </Button>
                </div>
              </div>

              <div className="mt-2">
                <div className="text-xs font-medium mb-1">Authenticated as external user</div>
                <div className="flex flex-col gap-1">
                  <Input
                    size="tiny"
                    placeholder="External sub value"
                    value={externalSub}
                    onChange={(e) => setExternalSub(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    size="tiny"
                    placeholder='{"app_metadata": {"org_id": "abc123"}}'
                    value={additionalClaims}
                    onChange={(e) => setAdditionalClaims(e.target.value)}
                    className="w-full mt-1"
                    label="Additional claims (JSON)"
                  />
                  <Button size="tiny" onClick={handleSetExternalUser} className="mt-1 self-end">
                    Set
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedRole === 'authenticated' && !advancedOpen && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 flex justify-end">
              <Button size="tiny" type="default" onClick={() => setAdvancedOpen(true)}>
                Advanced Options
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default RoleSelector
