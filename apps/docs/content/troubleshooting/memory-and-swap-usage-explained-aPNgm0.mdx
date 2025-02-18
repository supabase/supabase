---
title = "Memory and Swap usage explained"
github_url = "https://github.com/orgs/supabase/discussions/21460"
date_created = "2024-02-22T19:01:27+00:00"
topics = [ "database", "platform" ]
keywords = [ "memory", "swap", "ram", "disk", "IO" ]
database_id = "43b62743-252c-4069-a719-0c0737839fd9"
---

## Understanding swap and memory usage

- Swap is part of Linux's tiered memory system
- Serves as a backup memory space when RAM is limited.
- System prioritizes keeping actively used data in RAM
- Data is temporarily cached in memory for quick access
- Swap is used for less frequently accessed or non-critical data
- Default swappiness value of 60 indicates the system's preference to fill up swap for performance benefits

## Compute instance configuration

- Default swappiness: 60 (out of 100)
  - Determines how aggressively the system moves data from RAM to swap
  - Default value in Linux distributions
  - Changing the swappiness value significantly impacts system behavior, as it is a non-linear value. A small adjustment of 10 can result in a very different system behavior
- Swap provision: 1024MB on every compute instance

## Issues with high swap usage

- When swap reaches its limits, the system faces decisions:
  1. Evict cached memory from swap, which affects disk performance
  2. Evict cached memory from the system's memory cache, leading to increased disk accesses
  3. Access the disk directly without caching, resulting in more frequent disk reads
- Swap usage reaching limits indicates running out of free memory

## Disk balance and AWS limits

- Each project has a baseline 'balance replenishment rate'
- The replenishment rate is higher on greater AWS instances
- Disk IO usage below replenishment rate keeps balance at 99%
- Disk IO usage above replenishment rate decreases balance
- Balance increases when IO usage is below replenishment rate
- AWS does not export relevant metrics for tracking IO usage

## Monitoring recommendations

- Monitor memory usage:
  - If usage is over 85% and swap usage is over 90% for an extended period, optimize database access or add more resources
- Monitor CPU IOWait usage and disk IO metrics:
  - Exported metrics here: **https://github.com/supabase/grafana-agent-fly-example/blob/main/metrics.md**
  - Key metrics to track excessive disk IO usage include:
    - `node_disk_reads_completed_total`: Tracks the total number of completed disk reads.
    - `node_disk_io_time_seconds_total`: Measures the total time spent on disk IO operations.
    - `node_disk_io_now`: Indicates the current disk IO operations.
  - Differentiate system and data disks using the 'device' label
    - System disk: `{device="nvme0n1"}` (contains swap)
    - Data disk: `{device="nvme1n1"}` (dedicated to Postgres data)
