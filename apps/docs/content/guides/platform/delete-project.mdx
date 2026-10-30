---
title: Deleting Your Project
subtitle: Understanding the permanent consequences and how to protect yourself
---

Deleting a Supabase project is a **permanent and irreversible action**. Before proceeding, understand the full scope of what will be deleted and take precautions to prevent accidental data loss.

<Admonition type="danger">

We cannot recover deleted projects. All data, backups, and configurations are permanently removed. Ensure you have exported all critical data or saved backups before proceeding to delete your project.

</Admonition>

## What gets deleted

When you delete a project, **all artifacts are permanently removed and you cannot recover them**.
Some of these artifacts includes (but are not limited to):

- **Database and all data**: Your entire Postgres database, including all tables, schemas, and records
- **Edge Functions**: All deployed Edge Functions and their source code are removed
- **Storage objects**: All files in Storage buckets are permanently deleted
- **Backups**: All automated backups and point-in-time recovery snapshots are inaccessible
- **Authentication data**: User accounts, sessions, and auth logs are removed
- **Real-time subscriptions**: All active subscriptions and configurations are cleared
- **API keys and credentials**: All project API keys, service role keys, and webhooks are invalidated
- **Custom domains and SSL certificates**: Any custom domains linked to the project are removed

## How to delete a project

You can delete a project through any of these methods:

### Via dashboard

1. Navigate to your project's [**Settings** > **General** > **Delete project**](/dashboard/project/qiuwhyoiycwkuobqirkr/settings/general#delete-project)
2. Click **Delete Project**
3. Enter your project name exactly as it appears to confirm
4. Review the confirmation dialog and click **Delete**

### Via Supabase CLI

```bash
supabase projects delete <project-ref>
```

For more information, see the [Supabase CLI documentation](/docs/reference/cli/supabase-projects-delete).

### Via management API

```bash
curl -X DELETE https://api.supabase.com/v1/projects/<project-ref> \
  -H "Authorization: Bearer <access-token>"
```

For more information, see the [Management API documentation](/docs/reference/api/v1-delete-a-project).

## After deletion

Once a project is deleted:

- Your project URL will no longer be accessible
- DNS records will be cleaned up (may take up to 24 hours to fully propagate)
- Billing for this project will stop immediately
- You cannot recover or restore the project

<Admonition type="note">

Deleting projects stops new usage from accumulating, but does not remove usage that already occurred during the current billing cycle. For quota-based limits, that usage still counts until the billing period resets.
See our [Fair Use Policy](/docs/guides/platform/billing-faq#fair-use-policy) for further details.

</Admonition>

## Alternative: Pause your project

If you're unsure about deletion, consider pausing your project instead:

<Admonition type="note">

Note: Only Free Projects can be paused at this time.

</Admonition>

- **Paused projects** stop incurring compute charges
- **Data is preserved** and can be accessed when you resume
- **Quick recovery** — Resume the project at any time without data loss

To pause a project, navigate to [**Settings** > **General** > **Project availability**](/dashboard/project/qiuwhyoiycwkuobqirkr/settings/general) and click **Pause Project**.

## Protective measures to consider

To safeguard against accidental deletion, consider the following:

### 1. Backup your database

You can backup your database by following the [backup and restore guide](/docs/guides/platform/migrating-within-supabase/backup-restore) provided.

If you are on the Pro, Team or Enterprise Plan, with legacy logical backups, you can download a copy from [your Supabase dashboard](/dashboard/project/_/database/backups/scheduled)

### 2. Download storage objects

- Back up all important files from Storage buckets
- Use the Supabase dashboard or API to download files in bulk
- Store in a secure location outside of Supabase

### 3. Document configuration

- Export Edge Function code and configurations from the dashboard
- Save authentication provider settings (OAuth, SAML, etc.)
- Document any custom database functions, triggers, or policies
- Record webhook configurations and integrations

### 4. Enable access controls

<Admonition type="caution">

Restrict who can delete projects within your organization to prevent accidental deletion by team members.
See [Access Controls](/docs/guides/platform/access-control)

</Admonition>

- Set up role-based access controls to limit deletion permissions
- Require multi-factor authentication (MFA) for sensitive operations
- Use the Supabase dashboard to configure team member permissions

### 5. Monitor project activity

- Enable audit logging to track who has access to your project
- Review and revoke unnecessary API keys before deletion
- Check for any scheduled jobs or integrations that depend on the project

## Need help?

If you're unsure about deletion or need assistance:

- Review this guide and the protection measures above
- Contact [Supabase support](/support) for guidance
- Consider reaching out to your team before deleting shared projects
