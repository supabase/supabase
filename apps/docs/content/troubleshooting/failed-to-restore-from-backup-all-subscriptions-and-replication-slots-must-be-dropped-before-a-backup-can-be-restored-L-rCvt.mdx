---
title = "Failed to restore from backup: All subscriptions and replication slots must be dropped before a backup can be restored."
github_url = "https://github.com/orgs/supabase/discussions/21830"
date_created = "2024-03-07T02:47:01+00:00"
topics = [ "database" ]
keywords = [ "backup", "restore", "replication", "subscription" ]
database_id = "aa5fda82-5838-4975-b0ac-ba4d7fb9e638"

[[errors]]
message = "All subscriptions and replication slots must be dropped before a backup can be restored."
---

As the error suggests, you must first drop any current subscriptions or replication slots to restore backups.

You can check those with:

```
SELECT * FROM pg_replication_slots;

SELECT * FROM pg_subscription;
```

You can drop them with:

```
DROP SUBSCRIPTION <subscription>;

SELECT pg_drop_replication_slot(slot_name);
```

NOTE: These are destructive actions. This is fine since you will overwrite your database with a backup.
