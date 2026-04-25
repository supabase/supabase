---
title = "High Disk I/O"
topics = [ "platform" ]
keywords = [ "I/O", "disk", "performance" ]
database_id = "4844905d-1456-44a1-858e-7a4995e5054c"
---

## Understanding disk IO and disk IO budget

Disk IO refers to two metrics: throughput in Megabytes per second (MB/s) and IOPS which are Input/Output Operations per Second. Throughput measures how much data you can move each second, while IOPS measures how many read/write operations you can perform each second. Depending on the compute add-on of your instance you will have [different baseline performances](/docs/guides/platform/compute-add-ons#compute-size).

Smaller compute instances can burst and exceed their baseline performance for a short period of time every day. This is represented as your Disk IO Budget and once your Disk IO Budget is consumed, your instance reverts back to its baseline performance. Learn more about [choosing the right compute instance for consistent disk performance](/docs/guides/platform/compute-add-ons#choosing-the-right-compute-instance-for-consistent-disk-performance).

## Depleting your disk IO budget

Running out of Disk IO Budget means that your instance is using more disk than its compute add-on can handle and essentially gets throttled. This could have a wide range of implications:

- Response times on requests can increase noticeably
- CPU usage rises noticeably due to IO wait
- Disruption of [daily backup](/docs/guides/platform/backups#daily-backups) routines
- Disruption of internal Postgres processes such as [autovacuuming](/docs/guides/platform/database-size#vacuum-operations)
- Your instance may become unresponsive

## Monitor your disk IO budget

To check your Disk IO Budget on the Supabase Platform, head over to [Database Health in the Observability section](/dashboard/project/_/observability/database).

It is also possible to monitor your resources and set up alerts using Prometheus/Grafana. With Grafana you will be able to pinpoint potential causes and see more fine-grained metrics like how much of your RAM is used for caching and your Swap usage. Read the [Metrics Guide](/docs/guides/platform/metrics) to learn more.

## Common reasons for high disk IO usage

Most operations on your Supabase project require disk IO in some form. Hence, there can be many reasons for high disk IO usage. Here are some common ones:

- **High Memory Usage:** Every Supabase project has 1GB of disk allocated for swapping. When your memory usage is high, the operating system might frequently move parts of the memory back and forth of the swap space on the disk.
- **Low Cache Usage:** If your cache hit rate is low, many of your database requests might go straight to the disk. Go to the [Cache Hit Rate Guide](/docs/guides/platform/performance#hit-rate) to learn more.
- **Query performance:** Queries that take a long time to complete (>1 second) could be using your disk inefficiently. Check our guide on [examining query performance](/docs/guides/platform/performance#examining-query-performance).
- **High popularity:** Congrats! Your side project turned out to be a real success and is getting more requests than it can handle.

## How to fix

1. **Upgrade your compute:** You can get a Compute Add-on for your project. Larger compute options (4XL and above) have more consistent disk performance. See your [upgrade options](/dashboard/project/_/settings/compute-and-disk) by selecting your project. Do reference the [different baseline performances](/docs/guides/platform/compute-add-ons#compute-size) that come with larger Compute Add-ons.
2. **Optimize performance:** Get more out of your instance's resources by optimizing your usage. Have a look at our [performance tuning guide](/docs/guides/platform/performance#examining-query-performance) and our [production readiness guide](/docs/guides/platform/going-into-prod#performance).
