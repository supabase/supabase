---
title = "High CPU and Slow Queries with `ERROR: must be a superuser to terminate superuser process`"
topics = [ "cli", "database", "storage" ]
keywords = []
database_id = "23668386-7a72-44ff-a412-4cd8a005fa18"
---

When facing high CPU utilization, slow query performance, and an `ERROR: must be a superuser to terminate superuser process` message regarding an autovacuum, it indicates that a critical, non-terminable autovacuum operation is running on your Postgres database. This guide explains why this happens and what steps you can take.

### **Core Postgres concepts**

To understand this issue, it's essential to grasp a few core Postgres concepts:

**What is MVCC (Multi-Version Concurrency Control)?**
Postgres uses MVCC, which allows multiple transactions to access the same data simultaneously without locking each other out. Instead of updating a row in place, Postgres creates a new version of the row whenever data is modified or deleted. The old version remains, accessible to other transactions that started before the change.

**What are Dead Tuples?**
The old versions of rows, which are no longer visible to any active transactions, are called "dead tuples" (or dead rows). These dead tuples consume disk space and can degrade performance if not cleaned up.

**What is Autovacuum?**
Autovacuum is a set of background processes in Postgres designed to automatically reclaim storage occupied by dead tuples and update statistics for the query planner. It runs automatically when the number of dead tuples in a table crosses a certain configurable threshold (e.g., a percentage of the table's total rows, such as 20% in some default configurations).

**What is Transaction ID (XID) Wraparound?**
Every transaction in Postgres is assigned a unique Transaction ID (XID). These XIDs are 32-bit integers, meaning there's a finite number of them (around 4 billion). If the database continuously creates new transactions without old ones being "frozen" (marked as permanently visible), the XIDs can eventually "wrap around" – meaning new transactions will be assigned XIDs that are numerically smaller than very old, still-active transactions. This makes it impossible for the database to determine which rows are visible and which are not, leading to potential data corruption and rendering the database unusable.

To prevent this critical issue, Postgres initiates a special autovacuum operation: the **"wraparound prevention vacuum."**

### **Understanding the problem: A critical autovacuum**

When you encounter the `ERROR: must be a superuser to terminate superuser process` associated with an autovacuum marked "to prevent wraparound," it signifies that this mandatory, system-critical operation is underway.

**Symptoms and Cause:**

- **High Resource Utilization:** You'll typically observe high CPU utilization (e.g., approaching 100%) and elevated Disk I/O, as the autovacuum process scans and cleans millions of rows. Memory usually remains stable.
- **Slow Queries:** With resources heavily consumed by the autovacuum, other database queries will become significantly slower, potentially leading to application downtime.
- **Non-Terminable Process:** Due to its vital role in preventing data corruption, a wraparound prevention autovacuum cannot be terminated, even by a superuser. Attempting to stop it will result in the `ERROR: must be a superuser to terminate superuser process` message (or the database immediately restarting it). It _must_ be allowed to complete.

**Why is it running?**
This situation often arises in large, high-write tables (e.g., `your_table`, which might be hundreds of GBs in size and contain hundreds of millions of rows) that accumulate dead tuples rapidly. When the transaction ID age of the table approaches a critical threshold, Postgres automatically triggers this emergency autovacuum. For instance, if a table has millions of rows and over a million dead rows, exceeding its configured `autovacuum_vacuum_scale_factor` (e.g., 0.2), a regular autovacuum might initiate. However, if the XID age continues to increase, the system prioritizes the wraparound prevention vacuum to safeguard data integrity.

### **Mitigating performance impact during a critical autovacuum**

Since the wraparound prevention autovacuum cannot be stopped, the best approach is to provide the database with sufficient resources to complete the operation as quickly and efficiently as possible.

1.  **Upgrade your Database Compute Instance:**

    - **Action:** Temporarily scale up your instance's CPU (e.g., from `m6g.4xlarge` to `m6g.8xlarge` or higher).
    - **Why it helps:** More CPU cores and processing power will help the autovacuum operation run faster, reducing the overall time it impacts your database.
    - **Considerations:** This usually causes a brief downtime (typically 1-2 minutes) as the instance restarts. However, the autovacuum process is designed to pause and resume automatically.

2.  **Increase Disk Throughput/IOPS:**
    - **Action:** If disk I/O utilization is also consistently high (e.g., near 100%), consider temporarily increasing your disk's provisioned IOPS and throughput.
    - **Why it helps:** Autovacuum is an I/O-intensive operation, involving a lot of reading and writing. Higher disk performance can significantly speed up the process.
    - **Considerations:** Cloud providers often have limitations, such as a cooldown period (e.g., 4 hours) between disk modification operations.

### **Monitoring progress and future prevention**

**Monitoring the Current Autovacuum:**
You can monitor the progress of the active autovacuum processes using the `pg_stat_progress_vacuum` view:

```sql
SELECT relid::regclass AS table, round(100.0 * heap_blks_scanned / heap_blks_total, 2) AS pct_scanned FROM pg_stat_progress_vacuum;
```

This query will show the percentage of the table that has been scanned by the vacuum process. Once the `pct_scanned` reaches 100% for the critical table, the operation is largely complete, and resource usage should normalize. After it finishes, you can consider downgrading your instance and disk resources back to their original configuration.

**Preventive Measures for the Future:**
To avoid future emergency wraparound vacuums, especially on high-read/write tables:

- **Monitor Dead Rows:** Regularly check the number of dead rows in your tables. You can use the following SQL query:

  ```sql
  select relname, n_live_tup, n_dead_tup, last_autovacuum
  from pg_stat_all_tables
  where schemaname = 'public'
  order by n_dead_tup desc
  limit 10;
  ```

  Or, if using Supabase CLI, you can run: `supabase db inspect bloat`

  If a table consistently shows a high number of dead tuples (e.g., hundreds of millions of live rows with still a significant number of dead tuples even after a vacuum), it's a good indicator that proactive maintenance is needed.

- **Schedule Manual Vacuums:** For tables with heavy write activity, consider scheduling manual `VACUUM` or `VACUUM FULL` operations during off-peak hours to reclaim space and prevent XID age from becoming critical. `VACUUM FULL` is more aggressive but locks the table and rewrites the entire table, so it should be used with caution and planned downtime.

- **Adjust Autovacuum Settings:** For persistently problematic tables, your database team may need to adjust autovacuum parameters (like `autovacuum_vacuum_scale_factor`, `autovacuum_vacuum_threshold`, or `autovacuum_freeze_max_age`) to make autovacuum more aggressive or trigger earlier, preventing XID age from reaching critical levels.
