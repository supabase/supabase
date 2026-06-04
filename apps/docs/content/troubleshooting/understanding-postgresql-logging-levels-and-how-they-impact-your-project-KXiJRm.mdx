---
title = "Understanding Postgres Logging Levels and How They Impact Your Project"
github_url = "https://github.com/orgs/supabase/discussions/29877"
date_created = "2024-10-14T09:17:02+00:00"
topics = [ "database" ]
keywords = [ "logging", "disk", "i/o", "lockups" ]
database_id = "10186830-8cce-4f10-8cb9-7cbf39310763"
---

Since each Supabase project uses Postgres as its underlying database engine, it’s common to adjust logging settings for various reasons—whether for debugging issues, monitoring database performance, or auditing actions. However, modifying logging levels improperly can lead to an excessive amount of log data being generated, which can quickly fill up your disk space and cause significant performance degradation or even system failure.

### 1. Overview of Postgres logging levels

Postgres provides multiple logging levels that allow you to control how much information gets logged. These include:

| Log Level | Description                                                                                                           |
| --------- | --------------------------------------------------------------------------------------------------------------------- |
| DEBUG1-5  | Logs very detailed information about the operations of the database, useful only for deep debugging.                  |
| INFO      | Logs information about routine database operations that aren’t necessarily errors but may still be relevant to track. |
| NOTICE    | Logs messages that are not errors but may still be noteworthy.                                                        |
| WARNING   | Logs warnings, which indicate issues that don’t prevent execution but could cause problems later.                     |
| ERROR     | Logs errors that cause statements to fail.                                                                            |
| LOG       | Logs general messages such as startup, shutdown, or checkpoints.                                                      |
| FATAL     | Logs errors that cause the database session to fail.                                                                  |
| PANIC     | Logs critical issues that force the database to shut down.                                                            |

Each of these log levels is useful in specific situations. Here's an example of what messages tagged with each severity level look like:

```
DEBUG:  server process (PID 12345) exited with exit code 0
INFO:  vacuuming "example_schema.public.example_table"
NOTICE:  identifier "very_very_very_long_table_name_exceeding_63_characters" will be truncated to "very_very_very_long_table_name_exceedin"
WARNING:  SET LOCAL can only be used in transaction blocks
LOG:  statement: UPDATE example_table SET column_name = 'Example Value' WHERE id = 10;
ERROR:  relation "exam" does not exist at character 7
FATAL:  role "admin" does not exist
PANIC: database system shutdown requested
```

The default log level is set to **WARNING** through the log_min_messages setting, and we recommend keeping it that way.

### 2. How high log levels can affect your database

When users alter a high level of log settings, the database can start generating an overwhelming number of log entries. This can quickly escalate to issues such as:

- Disk Space Exhaustion: Log files can grow exponentially if verbose levels like DEBUG, INFO, or NOTICE are enabled for long periods. And running out of disk space due to log bloat can cause your database to stop accepting writes and slow down query performance.

- I/O Overload: Writing too many logs increases input/output (I/O) operations, which can negatively impact database speed. A database bogged down by heavy logging will take longer to process requests, leading to slower application performance.

- Database Lockups: In extreme cases, if the disk is filled to capacity with logs, your database could lock up, leading to downtime or severe performance degradation.

### 3. Common scenarios that cause log overload

Here are a few common scenarios where excessive logging can become a problem:

- Extended Use of DEBUG Logging: While useful for troubleshooting, leaving DEBUG logging enabled for a long period can lead to the accumulation of massive amounts of logs.

- Setting INFO for Monitoring: Logging INFO can be helpful for tracking general database activity, but if left on indefinitely, it can still result in a lot of noise and unnecessary log growth.

- Frequent Write Operations: If your database processes a lot of write operations (such as inserts, updates, or deletes), even low-level logs (like NOTICE or INFO) can lead to significant log accumulation.

### 4. How to manage Postgres log levels effectively

**a. Choose the Right Log Level**
For most users, setting Postgres logs to WARNING or ERROR is sufficient for regular operations. Here’s a general guideline:

- WARNING: Use this level for general logging during normal operations. It captures issues that may not be critical but are worth paying attention to.

- ERROR: This level is ideal for production environments. It logs only failures that prevent queries from being executed, reducing log noise significantly.

- DEBUG, INFO, or NOTICE: Use these levels sparingly and only for short-term debugging or diagnostics. Always remember to revert the setting once you've collected the necessary information.

**b. How to Adjust Log Levels**
You can adjust log levels using SQL commands in the SQL Editor or any connected Postgres client:

- To check the current log level:

```
SHOW log_min_messages;
```

- To set the log level to WARNING (recommended default):

```
ALTER ROLE postgres SET log_min_messages TO 'WARNING';
```

- To set the log level to ERROR:

```
ALTER ROLE postgres SET log_min_messages TO 'ERROR';
```

- To reset to the default level:

```
ALTER ROLE postgres RESET log_min_messages;
```

### 5. Conclusion

Postgres logs provide a powerful way to gain valuable insights into your database activity and performance when properly configured, but the key lies in finding the right balance. When set up properly, they can be incredibly useful.

### 6. Other resources

**a. What Events Are Logged in Postgres**
For a detailed explanation of the types of events logged in your database (such as connection events, checkpoint events, long-running queries, cron jobs, and severity-based logging), you can refer to the official documentation here:

[What Events Are Logged in Supabase](https://gist.github.com/TheOtherBrian1/991d32c2b00dbc75d29b80d4cdf41aa7)

**b. PGAudit: Postgres Auditing for Compliance and Security**

We support PGAudit extension, which extends Postgres’s built-in logging capabilities to track database activities for auditing purposes.

[How to Enable the PGAudit Extension](/docs/guides/database/extensions/pgaudit?queryGroups=database-method&database-method=dashboard#enable-the-extension)

For detailed configuration instructions and logging options, refer to the complete documentation: [PGAudit Configuration Guide](/docs/guides/database/extensions/pgaudit?queryGroups=database-method&database-method=dashboard#configure-the-extension)

**c. Debugging Functions**
For more information on how to debug functions in Supabase, refer to the official guide: [Debugging Functions](/docs/guides/database/functions?queryGroups=language&language=js#debugging-functions).
