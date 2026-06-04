/** Mirrors `public.app_role` from the multi-tenant-rbac template. */
export type AppRole = 'owner' | 'admin' | 'member'

/** Mirrors `public.app_permission` from the multi-tenant-rbac template. */
export type AppPermission =
  | 'organizations.read'
  | 'organizations.update'
  | 'organizations.delete'
  | 'members.read'
  | 'members.invite'
  | 'members.update'
  | 'members.remove'
  | 'projects.read'
  | 'projects.create'
  | 'projects.update'
  | 'projects.delete'
