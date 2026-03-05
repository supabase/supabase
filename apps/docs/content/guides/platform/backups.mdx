---
title: 'Database Backups'
description: 'Learn about backups for your Supabase project.'
---

We automatically back up all Free, Pro, Team, and Enterprise Plan projects on a daily basis. You can find backups in the [**Database** > **Backups**](/dashboard/project/_/database/backups/scheduled) section of the Dashboard.

Pro Plan projects can access the last 7 days of daily backups. Team Plan projects can access the last 14 days of daily backups, while Enterprise Plan projects can access up to 30 days of daily backups. If you need more frequent backups, consider enabling [Point-in-Time Recovery](#point-in-time-recovery). We recommend that free tier plan projects regularly export their data using the [Supabase CLI `db dump` command](/docs/reference/cli/supabase-db-dump) and maintain off-site backups.

<Admonition type="caution">

When you delete a project, we permanently remove all associated data, including any backups stored in S3. This action is irreversible, so consider it carefully before proceeding.

</Admonition>

<Admonition type="caution">

For security purposes, daily backups do not store passwords for custom roles, and you will not find them in downloadable files. If you restore from a daily backup and use custom roles, you will need to reset their passwords after the restoration completes.

</Admonition>

<Admonition type="note">

Database backups do not include objects you store via the Storage API, as the database only includes metadata about these objects. Restoring an old backup does not restore objects you deleted after that backup.

</Admonition>

## Backup and restore process

You can access daily backups in the [**Database** > **Backups**](/dashboard/project/_/database/backups/scheduled) section of the Dashboard and restore a project to any of the backups.

You can restore your project to any of the backups. To generate a logical backup yourself, use the [Supabase CLI `db dump` command](/docs/reference/cli/supabase-db-dump).

## Managing backups programmatically

You can also manage backups programmatically [using the Management API](/docs/reference/api/v1-list-all-backups):

```bash
# Get your access token from https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-access-token"
export PROJECT_REF="your-project-ref"

# List all available backups
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/backups"

# Restore from a PITR backup (replace Unix timestamp with desired restore point)
curl -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/backups/restore-pitr" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recovery_time_target_unix": "1735689600"
  }'
```

### Restoration process

When selecting a backup to restore to, choose the closest available backup made before your desired restore point. You can always choose earlier backups, but consider how many days of data you might lose.

The Dashboard prompts you for confirmation before proceeding with the restoration. The project is inaccessible during this process, so plan for downtime beforehand. Downtime depends on the size of the database—the larger it is, the longer the downtime will be.

After you confirm, we trigger the process to restore the desired backup data to your project. The dashboard will display a notification once the restoration completes.

If your project uses subscriptions or replication slots, you need to drop them before the restoration and re-create them afterwards. We exempt the slot used by Realtime from this requirement and handle it automatically.

{/* screenshot of the Dashboard of the project completing restoration */}

## Point-in-Time recovery

Point-in-Time Recovery (PITR) allows you to back up a project at shorter intervals, giving you the option to restore to any chosen point with up to seconds of granularity. Even with daily backups, you could still lose a day's worth of data. With PITR, you can back up to the point of disaster.

<Admonition type="note">

Pro, Team and Enterprise Plan projects can enable PITR as an add-on.

Projects that want to use PITR must also use at least a Small compute add-on to ensure smooth functioning.

</Admonition>

<Accordion
  type="default"
  openBehaviour="multiple"
  chevronAlign="right"
  justified
  size="medium"
  className="text-foreground-light mt-8 mb-6"
>
  <div className="border-b mt-3 pb-3">
    <AccordionItem
      header="How PITR works"
      id="item-1"
    >

    As [covered in this blog post](/blog/postgresql-physical-logical-backups), a combination of physical backups and [Write Ahead Log (WAL)](https://www.postgresql.org/docs/current/wal-intro.html) file archiving makes PITR possible. Physical backups provide a snapshot of the underlying directory of the database, while WAL files contain records of every change the database processes.

    We use [WAL-G](https://github.com/wal-g/wal-g), an open source archival and restoration tool, to handle both aspects of PITR. Daily, we take a snapshot of the database and send it to our storage servers. Throughout the day, as database transactions occur, we generate and upload WAL files.

    By default, we back up WAL files at two-minute intervals. If these files exceed a certain file size threshold, we back them up immediately. During periods of high transaction volume, WAL file backups therefore become more frequent. Conversely, when the database has no activity, we do not make WAL file backups. Overall, in the worst case scenario, PITR achieves a Recovery Point Objective (RPO) of two minutes.

    </AccordionItem>

  </div>
</Accordion>

<Admonition type="note">

If you enable PITR, we will no longer take Daily Backups. PITR provides finer granularity than Daily Backups, so running both is unnecessary.

</Admonition>

### Backup process

![PITR dashboard](/docs/img/backups-pitr-dashboard.png)

You can access PITR in the [Point in Time](/dashboard/project/_/database/backups/pitr) settings in the Dashboard. The recovery period of a project is shown by the earliest and latest recovery points displayed in your preferred timezone. You can change the maximum recovery period if needed.

The latest restore point of the project could be significantly behind the current time. This occurs when the database has had no recent activity, and therefore we have not made any recent WAL file backups. However, the state of the database at the latest recovery point still reflects the current state of the database, given that no transactions have occurred in between.

### Restoration process

![PITR: Calendar view](/docs/img/backups-pitr-calendar-view.png)

A date and time picker appears when you click the **Start a restore** button. The process only proceeds if the selected date and time fall within the earliest and latest recovery points.

![PITR: Confirmation modal](/docs/img/backups-pitr-confirmation-modal.png)

After selecting your desired recovery point, the Dashboard prompts you to review and confirm before proceeding with the restoration. The project is inaccessible during this process, so plan for downtime beforehand. Downtime depends on the size of the database—the larger it is, the longer the downtime will be. After you confirm, we download the latest available physical backup to the project and partially restore the database. We then download the WAL files generated after this physical backup up to your specified point in time. We replay the underlying transaction records in these files against the database to complete the restoration. The Dashboard will display a notification once the restoration completes.

<$Show if="billing:all">
<$Partial path="billing/pricing/pricing_pitr.mdx" />
</$Show>

### Downloading backups after disabling PITR

When you disable PITR, we still take all new backups as physical backups only. You can still use physical backups for restoration, but they are not available for direct download. If you need to download a backup after disabling PITR, you need to take a manual [legacy logical backup using the Supabase CLI or pg_dump](/docs/guides/platform/migrating-within-supabase/backup-restore#backup-database-using-the-cli).

## Restore to a new project

See the [Duplicate Project docs](/docs/guides/platform/clone-project).
