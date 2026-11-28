# Templates

Starter apps listed in the [templates gallery](../../apps/templates). Each folder is a standalone app: clone it, create a Supabase project from its `supabase/` folder, and deploy it to Vercel. Each template's README has the steps.

| Template                           | Supabase features                                       |
| ---------------------------------- | ------------------------------------------------------- |
| [Kanban Board](./kanban)           | Database, Auth, Realtime                                |
| [Photo Wall](./photo-wall)         | Storage, image transformations, Cron, Edge Functions    |
| [Uptime Monitor](./uptime-monitor) | Cron, Queues, Edge Functions, Realtime                  |
| [YourMind](./yourmind)             | Vectors (pgvector), Edge Functions with gte-small, Storage |
| [Waitlisted](./waitlist)           | Database, Auth, Realtime Broadcast from the database    |

All of them use anonymous sign-ins and light and dark themes that follow the system setting. The ones with live, per-row data (all but Waitlisted) use TanStack DB through `@supabase-labs/tanstack-db`.

## Running the public demos

The gallery embeds a live deployment of each template. Anyone can use them, so the demo projects have a few extra settings that a normal project made from the template doesn't need.

**Content stays private by default.** Every visitor signs in as their own guest (anonymous) user, and row level security limits each one to their own data. A visitor only sees someone else's content if they're sent that board's or wall's invite link. One exception: Photo Wall serves photos from a public bucket, so anyone who has a photo's URL can open that file, even without the wall's invite link. YourMind and Uptime Monitor have no sharing at all, and Waitlisted only shows other people as initials on its leaderboard.

**Guest data is purged nightly.** Each demo project deletes guest users more than a day old, which removes everything they created:

- Kanban, Uptime Monitor and Waitlisted: a Cron job deletes the users directly. Their data is removed through `on delete cascade`.

  ```sql
  select cron.schedule('demo-purge-guests', '30 3 * * *',
    $$ delete from auth.users where is_anonymous and created_at < now() - interval '1 day' $$);
  ```

- Photo Wall and YourMind store files, which have to be removed through the Storage API. Their `cleanup` Edge Function does this when `PURGE_GUEST_DAYS` is set (`supabase secrets set PURGE_GUEST_DAYS=1`). Photo Wall's nightly job already calls it. For YourMind, schedule the call with the same `net.http_post` pattern used in Photo Wall's migration.

**Other demo limits:**

- Photo Wall: `RETENTION_DAYS=1`, so every photo is deleted after a day even if its uploader is still around.
- Uptime Monitor: `private.allowed_hosts` lists the only hosts visitors can monitor.

**Removing something right away.** To take down one person's content (for example, something offensive on a shared board), find the row's `created_by` (the user's id) and delete that user in the dashboard under Authentication → Users. Their boards, walls and items go with them, and Kanban, Uptime Monitor and Waitlisted need nothing else.

For **Photo Wall**, remove the files first, or deleting the user leaves them at public URLs. That means every photo on walls the user created (including other members' uploads, since those walls are deleted too) and their own uploads on other walls:

```sql
select path from public.photos
where wall_id in (select id from public.walls where created_by = '<user id>')
   or created_by = '<user id>';
```

Delete those paths from the `photos` bucket (Storage in the dashboard, or `supabase.storage.from('photos').remove(paths)` with the secret key), then delete the user. For **YourMind**, delete the user's folder (`<user id>/`) in the `minds` bucket first.

To wipe every guest at once, run the delete above with `interval '0 seconds'` (Kanban, Uptime Monitor and Waitlisted), or set `PURGE_GUEST_DAYS=0.0001` and call the project's `cleanup` function (Photo Wall and YourMind), which removes files in the right order. Either way, guests who sign in while it runs (or, with `0.0001`, in the last few seconds before it) are kept, so check Authentication → Users afterwards and run it again if anyone is left. To be sure nobody slips in, turn off anonymous sign-ins first. When you're done, set `PURGE_GUEST_DAYS` back to its previous value (`1` on the public demos) before turning anonymous sign-ins back on, so the nightly run doesn't delete new guests with the tiny cutoff.
