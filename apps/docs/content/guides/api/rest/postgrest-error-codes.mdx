---
id: 'postgrest-error-codes'
title: 'Error Codes'
description: 'PostgREST Error Codes'
subtitle: 'Identify PostgREST errors and resolve them'
sidebar_label: 'Debugging'
---

<Admonition type="note">

The docs reflect the error codes and information in [PostgREST's official
docs](https://docs.postgrest.org/en/stable/).

</Admonition>

## PostgREST error codes

Error codes from the Data API are returned as JSON objects

```json
{
  "code": "42703",
  "details": null,
  "hint": "Perhaps you meant to reference the column some_table.fake_col",
  "message": "column some_table.fake_col does not exist"
}
```

Here is the full list of error codes and their descriptions:

## Database level errors

To understand the errors reference the [Postgres Error Docs](https://www.postgresql.org/docs/current/errcodes-appendix.html).

Here's the text formatted as a proper markdown table:

| Postgres error code(s) | HTTP status                    | Error description               |
| ---------------------- | ------------------------------ | ------------------------------- |
| 08\*                   | 503                            | connection error                |
| 09\*                   | 500                            | triggered action exception      |
| 0L\*                   | 403                            | invalid grantor                 |
| 0P\*                   | 403                            | invalid role specification      |
| 23503                  | 409                            | foreign key violation           |
| 23505                  | 409                            | uniqueness violation            |
| 25006                  | 405                            | read only SQL transaction       |
| 25\*                   | 500                            | invalid transaction state       |
| 28\*                   | 403                            | invalid auth specification      |
| 2D\*                   | 500                            | invalid transaction termination |
| 38\*                   | 500                            | external routine exception      |
| 39\*                   | 500                            | external routine invocation     |
| 3B\*                   | 500                            | savepoint exception             |
| 40\*                   | 500                            | transaction rollback            |
| 53400                  | 500                            | config limit exceeded           |
| 53\*                   | 503                            | insufficient resources          |
| 54\*                   | 500                            | too complex                     |
| 55\*                   | 500                            | obj not in prerequisite state   |
| 57\*                   | 500                            | operator intervention           |
| 58\*                   | 500                            | system error                    |
| F0\*                   | 500                            | config file error               |
| HV\*                   | 500                            | foreign data wrapper error      |
| P0001                  | 400                            | default code for "raise"        |
| P0\*                   | 500                            | PL/pgSQL error                  |
| XX\*                   | 500                            | internal error                  |
| 42883                  | 404                            | undefined function              |
| 42P01                  | 404                            | undefined table                 |
| 42P17                  | 500                            | infinite recursion              |
| 42501                  | if authenticated 403, else 401 | insufficient privileges         |
| other                  | 400                            |                                 |

## API level errors

### Connection errors

Errors that prevent that data API from interacting with Postgres.

| Code     | HTTP status | Description                                                                                                           |
| -------- | ----------- | --------------------------------------------------------------------------------------------------------------------- |
| PGRST000 | 503         | Could not connect with the database due to an incorrect connection string or due to the Postgres service not running. |
| PGRST001 | 503         | Could not connect with the database due to an internal error.                                                         |
| PGRST002 | 503         | Could not connect with the database when building the schema cache                                                    |
| PGRST003 | 504         | The request timed out waiting for a connection from PostgREST's internal pool                                         |

### API requests

Errors with data structures or request formatting

| Code     | HTTP status | Description                                                                                                                 |
| -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| PGRST100 | 400         | Parsing error in the query string parameter.                                                                                |
| PGRST101 | 405         | For database functions, only `GET` and `POST` verbs are allowed. Any other verb will throw this error.                      |
| PGRST102 | 400         | An invalid request body was sent(e.g. an empty body or malformed JSON).                                                     |
| PGRST103 | 416         | An invalid range was specified for limits.                                                                                  |
| PGRST105 | 405         | An invalid `UPDATE`/`UPSERT` request was done                                                                               |
| PGRST106 | 406         | The schema specified when switching schemas is not exposed to the API.                                                      |
| PGRST107 | 415         | The `Content-Type` sent in the request is invalid.                                                                          |
| PGRST108 | 400         | The filter is applied to an embedded resource that is not specified in the `select` part of the query string.               |
| PGRST111 | 500         | An invalid `response.headers` was set.                                                                                      |
| PGRST112 | 500         | The status code must be a positive integer.                                                                                 |
| PGRST114 | 400         | For an `UPSERT` using `PUT` when limits and offsets are used.                                                               |
| PGRST115 | 400         | For an `UPSERT` using `PUT` when the primary key in the query string and the body are different.                            |
| PGRST116 | 406         | More than 1 or no items where returned when requesting a singular response.                                                 |
| PGRST117 | 405         | The HTTP verb used in the request in not supported.                                                                         |
| PGRST118 | 400         | Could not order the result using the related table because there is no many-to-one or one-to-one relationship between them. |
| PGRST120 | 400         | An embedded resource can only be filtered using the `is.null` or `not.is.null` operators.                                   |
| PGRST121 | 500         | API can't parse the JSON objects in RAISE `PGRST` error.                                                                    |
| PGRST122 | 400         | Invalid preferences found in `Prefer` header with `Prefer: handling=strict`.                                                |
| PGRST123 | 400         | Aggregate functions are disabled.                                                                                           |
| PGRST124 | 400         | `max-affected` preference is violated.                                                                                      |
| PGRST125 | 404         | Invalid path is specified in request URL.                                                                                   |
| PGRST126 | 404         | Open API config is disabled but API root path is accessed.                                                                  |
| PGRST127 | 400         | The feature specified in the `details` field is not implemented.                                                            |
| PGRST128 | 400         | `max-affected` preference is violated with `RPC` call.                                                                      |

### Schema cache errors

The API is unable to identify relationships or objects within the query requests.

| Code     | HTTP status | Description                                                                                                                                                                                                                                                                             |
| -------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PGRST200 | 400         | Caused by stale foreign key relationships, otherwise any of the embedding resources or the relationship itself may not exist in the database.                                                                                                                                           |
| PGRST201 | 300         | An ambiguous embedding request was made.                                                                                                                                                                                                                                                |
| PGRST202 | 404         | Caused by a stale function signature, otherwise the function may not exist in the database.                                                                                                                                                                                             |
| PGRST203 | 300         | Caused by requesting overloaded functions with the same argument names but different types, or by using a `POST` verb to request overloaded functions with a `JSON` or `JSONB` type unnamed parameter. The solution is to rename the function or add/modify the names of the arguments. |
| PGRST204 | 400         | Caused when the column specified in the columns query parameter is not found.                                                                                                                                                                                                           |
| PGRST205 | 404         | Caused when the table specified in the URI is not found.                                                                                                                                                                                                                                |

### Authentication errors

The request lacks the proper credentials to request data

| Code     | HTTP status | Description                                                                                      |
| -------- | ----------- | ------------------------------------------------------------------------------------------------ |
| PGRST300 | 500         | PostgREST does not have an active JWT secret to validate requests                                |
| PGRST301 | 401         | Provided JWT couldn't be decoded or it is invalid.                                               |
| PGRST302 | 401         | Attempted to do a request without the header `Auth: Bearer` when the anonymous role is disabled. |
| PGRST303 | 401         | JWT claims validation or parsing failed.                                                         |

### Internal errors

Data API error unspecified

| Code     | HTTP status | Description                                                                 |
| -------- | ----------- | --------------------------------------------------------------------------- |
| PGRSTX00 | 500         | Internal errors related to the library used for connecting to the database. |

## Viewing errors in the logs

One can filter for API errors in the [log explorer](/dashboard/project/_/logs/explorer). Below are useful queries for filtering and analyzing API errors:

#### Find all API errors that occurred at the database level

```sql
select
  cast(postgres_logs.timestamp as datetime) as timestamp,
  event_message,
  parsed.error_severity,
  parsed.user_name,
  parsed.query,
  parsed.detail,
  parsed.hint,
  parsed.sql_state_code,
  parsed.backend_type
from
  postgres_logs
  cross join unnest(metadata) as metadata
  cross join unnest(metadata.parsed) as parsed
where
  regexp_contains(parsed.error_severity, 'ERROR|FATAL|PANIC')
  and parsed.user_name = 'authenticator' -- the authenticator role represents the database API
order by timestamp desc
limit 100;
```

#### Find specific database error from the data API

```sql
select
  cast(postgres_logs.timestamp as datetime) as timestamp,
  event_message,
  parsed.error_severity,
  parsed.user_name,
  parsed.query,
  parsed.detail,
  parsed.hint,
  parsed.sql_state_code,
  parsed.backend_type
from
  postgres_logs
  cross join unnest(metadata) as metadata
  cross join unnest(metadata.parsed) as parsed
where parsed.sql_state_code like '42501' and parsed.user_name = 'authenticator' -- the authenticator role represents the database API
order by timestamp desc
limit 100;
```

<Admonition type="note">

PostgREST error codes are only captured in the logs for projects running V14+. You can check your PostgREST version and upgrade your project in the [Infrastructure Settings](/dashboard/project/_/settings/infrastructure)

</Admonition>

#### Find specific API error

```sql
select
  cast(timestamp as datetime) as timestamp,
  status_code,
  event_message,
  coalesce(proxy_status, 'not_recorded') as error_codes,
  path
from
  edge_logs
  cross join unnest(metadata) as metadata
  cross join unnest(response) as response
  cross join unnest(request) as request
where
  status_code >= 300
  and regexp_contains(path, '^/rest/v1/')
  and regexp_contains(proxy_status, '(?i)THE_RELEVANT_STATUS_CODE');
```

#### Count errors per path by hour:

```sql
select
  format_timestamp(
    "%c",
    timestamp_trunc(cast(edge_logs.timestamp as timestamp), hour),
    "UTC"
  ) as hour,
  count(proxy_status) as error_count,
  path,
  coalesce(proxy_status, 'not_recorded') as error_codes
from
  edge_logs
  cross join unnest(metadata) as metadata
  cross join unnest(response) as response
  cross join unnest(response.headers) as headers
  cross join unnest(request) as request
where status_code >= 300 and regexp_contains(path, '^/rest/v1/')
group by hour, proxy_status, path;
```

#### Find data API request from specific authenticated user

```sql
select
  cast(timestamp as datetime) as timestamp,
  event_message,
  cf_connecting_ip as requesters_ip,
  url as request_url,
  request.method as request_method,
  sb.auth_user as user_id,
  apikey_payload.role as apikey_role,
  authorization_payload.role as authorization_token_role,
  user_agent,
  city,
  country,
  continent,
  postalCode
from
  edge_logs
  cross join unnest(metadata) as metadata
  cross join unnest(request) as request
  cross join unnest(sb) as sb
  cross join unnest(jwt) as jwt
  cross join unnest(jwt.apikey) as jwt_apikey
  cross join unnest(jwt_apikey.payload) as apikey_payload
  cross join unnest(authorization) as authorization_key
  cross join unnest(authorization_key.payload) as authorization_payload
  cross join unnest(headers) as headers
  cross join unnest(cf) as cf
  cross join unnest(response) as response
where regexp_contains(path, '^/rest/v1/') and sb.auth_user = 'SOME_USER_ID' -- <---ADD USER_ID from auth.users table
order by timestamp desc;
```
