import { useParams } from 'common'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import { PASSWORD_PLACEHOLDER, TOKEN_PASSWORD_PLACEHOLDER } from './ConnectionString.utils'
import {
  DATABASE_PASSWORD_VALUE,
  resolveSelectedTemporaryAccessRole,
} from './TemporaryAccessConnection.utils'
import { useActiveTemporaryAccessRoles } from '@/data/jit-db-access/use-active-temporary-access-roles'

type TemporaryAccessConnectionContextValue = {
  state: {
    activeRoles: string[]
    selectedRole: string
  }
  actions: {
    setSelectedRole: (role: string) => void
  }
  meta: {
    isGrantMode: boolean
    grantRole: string | null
    passwordPlaceholder: string
  }
}

const NOOP_VALUE: TemporaryAccessConnectionContextValue = {
  state: {
    activeRoles: [],
    selectedRole: DATABASE_PASSWORD_VALUE,
  },
  actions: {
    setSelectedRole: () => {},
  },
  meta: {
    isGrantMode: false,
    grantRole: null,
    passwordPlaceholder: PASSWORD_PLACEHOLDER,
  },
}

const TemporaryAccessConnectionContext =
  createContext<TemporaryAccessConnectionContextValue>(NOOP_VALUE)

export function TemporaryAccessConnectionProvider({
  children,
  enabled = true,
}: {
  children: ReactNode
  enabled?: boolean
}) {
  const { ref: projectRef } = useParams()
  const { activeRoles } = useActiveTemporaryAccessRoles(projectRef, { enabled })
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const value = useMemo(() => {
    const resolvedRole = resolveSelectedTemporaryAccessRole({ selectedRole, activeRoles })
    const isGrantMode = resolvedRole !== DATABASE_PASSWORD_VALUE

    return {
      state: {
        activeRoles,
        selectedRole: resolvedRole,
      },
      actions: { setSelectedRole },
      meta: {
        isGrantMode,
        grantRole: isGrantMode ? resolvedRole : null,
        passwordPlaceholder: isGrantMode ? TOKEN_PASSWORD_PLACEHOLDER : PASSWORD_PLACEHOLDER,
      },
    } satisfies TemporaryAccessConnectionContextValue
  }, [activeRoles, selectedRole])

  return (
    <TemporaryAccessConnectionContext.Provider value={value}>
      {children}
    </TemporaryAccessConnectionContext.Provider>
  )
}

export const useTemporaryAccessConnection = () => useContext(TemporaryAccessConnectionContext)
