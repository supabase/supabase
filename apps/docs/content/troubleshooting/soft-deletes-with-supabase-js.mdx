---
title = "Implementing soft deletes with supabase-js"
topics = []
keywords = [ "supabase-js", "sdk", "javascript" ]
github_url = "https://github.com/orgs/supabase/discussions/32523"
database_id = "c1ca57fb-91ab-4526-987b-65106dc63a2f"
---

When building modern applications, soft deletes are a common feature that lets you "delete" data while retaining it for potential recovery or historical tracking. This is especially useful in audit trails or when accidental deletions need undoing. Supabase makes this process seamless with Postgres views and the supabase-js library.

In this post, we’ll show how to implement soft deletes using Supabase and how to use Postgres views to manage your data efficiently.

## What are soft deletes?

Soft deletes don’t remove a record from the database. Instead, they mark it as "deleted" by updating a specific column, often named `deleted_at`, with a timestamp. This keeps the data in the database but excludes it from most queries unless explicitly required.

## Step 1: Add the `deleted_at` column

To implement soft deletes, start by adding a `deleted_at` column to your table.

Run this SQL in your Supabase SQL editor:

```sql
alter table items
add column deleted_at timestamptz;
```

This column will store the timestamp when a record is "deleted."

## Step 2: Create a view for active records

To ensure you only fetch non-deleted records by default, create a Postgres view that filters out rows where `deleted_at` is not null.

```sql
create view active_items as
  select *
  from items
  where deleted_at is null;
```

With this view, you can now query `active_items` instead of `items` to get only active (non-deleted) rows.

## Step 3: Soft delete a record

Instead of deleting a record, update its `deleted_at` column with the current timestamp. Using `supabase-js`, it looks like this:

```javascript
await supabase.from('items').update({ deleted_at: new Date().toISOString() }).eq('id', 123)
```

This sets the `deleted_at` column for the item with `id` 123.

## Step 4: Query active records

To fetch only non-deleted rows, query the `active_items` view instead of the `items` table. Here's how you do it with `supabase-js`:

```javascript
const { data, error } = await supabase
  .from('active_items') // Query the view, not the table
  .select('*')

if (error) console.error('Error fetching active items:', error)
else console.log('Active items:', data)
```

## Step 5: Restore a soft-deleted record (optional)

To "restore" a soft-deleted record, set the `deleted_at` column back to `null`:

```javascript
await supabase.from('items').update({ deleted_at: null }).eq('id', 123)
```

This effectively un-deletes the record.

## Benefits of using views for soft deletes

- **Cleaner Queries:** No need to add `WHERE deleted_at IS NULL` to every query. Just query the view (`active_items`).
- **Separation of Concerns:** Views abstract the logic of filtering deleted records from your application code.
- **Efficiency:** Postgres handles the filtering in the view, reducing the complexity in your app.

## Full example with supabase-js

Here’s a complete example of implementing soft deletes with `supabase-js`:

```javascript
// 1. Soft delete an item
await supabase.from('items').update({ deleted_at: new Date().toISOString() }).eq('id', 123)

// 2. Query active (non-deleted) items
const { data, error } = await supabase
  .from('active_items') // Query the view, not the table
  .select('*')

if (error) console.error('Error fetching active items:', error)
else console.log('Active items:', data)

// 3. Restore a soft-deleted item
await supabase.from('items').update({ deleted_at: null }).eq('id', 123)
```

---

## Conclusion

Soft deletes are easy to implement with Supabase and Postgres. By combining a `deleted_at` column with views, you can cleanly separate active and deleted records, keeping your application logic simple and maintainable.

This approach provides the flexibility of retaining data for audits or recovery while keeping your app's interface clean and efficient. Start using soft deletes in your Supabase projects today!
