# Dashboard links

Open `/project/<project-ref>/model` and select **Open example** for a recent hour of real project metrics. The annotation in that example is illustrative, not a detected event. No navigation entry or saved dashboard is created by this prototype.

An agent composes JSON, then generates a link with Node's built-in gzip encoder (no extra dependencies):

```sh
node apps/studio/scripts/model/encode.mjs <project-ref> apps/studio/scripts/model/example.json
node apps/studio/scripts/model/encode.mjs <project-ref> apps/studio/scripts/model/example.json http://localhost:8082
```

The default base is `https://supabase.com/dashboard`; an optional base includes any deployment path prefix. Update the absolute timestamps in the committed example before use. The encoder checks JSON syntax and transport size; Studio validates the entire schema before mounting any metric panel or fetching its data.

## Format

The fragment is `#v1=<base64url(gzip(UTF-8 JSON))>` with unpadded URL-safe base64. JSON has these fields, with unknown fields rejected:

| Field          | Meaning                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `version`      | Must be `1`                                                                                                               |
| `title`        | Plain text, 1–120 characters                                                                                              |
| `start`, `end` | Absolute ISO 8601 timestamps in UTC (`Z`); end is after start, maximum 7 days                                             |
| `interval`     | `1m`, `5m`, `10m`, `30m`, `1h`, or `1d`; maximum 1,440 buckets per panel                                                  |
| `panels`       | 1–8 objects with a required `metric` and optional `title` (1–120 characters) and `description` (maximum 1,000 characters) |
| `annotations`  | Optional list of up to 20 objects with `at` (UTC timestamp within the time range) and `label` (1–160 characters)          |

| Metric        | Infrastructure attribute        | Unit                            |
| ------------- | ------------------------------- | ------------------------------- |
| `connections` | `pg_stat_database_num_backends` | Concurrent database connections |
| `cpu`         | `avg_cpu_usage`                 | Percent                         |
| `memory`      | `ram_usage`                     | Percent                         |

Titles, descriptions, and annotation labels render as plain text. Annotations appear as vertical chart markers and a readable UTC list. All displayed times are UTC. Definitions are limited to 16,384 encoded characters and 65,536 decompressed bytes, enforced while streaming decompression. The schema accepts no SQL, URLs, HTML, scripts, or arbitrary data sources.

## Sharing and access

The project comes from the route. Sign in before opening a generated link. The existing sign-in redirect does not preserve the fragment; reopen the original link after signing in. Opening a link uses the viewer's existing Studio authentication and project authorization to fetch infrastructure metrics. A link grants no additional access. Source metrics still expire according to the project's retention; links contain definitions and annotations, not snapshots of metric data. API failures and empty metric results have separate states.

Dashboard definitions live only in the fragment: no database record or local storage. Fragment changes, including browser back/forward, decode and render a new definition; an older asynchronous decode cannot replace the latest one. The fragment is not sent as part of the initial HTTP request, but anyone with the full URL can read its text. Keep secrets out of definitions.

A future MCP tool or skill can produce this JSON and run the encoder, returning the resulting link. It needs no dashboard persistence endpoint. The receiver validates the finite catalog and time limits before requesting data.
