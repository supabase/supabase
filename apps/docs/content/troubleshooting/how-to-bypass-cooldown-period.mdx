---
title = "How to bypass cooldown period"
topics = [
"platform"
]
keywords = ["cooldown", "disk resize"]
database_id = "ab90c813-6152-4dad-86f7-937d799ca123"
---

This cooldown period isn't a Supabase limitation. It's rooted in how Amazon EBS (the underlying storage instance for our databases) manages volume modifications. After modifying a volume (e.g. increasing size, changing type, or IOPS), AWS enforces a mandatory 6-hour cooldown before allowing another modification on the same volume. This is to ensure data integrity and stability of the volume under load.

From the [**AWS docs**](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_ModifyVolume.html):

> “After modifying a volume, you must wait at least six hours and ensure that the volume is in the in-use or available state before you can modify the same volume. This is sometimes referred to as a cooldown period.”

There are a few options to work around the cooldown, depending on the state of your database:

1.  **Restore to a new project**: This spins up a new instance with a new disk, bypassing the cooldown entirely. It’s a great option if you're okay with a new project and project refactoring. [**Docs: restoring to a new project**](/docs/guides/platform/backups#restore-to-a-new-project).
2.  **pg_upgrade**: Our [**pg_upgrade**](/docs/guides/platform/upgrading) implementation migrates your data to a new disk, which skips the cooldown. The main requirement here is that the database must be operational - it can't run it if your DB is in a degraded or inaccessible state.
3.  **Pause and Restore**: This also migrates to a new disk but is only available for projects on the Free plan. If you're not on the Free plan, you'd need to [**transfer your project to an organization on the Free plan**](/docs/guides/platform/project-transfer) first.

If the database is down or locked in a bad state (e.g corrupted or stuck during resize), the only path forward is to wait until the cooldown expires and the disk resize job completes in the queue.

More on this in our doc here: [**https://supabase.com/docs/guides/platform/database-size#disk-size**](/docs/guides/platform/database-size#disk-size).
