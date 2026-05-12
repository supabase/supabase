---
title = "Project Status reports unhealthy services"
topics = [ "database", "studio" ]
database_id = "357e90d6-58a7-4347-a6c0-00622fcf9c81"
---

![Unhealthy services in Project Status](/docs/img/troubleshooting/project-status-unhealthy-services.png)

If the project was recently restored, it can take up a couple minutes to become fully operational.

Services rely on the backend database. Unhealthy services can indicate a database being overloaded due to being undersized or not tuned appropriately.

- Review this [troubleshooting doc](/docs/guides/troubleshooting/failed-to-run-sql-query-connection-terminated-due-to-connection-timeout) to determine if it could be a resource issue.
- If services recover and become unhealthy again, there is likely a repeated issue overloading the database.

Possible resolutions:

- Restart the database in [Project Settings](/dashboard/project/_/settings/general) (this may be only a temporary fix if the project is undersized / unoptimized).
- Increase project resources in [Compute and Disk](/dashboard/project/_/settings/compute-and-disk).
- [Performance Tune](/docs/guides/platform/performance) the database.

The "Edge Functions Unhealthy" indicator is based on a platform-level health check, not the project's own functions. Confirm the actual functions work by invoking them directly. If functions are working fine, this is likely a false positive.

Check the following if only Edge Functions service reports unhealthy:

- Verify actual function behavior by invoking the edge function directly (e.g., via cURL with a CORS request). If it responds correctly, the health indicator is likely a false positive.
- Check invocation logs. Filter logs using the keyword `~"health"` to see if health check calls are failing and if any errors are presented.
- Restart the database in [Project Settings](/dashboard/project/_/settings/general). This has resolved the unhealthy state in some cases, particularly when it's a transient issue.
