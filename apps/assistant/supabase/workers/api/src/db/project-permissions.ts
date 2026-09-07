import {
  ASSISTANT_CONSENT_VERSION,
  projectPermissionLevelSchema,
  type ProjectPermissionLevel,
} from '../permissions'
import { adminQuery } from './postgres'

export async function getProjectPermissions(
  userId: string,
  projectRef: string,
  orgSlug: string,
  canShareProjectData: boolean
) {
  const [row] = await adminQuery<{ level: string; consent_version: number }>(
    'select level, consent_version from public.project_permissions where user_id=$1 and project_ref=$2 and org_slug=$3',
    [userId, projectRef, orgSlug]
  )
  const level = projectPermissionLevelSchema.safeParse(row?.level)
  const hasConsented = row?.consent_version === ASSISTANT_CONSENT_VERSION && level.success
  return {
    level: hasConsented && canShareProjectData ? level.data : ('disabled' as const),
    hasConsented,
    canShareProjectData,
    consentVersion: ASSISTANT_CONSENT_VERSION,
  }
}

export async function setProjectPermissions(
  userId: string,
  projectRef: string,
  orgSlug: string,
  level: ProjectPermissionLevel
) {
  await adminQuery(
    `insert into public.project_permissions(user_id,project_ref,org_slug,level,consent_version)
    values ($1,$2,$3,$4,$5) on conflict (user_id,project_ref) do update set org_slug=excluded.org_slug,
    level=excluded.level, consent_version=excluded.consent_version, updated_at=now()`,
    [userId, projectRef, orgSlug, level, ASSISTANT_CONSENT_VERSION]
  )
}
