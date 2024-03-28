// [Joshen] Directly from supabase/apps/docs/content/guides/platform/access-control.mdx
// We could put this into shared-data repository to ensure www and dashboard stays in sync

export const ROLES_ACCESS_MARKDOWN = `
| Permissions              | Owner         | Administrator   | Developer | Read only [^1] |
| ------------------------ | --------------| --------------- | ----------| ----------|
| **Organization**         |
| Change organization name | ✓ |   |   |   |
| Delete organization      | ✓ |   |   |   |
| **Members**              |
| Add an Owner             | ✓ |   |   |   |
| Remove an Owner          | ✓ |   |   |   |
| Add an Administrator     | ✓ | ✓ |   |   |
| Remove an Administrator  | ✓ | ✓ |   |   |
| Add a Developer          | ✓ | ✓ |   |   |
| Remove a Developer       | ✓ | ✓ |   |   |
| Revoke an invite         | ✓ | ✓ |   |   |
| Resend an invite         | ✓ | ✓ |   |   |
| Accept an invite [^2]    | ✓ | ✓ | ✓ |
| **Billing**              |
| Read invoices            | ✓ | ✓ | ✓ |   |
| Read billing email       | ✓ | ✓ | ✓ |   |
| Change billing email     | ✓ |   |   |   |
| View subscription        | ✓ | ✓ | ✓ |   |
| Update subscription      | ✓ | ✓ |   |   |
| Read billing address     | ✓ | ✓ | ✓ |   |
| Update billing address   | ✓ | ✓ |   |   |
| Read tax codes           | ✓ | ✓ | ✓ |   |
| Update tax codes         | ✓ | ✓ |   |   |
| Read payment methods     | ✓ | ✓ | ✓ |   |
| Update payment methods   | ✓ | ✓ |   |   |
| **Projects**             |
| Create a project         | ✓ | ✓ |   |   |
| Delete a project         | ✓ | ✓ |   |   |
| Update a project         | ✓ | ✓ |   |   |
| Pause a project          | ✓ | ✓ |   |   |
| Resume a project         | ✓ | ✓ |   |   |
| Restart a project        | ✓ | ✓ | ✓ |   |
| Manage tables            | ✓ | ✓ | ✓ |   |
| View Data                | ✓ | ✓ | ✓ | ✓[^3] |
`.trim()
