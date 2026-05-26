# Multi-tenant RBAC template

Organization-scoped authorization for SaaS applications. Membership in an organization assigns a role, roles grant permissions, and RLS policies call `authorize(organization_id, permission)`.

## Includes

- Organizations and organization memberships
- Organization-scoped roles and permissions
- `create_organization()` bootstrap helper
- `authorize()` helper for tenant-aware RLS policies
- Example `projects` table with scalable tenant policies

## Dependencies

Requires **database** and **auth**.
