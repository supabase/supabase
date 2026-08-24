import { isScopeGroupOverRole } from './OverRoleAnnotation.utils'
import type { OAuthOrganizationRole, OAuthScopeLevel } from '@/data/oauth-apps/types'

export interface OverRoleAnnotationProps {
  level: OAuthScopeLevel
  memberRole: OAuthOrganizationRole['role']
}

export const OverRoleAnnotation = ({ level, memberRole }: OverRoleAnnotationProps) => {
  if (!isScopeGroupOverRole(level, memberRole)) return null

  return <span className="text-xs text-foreground-lighter shrink-0">Read-only for your role</span>
}
