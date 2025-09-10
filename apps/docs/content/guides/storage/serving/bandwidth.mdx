---
id: 'storage-bandwidth'
title: 'Bandwidth & Storage Egress'
description: 'How to calculate the Bandwidth and Storage Egress'
subtitle: 'Bandwidth & Storage Egress'
sidebar_label: 'Bandwidth & Storage Egress'
---

## Bandwidth & Storage egress

Free Plan Organizations in Supabase have a limit of 10 GB of bandwidth (5 GB cached + 5 GB uncached). This limit is calculated by the sum of all the data transferred from the Supabase servers to the client. This includes all the data transferred from the database, storage, and functions.

### Checking Storage egress requests in Logs Explorer

We have a template query that you can use to get the number of requests for each object in [Logs Explorer](/dashboard/project/_/logs/explorer/templates).

```sql
select
  request.method as http_verb,
  request.path as filepath,
  (responseHeaders.cf_cache_status = 'HIT') as cached,
  count(*) as num_requests
from
  edge_logs
  cross join unnest(metadata) as metadata
  cross join unnest(metadata.request) as request
  cross join unnest(metadata.response) as response
  cross join unnest(response.headers) as responseHeaders
where
  (path like '%storage/v1/object/%' or path like '%storage/v1/render/%')
  and request.method = 'GET'
group by 1, 2, 3
order by num_requests desc
limit 100;
```

Example of the output:

```json
[
  {
    "filepath": "/storage/v1/object/sign/large%20bucket/20230902_200037.gif",
    "http_verb": "GET",
    "cached": true,
    "num_requests": 100
  },
  {
    "filepath": "/storage/v1/object/public/demob/Sports/volleyball.png",
    "http_verb": "GET",
    "cached": false,
    "num_requests": 168
  }
]
```

### Calculating egress

If you already know the size of those files, you can calculate the egress by multiplying the number of requests by the size of the file.
You can also get the size of the file with the following cURL:

```bash
curl -s -w "%{size_download}\n" -o /dev/null "https://my_project.supabase.co/storage/v1/object/large%20bucket/20230902_200037.gif"
```

This will return the size of the file in bytes.
For this example, let's say that `20230902_200037.gif` has a file size of 3 megabytes and `volleyball.png` has a file size of 570 kilobytes.

Now, we have to sum all the egress for all the files to get the total egress:

```
100 * 3MB = 300MB
168 * 570KB = 95.76MB
Total Egress = 395.76MB
```

You can see that these values can get quite large, so it's important to keep track of the egress and optimize the files.

### Optimizing egress

See our [scaling tips for egress](/docs/guides/storage/production/scaling#egress).
