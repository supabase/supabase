# Change Log

All notable changes to this project will be documented in this file. From version `14.0` onwards PostgREST follows a `MAJOR.PATCH` two-part versioning. Only even-numbered MAJOR versions will be released, reserving odd-numbered MAJOR versions for development.

## Unreleased

### Changes

- Add schema cache query logging on `log-query=true` and `log-level=info|debug` by @steve-chavez in #5285
- Reduce JWT cache memory usage by @mkleczek in #5229
- Remove deprecated JSPath DSL syntax for `jwt-role-claim-key` config by @taimoorzaeem in #5192

## [16.4] - 2026-09-24

### Changes

- Fix response on root endpoint when schema name is in mixed case by @taimoorzaeem in #5158
- Fix config `jwt-cache-max-entries` not loaded from the database by @mkleczek in #5269

## [16.3] - 2026-09-11

### Changes

- Fix sporadic "PGRST303 JWT issued at future" errors by @steve-chavez in #5196
- Fix wrong time appearing on logs after long idle periods by @taimoorzaeem in #5213

## [16.2] - 2026-08-21

### Added

- Make `jwt-role-claim-key` config backwards compatible by @taimoorzaeem in #5171

### Deprecated

- The old (pre-v16) syntax for JSPath in `jwt-role-claim-key` is deprecated by @taimoorzaeem in #5171
  + You will see a warning in the logs when old syntax is used for the config.
  + See [migration to v16](https://github.com/PostgREST/postgrest/blob/main/CHANGELOG.md#migration-to-v16) section for migration guide.

## [16.1] - 2026-08-10

### Fixed

- JWT validation uses wrong current time due to a bug in auto-update by @mkleczek in #5159

## [16.0] - 2026-08-07

### Changes

#### HTTP Server

- [Graceful shutdown](https://docs.postgrest.org/en/v16/references/http_server.html#graceful-shutdown) by @mkleczek, @Vlix in #4702

- [server-reuseport](https://docs.postgrest.org/en/v16/references/configuration.html#server-reuseport) allows starting multiple PostgREST instances using the same port on supported platforms by @mkleczek in #4703, #4694

#### Performance

- Optimize schema cache domain type resolution by using [pg_basetype](https://www.postgresql.org/docs/current/functions-info.html#FUNCTIONS-INFO-CATALOG) on PostgreSQL 17+ by @joelonsql in #4567

- [Prefer: count=exact](https://docs.postgrest.org/en/v16/references/api/pagination_count.html#exact-count) no longer does a double count on requests that do not use ranges or `db-max-rows` by @laurenceisla in #3957

- [Prefer: timezone](https://docs.postgrest.org/en/v16/references/api/preferences.html#prefer-timezone) no longer requires the schema cache by @steve-chavez in #5100
  + Previously this required caching [pg_timezone_names](https://www.postgresql.org/docs/current/view-pg-timezone-names.html) which was slow in some systems

#### Integrations

- PostgREST is now tested to work with [OrioleDB](https://github.com/orioledb/orioledb/) in #4845 by @wolfgangwalther
  + See [our guide for running OrioleDB on NixOS](https://docs.postgrest.org/en/v16/integrations/nixos.html)

#### JWT

- [JWT Role Extraction](https://docs.postgrest.org/en/v16/references/auth.html#jwt-role-extract) is now more flexible, supporting the standard JSON Path defined in RFC 9535 by @taimoorzaeem in #4984

#### API

- [Prefer: timezone](https://docs.postgrest.org/en/v16/references/api/preferences.html#timezone) now supports numeric offsets like `05:00` or `-4` by @steve-chavez in #5100

- Fix unexpected results when embedding and filtering the same table more than once by @laurenceisla in #4075
  + You need to set [url-use-legacy-target-names](https://docs.postgrest.org/en/v16/references/configuration.html#url-use-legacy-target-names) to `false`.

- Deprecate filters, orders and limits with the name of an embedded table when it has an alias by @steve-chavez, @laurenceisla in #4075
  + e.g. `?select=alias:table(*)&table.id=eq.1` will not be possible anymore, use `?select=alias:table(*)&alias.id=eq.1` instead.
  + You will see a warning in the logs and a `Warning` header on the client response when this happens.
  + You can disable this behavior now by setting `url-use-legacy-target-names = false`.

- Add `Vary` header to responses by @develop7 in #4609

- Fix automatic transaction retries on `40001 (serialization_failure)` errors to prevent replication lag by @laurenceisla in #3673

#### Observability

- [GHC runtime metrics](https://docs.postgrest.org/en/v16/references/observability.html#ghc-runtime-metrics) by @mkleczek in #4862
- [client-error-verbosity](https://docs.postgrest.org/en/v16/references/configuration.html#client-error-verbosity) to customize responses error verbosity by @taimoorzaeem in #4088, #3980, #3824
- [log-level](https://docs.postgrest.org/en/v16/references/configuration.html#log-level) config is now reloadable by @taimoorzaeem in #5113
- Log error when `db-schemas` config contains schema `pg_catalog` or `information_schema` by @taimoorzaeem in #4359
- Log schema cache queries timings on `log-level=debug` by @steve-chavez in #4805

#### Admin Server

- [admin-server-unix-socket](https://docs.postgrest.org/en/v16/references/configuration.html#admin-server-unix-socket)/[admin-server-unix-socket-mode](https://docs.postgrest.org/en/v16/references/configuration.html#admin-server-unix-socket-mode) to run the admin server on a unix socket by @wolfgangwalther in #5003
- Fix responding with `Something went wrong` on Admin server when under EMFILE by @mkleczek in #5077

#### Deployment

- Make executable for aarch64-linux static instead of Ubuntu-based by @wolfgangwalther in #4193
- Docker image for aarch64-linux is now built from scratch instead of being Ubuntu-based by @wolfgangwalther in #4193
- Besides Docker Hub, docker images are now published to Github Container Registry by @wolfgangwalther in #2836

#### Schema Cache

- Fix requests failing when the schema cache fails to reload, when this happens PostgREST will continue serving requests in "best effort" by @mkleczek in #4873 #4869
- Fix reporting 503s errors unnecessarily while the schema cache is loading at startup by @mkleczek in #4880
- Fix schema cache dump missing RPC transaction isolation level by @taimoorzaeem in #5079

#### Listener

- Fix config `db-channel-enabled` not reloading by @taimoorzaeem in #4894

### Migration to v16

- `jwt-role-claim-key` no longer uses the JSPath DSL and instead uses JSON Path by @taimoorzaeem in #4984
  + If you don't explicitly set this config, you don't need to change anything as the default value will do the same thing on this version. If you do set this config, read on.
  + Now all config values must start with `$` character.
     Example: `.roles.read` -> `$.roles.read`
  + Keys with special characters, with the exception of `_` char must be quoted.
      Example: `.roles.write-role` -> `$.roles["write-role"]`
  + String comparison operators (`^==`, `==^` and `*==`) are replaced with regular expression search.
      Example: `.roles[?(@ ^== "postgrest_test_")]` -> `$.roles[?search(@, "^postgrest_test_")]`
  + Update the `jwt-role-claim-key` value accoring to the above rules. Also see the syntax reference: [RFC 9535](https://www.rfc-editor.org/rfc/rfc9535.html#name-jsonpath-syntax-and-semanti).

- Drop support for PostgreSQL EOL version 13 by @wolfgangwalther in #4193
  + PostgreSQL 13 end of life was on 2025 ([ref](https://www.postgresql.org/support/versioning/))
  + Upgrade your PostgreSQL version to at least 14 to use this new PostgREST version.

- Fail at startup when `db-schemas` contains schema `pg_catalog` or `information_schema` by @taimoorzaeem in #4359
  + Previously it failed at runtime with `PGRST205` on requests related to these schemas.
  + Remove `pg_catalog` and `information_schema` from `db-schemas`.

- `Prefer: timezone` no longer complies with `handling=lenient` and instead always fails by @steve-chavez in #5128
  + Supporting this required caching `pg_timezone_names`, which was expensive.
  + Ensure your requests always have a valid timezone.

## [14.18] - 2026-09-10

### Changes

- Fix sporadic "PGRST303 JWT issued at future" errors by @steve-chavez in #5196
- Fix wrong time appearing on logs after long idle periods by @taimoorzaeem in #5213

## [14.17] - 2026-08-13

### Fixed

- JWT validation uses wrong current time due to a bug in auto-update by @mkleczek in #5159

## [14.16] - 2026-07-27

### Fixed

- Fix admin server crashing without a way to recover by @taimoorzaeem in #5096

## [14.15] - 2026-07-13

### Fixed

- Fix admin server dying silently by @Vlix, @mkleczek, @steve-chavez in #5012

## [14.14] - 2026-06-29

### Fixed

- Fix admin server not logging cause of failure by @taimoorzaeem in #5012

## [14.13] - 2026-06-04

### Fixed

- Fix connection retrying message in `PGRST000` error by @netqo in #4980
  + Remove redundant "Retrying the connection." from message because it is logged separately
- Fix request failures when `work_mem` is set on a role by @laurenceisla in #4955

## [14.12] - 2026-05-20

### Fixed

- Fix race condition in pool_available metric causing negative values during network instability by @mkleczek in #4622

## [14.11] - 2026-05-04

### Fixed

- Fix login with uppercase and mixed case role names by @taimoorzaeem in #4678
- Restore Listener query shape so it can be found in `pg_stat_activity` by @mkleczek in #4857 #4859
- The LISTEN channel now automatically recovers when it stops working due to a PostgreSQL bug @laurenceisla in #3147
- Fix misleading "Functions" name on schema cache summary in startup logs by @taimoorzaeem in #4821

## [14.10] - 2026-04-16

### Added

- Log when the pool is released during schema cache reload on `log-level=debug` by @mkleczek in #4668

### Fixed

- Fix unnecessary connection pool flushes during schema cache reloading by @mkleczek in #4645

## [14.9] - 2026-04-10

### Added

- Log host, port and pg version of listener database connection by @mkleczek in #4617 #4618

### Fixed

- Remove red herring warp logs on default log-level, only emit them on `log-level=debug` by @steve-chavez in #4799

## [14.8] - 2026-04-03

### Added

- Log a `HINT` when the LISTEN channel stops working due to a PostgreSQL bug by @laurenceisla in #4581

### Fixed

- Fix invalid OpenAPI 2.0 format for integer types (`smallint`, `integer`, `bigint`) by @arturbent0 in #4641

## [14.7] - 2026-03-20

### Fixed

- Fix not logging SIGTERM and SIGINT by @steve-chavez in #4728

## [14.6] - 2026-03-06

### Fixed

- Fix leaking table and function names when calculating error hint by @taimoorzaeem in #4675

## [14.5] - 2026-02-12

### Fixed

- Don't hide async exceptions in logs by @stevechavez in #4646

## [14.4] - 2026-01-29

### Fixed

- Ensure Listener connections are released by @mkleczek in #4614
- Fix incorrectly filtering the returned representation for PATCH requests when using `or/and` filters by @laurenceisla in #3707
- Fix listener running with exception masked after first failure by @mkleczek in #4615

## [14.3] - 2026-01-03

### Fixed

- Fix performance and high memory usage of relation hint calculation by @mkleczek in #4462, #4463

## [14.2] - 2025-12-18

### Fixed

- Fix `hasSingleUnnamedParam` incorrectly matching functions with named parameters by @joelonsql in #4553
  + Functions with a single named parameter (e.g., `foo(data json)`) no longer incorrectly match the single-param fallback, returning a clean `PGRST202` error instead of a confusing PostgreSQL `42883` error.
- Fix misleading logs on unsupported PostgreSQL versions by @taimoorzaeem in #4519
- Fix regression where the `PGRST103` error response was truncated by @laurenceisla in #4455
  + Happened when an `offset` was greater than the rows requested and `Prefer: count=exact` was sent.
- Fix not returning `Content-Length` on empty HTTP `201` responses by @laurenceisla in #4518
- Fix inaccurate Server-Timing header durations by @steve-chavez in #4522
- Fix inaccurate "Schema cache queried" logs by @steve-chavez in #4522

## [14.1] - 2025-11-05

## Fixed

- Fix `db-pre-config` function failing when function names are pg reserved words by @taimoorzaeem in #4380
- Fix `server-host=!6` incorrectly binds to IPv4 address by @taimoorzaeem in #3202

## [14.0] - 2025-10-24

### Added

- Bounded JWT cache using the SIEVE algorithm by @mkleczek in #4084
  + It now uses a fixed size cache instead of arbitrary sized cache.
- Add `--ready` flag for postgrest healthcheck by @taimoorzaeem in #4239

### Fixed

- Fix not logging OpenAPI queries when `log-query=main-query` is enabled by @steve-chavez in #4226
- Fix not logging explain query when `log-query=main-query` is enabled by @steve-chavez in #4319
- Fix not logging transaction variables and db-pre-request function when `log-query=main-query` is enabled by @steve-chavez in #3934
- Fix not logging the JSON message to stderr on a `PGRST002` error by @laurenceisla in #4129
- Fix reloading the Schema Cache unnecessarily on a `PGRST002` error by @laurenceisla in #4367
- Fix schema cache loading taking a long time for large schemas by @mkleczek in #4360, #3704

### Changed

- Drop support for PostgreSQL EOL version 12 by @wolfgangwalther in #3865
- From now on PostgREST will follow a `MAJOR.PATCH` two-part versioning. Only even-numbered MAJOR versions will be released, reserving odd-numbered MAJOR versions for development.
- Replaced `jwt-cache-max-lifetime` config with `jwt-cache-max-entries` by @mkleczek in #4084
- `log-query` config now takes a boolean instead of a string value by @steve-chavez in #3934

## [13.0.8] - 2025-10-24

### Fixed

- Fix loading utf-8 config files with `ASCII` locale set by @taimoorzaeem in #4386

## [13.0.7] - 2025-09-14

### Added

- Improve the `PGRST106` error when the requested schema is invalid by @laurenceisla in #4089
  + It now shows the invalid schema in the `message` field.
  + The exposed schemas are now listed in the `hint` instead of the `message` field.
- Improve error details of `PGRST301` error by @taimoorzaeem in #4051

## [13.0.6] - 2025-08-30

### Fixed

- Fix logging the Haskell type instead of the listener error message directly by @laurenceisla in #3588
- Fix format of `IPv6` address logged at PostgREST startup by @taimoorzaeem in #4291
- Fix empty enum in `preferParams` OpenAPI parameter by @laurenceisla in #4292

## [13.0.5] - 2025-08-24

### Fixed

- Fix OpenAPI broken docs link by @taimoorzaeem in #4080
- Fix OpenAPI specification incorrectly exposing GET methods for volatile functions by @joelonsql in #4174
- Fix empty spread embeddings return unexpected SQL error by @taimoorzaeem in #3887
- Fix `/metrics` endpoint not responding with `Content-Type` header by @taimoorzaeem in #4271

## [13.0.4] - 2025-06-17

### Fixed

- Fix regression that makes full-text search not work on domain types based on `tsvector` by @laurenceisla in #4135
- Fix `jwt-aud` config not failing when set to an invalid URI by @taimoorzaeem in #4132

## [13.0.3] - 2025-06-16

- Fix `max-affected` preference not failing with RPC when `handling=strict` by @taimoorzaeem in #4100
- Fix a property definition's type in OpenAPI not showing the correct base type of a recursive domain by @laurenceisla in #4136

### Fixed

## [13.0.2] - 2025-06-02

### Fixed

- Fix regression that makes `ORDER BY` with nulls-order not work alongside limits by @laurenceisla in #4109

## [13.0.1] - 2025-06-01

### Fixed

- Fix jwt error returning HTTP status `400` for invalid role by @taimoorzaeem in #3601
- Fix `db-extra-search-path` cannot be set to nothing by @taimoorzaeem in #4074
  + It can now be disabled by setting it to empty string.
  + Schema Cache load error is now logged including `db-schemas` and `db-extra-search-path` config values.

## [13.0.0] - 2025-05-08

### Added

 - #3558, Add the `admin-server-host` config to set the host for the admin server - @develop7
 - #3607, Log to stderr when the JWT secret is less than 32 characters long - @laurenceisla
 - #2858, Performance improvements when calling RPCs via GET using indexes in more cases - @wolfgangwalther
 - #3560, Log resolved host in "Listening on ..." messages - @develop7
 - #3727, Log maximum pool size - @steve-chavez
 - #1536, Add string comparison feature for jwt-role-claim-key - @taimoorzaeem
 - #3747, Allow `not_null` value for the `is` operator - @taimoorzaeem
 - #2255, Apply `to_tsvector()` explicitly to the full-text search filtered column (excluding `tsvector` types) - @laurenceisla
 - #1578, Log the main SQL query to stderr at the current `log-level` when `log-query=main-query` - @laurenceisla
 - #3903, Log connection pool borrows on `log-level=debug` - @taimoorzaeem
 - #3041, Allow spreading one-to-many and many-to-many embedded resources - @laurenceisla
   + The selected columns in the embedded resources are aggregated into arrays
   + Aggregates are not supported
 - #2967, Add `Proxy-Status` header for better error response - @taimoorzaeem
 - #4016, Add `Content-Length` response header - @laurenceisla

### Fixed

 - #3693, Prevent spread embedding to allow aggregates when they are disabled - @laurenceisla
 - #3693, A nested spread embedding now correctly groups by the fields of its top parent relationship - @laurenceisla
 - #3693, Fix spread embedding errors when using the `count()` aggregate without a field - @laurenceisla
   + Fixed `"column reference <col> is ambiguous"` error when selecting `?select=...table(col,count())`
   + Fixed `"column <json_aggregate>.<alias> does not exist"` error when selecting `?select=...table(aias:count())`
 - #3727, Clarify "listening" logs - @steve-chavez
 - #3795, Clarify `Accept: vnd.pgrst.object` error message - @steve-chavez
 - #3697, #3602, Handle queries on non-existing table gracefully - @taimoorzaeem
 - #3600, #3926, Improve JWT errors - @taimoorzaeem
 - #3013, Fix `order=` with POST, PATCH, PUT and DELETE requests - @taimoorzaeem
 - #3965, Fix filter on unselected columns in a table-valued function - @taimoorzaeem
 - #4052, Fix schema cache load duplicate objects with different object type but same oid - @taimoorzaeem

### Changed

 - #2052, Dropped support for PostgreSQL 9.6 - @wolfgangwalther
 - #2052, Dropped support for PostgreSQL 10 - @wolfgangwalther
 - #2052, Dropped support for PostgreSQL 11 - @wolfgangwalther
 - #3508, PostgREST now fails to start when `server-port` and `admin-server-port` config options are the same - @develop7
 - #3607, PostgREST now fails to start when the JWT secret is less than 32 characters long - @laurenceisla
 - #3644, Fail schema cache lookup with invalid `db-schemas` or `db-extra-search-path` config - @wolfgangwalther
   - Previously, this would silently return 200 - OK on the root endpoint, but don't provide any usable endpoints.
   - Note: This also applies when deleting the `public` schema - both config options default to that.
 - #3757, Remove support for `Prefer: params=single-object` - @joelonsql
   + This preference was deprecated in favor of Functions with an array of JSON objects
 - #3013, Drop support for Limited updates/deletes
   + The feature was complicated and largely unused.
 - #3956, Drop `/config` endpoint of admin server - @steve-chavez
   + The endpoint was at risk of being left unprotected when exposing it.
   + The accompanying `admin-server-config-enabled` config was also dropped.
 - #3598, PostgREST now validates the `kid` parameter of the JWT - @wolfgangwalther
   + If the JWT contains a ``kid`` parameter, then PostgREST will look for the JSON Web Key in the `jwt-secret`.
   + If the JWT doesn't contain a `kid`, the behavior should be backwards compatible. PostgREST  will try each key in the `jwt-secret` one by one until it finds one that works.
 - #3697, #3602, Querying non-existent table now returns `PGRST205` error instead of empty json - @taimoorzaeem
 - #3600, #3926, Improve JWT errors - @taimoorzaeem
   + Return `PGRST301` error when `Bearer` in auth header is sent empty
   + Diagnostic error messages instead of exposed internals
   + Return new `PGRST303` error when jwt claims decoding fails
 - #3906, Return `PGRST125` and `PGRST126` errors instead of empty json - @taimoorzaeem

## [12.2.12] - 2025-05-01

### Fixed

- #3956, Fix exposing admin server `/config` by default - @steve-chavez
  + The above endpoint is now disabled unless the `admin-server-config-enabled` config is set to `true`

## [12.2.11] - 2025-04-22

### Fixed

 - #4030, Fix regression with parameter `charset=utf-8` in mediatype - @taimoorzaeem

## [12.2.10] - 2025-04-18

### Fixed

- #3889, Fix: JWT cache purging on every request decreases performance - @mkleczek

## [12.2.9] - 2025-04-16

### Fixed

 - #3498, Fix incorrect parsing of the `for` parameter of the `application/vnd.pgrst.plan` media type - @taimoorzaeem
 - #4014, Fix JWT cache allows old tokens after the jwt-secret is changed in a config reload - @taimoorzaeem

## [12.2.8] - 2025-02-10

### Fixed

 - #3841, Log `503` client error to stderr - @taimoorzaeem

## [12.2.7] - 2025-02-03

### Fixed

 - #2524, Fix schema reloading notice on windows - @diogob

## [12.2.6] - 2025-01-29

### Fixed

 - #3788, Fix jwt cache does not remove expired entries - @taimoorzaeem

## [12.2.5] - 2025-01-20

### Fixed

 - #3867, Fix startup for arm64 docker image - @wolfgangwalther

## [12.2.4] - 2025-01-18

### Fixed

 - #3779, Always log the schema cache load time - @steve-chavez
 - #3706, Fix insert with `missing=default` uses default value of domain instead of column - @taimoorzaeem

## [12.2.3] - 2024-08-01

### Fixed

 - #3091, Broken link in OpenAPI description `externalDocs` - @salim-b
 - #3659, Embed One-to-One relationship with different column order properly - @wolfgangwalther
 - #3504, Remove `format` from `rowFilter` parameters in OpenAPI - @dantheman2865
 - #3660, Fix regression that loaded the schema cache before the in-database configuration - @steve-chavez, @laurenceisla

## [12.2.2] - 2024-07-10

### Fixed

 - #3093, Nested empty embeds no longer show empty values and are correctly omitted - @laurenceisla
 - #3644, Make --dump-schema work with in-database pgrst.db_schemas setting - @wolfgangwalther
 - #3644, Show number of timezones in schema cache load report - @wolfgangwalther
 - #3644, List correct enum options in OpenApi output when multiple types with same name are present - @wolfgangwalther
 - #3523, Fix schema cache loading retry without backoff - @steve-chavez

## [12.2.1] - 2024-06-27

### Fixed

 - #3147, Don't reload schema cache on every listener failure - @steve-chavez

### Documentation

 - #3592, Architecture diagram now supports dark mode and has links - @laurenceisla
 - #3616, The schema isolation diagram now supports dark mode and uses well-known schemas - @laurenceisla

## [12.2.0] - 2024-06-11

### Added

 - #2887, Add Preference `max-affected` to limit affected resources - @taimoorzaeem
 - #3171, Add an ability to dump config via admin API - @skywriter
 - #3171, #3046, Log schema cache stats to stderr - @steve-chavez
 - #3210, Dump schema cache through admin API - @taimoorzaeem
 - #2676, Performance improvement on bulk json inserts, around 10% increase on requests per second by removing `json_typeof` from write queries - @steve-chavez
 - #3435, Add log-level=debug, for development purposes - @steve-chavez
 - #1526, Add `/metrics` endpoint on admin server - @steve-chavez
   - Exposes connection pool metrics, schema cache metrics
 - #3404, Show the failed MESSAGE or DETAIL in the `details` field of the `PGRST121` (could not parse RAISE 'PGRST') error - @laurenceisla
 - #3404, Show extra information in the `PGRST121` (could not parse RAISE 'PGRST') error - @laurenceisla
   + Shows the failed MESSAGE or DETAIL in the `details` field
   + Shows the correct JSON format in the `hints` field
 - #3340, Log when the LISTEN channel gets a notification - @steve-chavez
 - #3184, Log full pg version to stderr on connection - @steve-chavez
 - #3242. Add config `db-hoisted-tx-settings` to apply only hoisted function settings - @taimoorzaeem
 - #3214, #3229 Log connection pool events on log-level=debug - @steve-chavez, @laurenceisla

### Fixed

 - #3237, Dump media handlers and timezones with --dump-schema - @wolfgangwalther
 - #3323, #3324, Don't hide error on LISTEN channel failure - @steve-chavez
 - #3330, Incorrect admin server `/ready` response on slow schema cache loads - @steve-chavez
 - #3345, Fix in-database configuration values not loading for `pgrst.server_trace_header` and `pgrst.server_cors_allowed_origins` - @laurenceisla
 - #3404, Clarify the `PGRST121` (could not parse RAISE 'PGRST') error message - @laurenceisla
 - #3267, Fix wrong `503 Service Unavailable` on pg error `53400` - @taimoorzaeem
 - #2985, Fix not adding `application_name` on all connection strings - @steve-chavez
 - #3424, Admin `/live` and `/ready` now differentiates a failure as 500 status - @steve-chavez
    + 503 status is still given when postgREST is in a recovering state
 - #3478, Media Types are parsed case insensitively - @develop7
 - #3533, #3536, Fix listener silently failing on read replica - @steve-chavez
    + If the LISTEN connection fails, it's retried with exponential backoff
 - #3414, Force listener to connect to read-write instances using `target_session_attrs` - @steve-chavez
 - #3255, Fix incorrect `413 Request Entity Too Large` on pg errors `54*` - @taimoorzaeem
 - #3549, Remove verbosity from error logs starting with "An error occurred..." and replacing it with "Failed to..." - @laurenceisla

### Deprecated

 - Support for PostgreSQL versions 9.6, 10 and 11 is deprecated. From this on version onwards, PostgREST will only support non-end-of-life PostgreSQL versions. See https://www.postgresql.org/support/versioning/.
 - `Prefer: params=single-object` is deprecated. Use [a function with a single unnamed JSON parameter](https://postgrest.org/en/latest/references/api/functions.html#function-single-json) instead. - @steve-chavez

### Documentation

 - #3289, Add dark mode. Can be toggled by a button in the bottom right corner. - @laurenceisla
 - #3384, Add architecture diagram and documentation - @steve-chavez

## [12.0.3] - 2024-05-09

### Fixed

 - #3149, Misleading "Starting PostgREST.." logs on schema cache reloading - @steve-chavez
 - #3205, Fix wrong subquery error returning a status of 400 Bad Request - @steve-chavez
 - #3224, Return status code 406 for non-accepted media type instead of code 415 - @wolfgangwalther
 - #3160, Fix using select= query parameter for custom media type handlers - @wolfgangwalther
 - #3361, Clarify PGRST204(column not found) error message - @steve-chavez
 - #3373, Remove rejected mediatype `application/vnd.pgrst.object+json` from response - @taimoorzaeem
 - #3418, Fix OpenAPI not tagging a FK column correctly on O2O relationships - @laurenceisla
 - #3256, Fix wrong http status for pg error `42P17 infinite recursion` - @taimoorzaeem

## [12.0.2] - 2023-12-20

### Fixed

  - #3124, Fix table's media type handlers not working for all schemas - @steve-chavez
  - #3126, Fix empty row on media type handler function - @steve-chavez

## [12.0.1] - 2023-12-12

### Fixed

 - #3054, Fix not allowing special characters in JSON keys - @laurenceisla
 - #2344, Replace JSON parser error with a clearer generic message - @develop7
 - #3100, Add missing in-database configuration option for `jwt-cache-max-lifetime` - @laurenceisla
 - #3089, The any media type handler now sets `Content-Type: application/octet-stream` by default instead of `Content-Type: application/json` - @steve-chavez

## [12.0.0] - 2023-12-01

### Added

 - #1614, Add `db-pool-automatic-recovery` configuration to disable connection retrying - @taimoorzaeem
 - #2492, Allow full response control when raising exceptions - @taimoorzaeem, @laurenceisla
 - #2771, #2983, #3062, #3055 Add `Server-Timing` response header - @taimoorzaeem, @develop7, @laurenceisla
 - #2698, Add config `jwt-cache-max-lifetime` and implement JWT caching - @taimoorzaeem
 - #2943, Add `handling=strict/lenient` for Prefer header - @taimoorzaeem
 - #2441, Add config `server-cors-allowed-origins` to specify CORS origins - @taimoorzaeem
 - #2825, SQL handlers for custom media types - @steve-chavez
   + Solves #1548, #2699, #2763, #2170, #1462, #1102, #1374, #2901
 - #2799, Add timezone in Prefer header - @taimoorzaeem
 - #3001, Add `statement_timeout` set on functions - @taimoorzaeem
 - #3045, Apply superuser settings on impersonated roles if they have PostgreSQL 15 `GRANT SET ON PARAMETER` privilege - @steve-chavez
 - #915, Add support for aggregate functions - @timabdulla
    + The aggregate functions SUM(), MAX(), MIN(), AVG(), and COUNT() are now supported.
    + It's disabled by default, you can enable it with `db-aggregates-enabled`.
 - #3057, Log all internal database errors to stderr - @laurenceisla

### Fixed

 - #3015, Fix unnecessary count() on RPC returning single - @steve-chavez
 - #1070, Fix HTTP status responses for upserts - @taimoorzaeem
   + `PUT` returns `201` instead of `200` when rows are inserted
   + `POST` with `Prefer: resolution=merge-duplicates` returns `200` instead of `201` when no rows are inserted
 - #3019, Transaction-Scoped Settings are now shown clearly in the Postgres logs - @laurenceisla
   + Shows `set_config('pgrst.setting_name', $1)` instead of `setconfig($1, $2)`
   + Does not apply to role settings and `app.settings.*`
 - #2420, Fix bogus message when listening on port 0 - @develop7
 - #3067, Fix Acquision Timeout errors logging to stderr when `log-level=crit` - @laurenceisla

### Changed

 - Removed [raw-media-types config](https://postgrest.org/en/v11.1/references/configuration.html#raw-media-types) - @steve-chavez
 - Removed `application/octet-stream`, `text/plain`, `text/xml` [builtin support for scalar results](https://postgrest.org/en/v11.1/references/api/resource_representation.html#scalar-function-response-format) - @steve-chavez
 - Removed default `application/openapi+json` media type for [db-root-spec](https://postgrest.org/en/v11.1/references/configuration.html#db-root-spec) - @steve-chavez
 - Removed [db-use-legacy-gucs](https://postgrest.org/en/v11.2/references/configuration.html#db-use-legacy-gucs) - @laurenceisla
   + All PostgreSQL versions now use GUCs in JSON format for [Headers, Cookies and JWT claims](https://postgrest.org/en/v12/references/transactions.html#request-headers-cookies-and-jwt-claims).

## [11.2.2] - 2023-10-25

### Fixed

 - #2824, Fix regression by reverting fix that returned 206 when first position = length in a `Range` header - @laurenceisla, @strengthless

## [11.2.1] - 2023-10-03

### Fixed

 - #2899, Fix `application/vnd.pgrst.array` not accepted as a valid mediatype - @taimoorzaeem
 - #2524, Fix schema cache and configuration reloading with `NOTIFY` not working on Windows - @diogob, @laurenceisla
 - #2915, Fix duplicate headers in response - @taimoorzaeem
 - #2824, Fix range request with first position same as length return status 206 - @taimoorzaeem
 - #2939, Fix wrong `Preference-Applied` with `Prefer: tx=commit` when transaction is rollbacked - @steve-chavez
 - #2939, Fix `count=exact` not being included in `Preference-Applied` - @steve-chavez
 - #2800, Fix not including to-one embed resources that had a `NULL` value in any of the selected fields when doing null filtering on them - @laurenceisla
 - #2846, Fix error when requesting `Prefer: count=<type>` and doing null filtering on embedded resources - @laurenceisla
 - #2959, Fix setting `default_transaction_isolation` unnecessarily - @steve-chavez
 - #2929, Fix arrow filtering on RPC returning dynamic TABLE with composite type - @steve-chavez
 - #2963, Fix RPCs not embedding correctly when using overloaded functions for computed relationships - @laurenceisla
 - #2970, Fix regression that rejects URI connection strings with certain unescaped characters in the password - @laurenceisla, @steve-chavez

## [11.2.0] - 2023-08-10

### Added

 - #2523, Data representations - @aljungberg
   + Allows for flexible API output formatting and input parsing on a per-column type basis using regular SQL functions configured in the database
   + Enables greater flexibility in the form and shape of your APIs, both for output and input, making PostgREST a more versatile general-purpose API server
   + Examples include base64 encode/decode your binary data (like a `bytea` column containing an image), choose whether to present a timestamp column as seconds since the Unix epoch or as an ISO 8601 string, or represent fixed precision decimals as strings, not doubles, to preserve precision
   + ...and accept the same in `POST/PUT/PATCH` by configuring the reverse transformation(s)
   + Other use-cases include custom representation of enums, arrays, nested objects, CSS hex colour strings, gzip compressed fields, metric to imperial conversions, and much more
   + Works when using the `select` parameter to select only a subset of columns, embedding through complex joins, renaming fields, with views and computed columns
   + Works when filtering on a formatted column without extra indexes by parsing to the canonical representation
   + Works for data `RETURNING` operations, such as requesting the full body in a POST/PUT/PATCH with `Prefer: return=representation`
   + Works for batch updates and inserts
   + Completely optional, define the functions in the database and they will be used automatically everywhere
   + Data representations preserve the ability to write to the original column and require no extra storage or complex triggers (compared to using `GENERATED ALWAYS` columns)
   + Note: data representations require Postgres 10 (Postgres 11 if using `IN` predicates); data representations are not implemented for RPC
 - #2647, Allow to verify the PostgREST version in SQL: `select distinct application_name from pg_stat_activity`. - @laurenceisla
 - #2856, Add the `--version` CLI option that prints the version information - @laurenceisla
 - #1655, Improve `details` field of the singular error response - @taimoorzaeem
 - #740, Add `Preference-Applied` in response for `Prefer: return=representation/headers-only/minimal` - @taimoorzaeem
 - #1601, Add optional `nulls=stripped` parameter for mediatypes `application/vnd.pgrst.array+json` and `application/vnd.pgrst.object+json` - @taimoorzaeem

### Fixed

 - #2821, Fix OPTIONS not accepting all available media types - @steve-chavez
 - #2834, Fix compilation on Ubuntu by being compatible with GHC 9.0.2 - @steve-chavez
 - #2840, Fix `Prefer: missing=default` with DOMAIN default values - @steve-chavez
 - #2849, Fix HEAD unnecessarily executing aggregates - @steve-chavez
 - #2594, Fix unused index on jsonb/jsonb arrow filter and order (``/bets?data->>contractId=eq.1`` and ``/bets?order=data->>contractId``) - @steve-chavez
 - #2861, Fix character and bit columns with fixed length not inserting/updating properly - @laurenceisla
   + Fixes the error "value too long for type character(1)" when the char length of the column was bigger than one.
 - #2862, Fix null filtering on embedded resource when using a column name equal to the relation name - @steve-chavez
 - #1586, Fix function parameters of type character and bit not ignoring length - @laurenceisla
   + Fixes the error "value too long for type character(1)" when the char length of the parameter was bigger than one.
 - #2881, Fix error when a function returns `RECORD` or `SET OF RECORD` - @laurenceisla
 - #2896, Fix applying superuser settings for impersonated role - @steve-chavez

### Deprecated

 - #2863, Deprecate resource embedding target disambiguation - @steve-chavez
   + The `/table?select=*,other!fk(*)` must be used to disambiguate
   + The server aids in choosing the `!fk` by sending a `hint` on the error whenever an ambiguous request happens.

## [11.1.0] - 2023-06-07

### Added

 - #2786, Limit idle postgresql connection lifetime - @robx
   + New option `db-pool-max-idletime` (default 30s).
   + This is equivalent to the old option `db-pool-timeout` of PostgREST 10.0.0.
   + A config alias for `db-pool-timeout` is included.
 - #2703, Add pre-config function - @steve-chavez
    + New config option `db-pre-config`(empty by default)
    + Allows using the in-database configuration without SUPERUSER
 - #2781, When `db-channel-enabled` is false, start automatic connection recovery on a new request when pool connections are closed with `pg_terminate_backend` - @steve-chavez
    + Mitigates the lack of LISTEN/NOTIFY for schema cache reloading on read replicas.

### Fixed

 - #2791, Fix dropping schema cache reload notifications  - @steve-chavez
 - #2801, Stop retrying connection when "no password supplied" - @steve-chavez

## [11.0.1] - 2023-04-27

### Fixed

 - #2762, Fixes "permission denied for schema" error during schema cache load - @steve-chavez
 - #2756, Fix bad error message on generated columns when using `Prefer: missing=default` - @steve-chavez
 - #1139, Allow a 30 second skew for JWT validation - @steve-chavez
   + It used to be 1 second, which was too strict

## [11.0.0] - 2023-04-16

### Added

 - #1414, Add related orders - @steve-chavez
   + On a many-to-one or one-to-one relationship, you can order a parent by a child column `/projects?select=*,clients(*)&order=clients(name).desc.nullsfirst`
 - #1233, #1907, #2566, Allow spreading embedded resources - @steve-chavez
   + On a many-to-one or one-to-one relationship, you can unnest a json object with `/projects?select=*,...clients(client_name:name)`
   + Allows including the join table columns when resource embedding
   + Allows disambiguating a recursive m2m embed
   + Allows disambiguating an embed that has a many-to-many relationship using two foreign keys on a junction
 - #2340, Allow embedding without selecting any column - @steve-chavez
 - #2563, Allow `is.null` or `not.is.null` on an embedded resource - @steve-chavez
   + Offers a more flexible replacement for `!inner`, e.g. `/projects?select=*,clients(*)&clients=not.is.null`
   + Allows doing an anti join, e.g. `/projects?select=*,clients(*)&clients=is.null`
   + Allows using or across related tables conditions
 - #1100, Customizable OpenAPI title - @AnthonyFisi
 - #2506, Add `server-trace-header` for tracing HTTP requests.  - @steve-chavez
   + When the client sends the request header specified in the config it will be included in the response headers.
 - #2694, Make `db-root-spec` stable. - @steve-chavez
   + This can be used to override the OpenAPI spec with a custom database function
 - #1567, On bulk inserts, missing values can get the column DEFAULT by using the `Prefer: missing=default` header - @steve-chavez
 - #2501, Allow filtering by`IS DISTINCT FROM` using the `isdistinct` operator, e.g. `/people?alias=isdistinct.foo`
 - #1569, Allow `any/all` modifiers on the `eq,like,ilike,gt,gte,lt,lte,match,imatch` operators, e.g. `/tbl?id=eq(any).{1,2,3}` - @steve-chavez
   - This converts the input into an array type
 - #2561, Configurable role settings - @steve-chavez
   - Database roles that are members of the connection role get their settings applied, e.g. doing
     `ALTER ROLE anon SET statement_timeout TO '5s'` will result in that `statement_timeout` getting applied for that role.
   - Works when switching roles when a JWT is sent
   - Settings can be reloaded with `NOTIFY pgrst, 'reload config'`.
 - #2468, Configurable transaction isolation level with `default_transaction_isolation` - @steve-chavez
   - Can be set per function `create function .. set default_transaction_isolation = 'repeatable read'`
   - Or per role `alter role .. set default_transaction_isolation = 'serializable'`

### Fixed

 - #2651, Add the missing `get` path item for RPCs to the OpenAPI output - @laurenceisla
 - #2648, Fix inaccurate error codes with new ones - @laurenceisla
   + `PGRST204`: Column is not found
   + `PGRST003`: Timed out when acquiring connection to db
 - #1652, Fix function call with arguments not inlining - @steve-chavez
 - #2705, Fix bug when using the `Range` header on `PATCH/DELETE` - @laurenceisla
   + Fix the`"message": "syntax error at or near \"RETURNING\""` error
   + Fix doing a limited update/delete when an `order` query parameter was present
 - #2742, Fix db settings and pg version queries not getting prepared  - @steve-chavez
 - #2618, Fix `PATCH` requests not recognizing embedded filters and using the top-level resource instead - @steve-chavez

### Changed

 - #2705, The `Range` header is now only considered on `GET` requests and is ignored for any other method - @laurenceisla
   + Other methods should use the `limit/offset` query parameters for sub-ranges
   + `PUT` requests no longer return an error when this header is present (using `limit/offset` still triggers the error)
 - #2733, Remove bulk RPC call with the `Prefer: params=multiple-objects` header. A function with a JSON array or object parameter should be used instead.

## [10.2.0] - 2023-04-12

### Added

 - #2663, Limit maximal postgresql connection lifetime - @robx
   + New option `db-pool-max-lifetime` (default 30m)
   + `db-pool-acquisition-timeout` is no longer optional and defaults to 10s
   + Fixes postgresql resource leak with long-lived connections (#2638)

### Fixed

 - #2667, Fix `db-pool-acquisition-timeout` not logging to stderr when the timeout is reached - @steve-chavez

## [10.1.2] - 2023-02-01

### Fixed

 - #2565, Fix bad M2M embedding on RPC - @steve-chavez
 - #2575, Replace misleading error message when no function is found with a hint containing functions/parameters names suggestions - @laurenceisla
 - #2582, Move explanation about "single parameters" from the `message` to the `details` in the error output - @laurenceisla
 - #2569, Replace misleading error message when no relationship is found with a hint containing parent/child names suggestions - @laurenceisla
 - #1405, Add the required OpenAPI items object when the parameter is an array - @laurenceisla
 - #2592, Add upsert headers for POST requests to the OpenAPI output - @laurenceisla
 - #2623, Fix FK pointing to VIEW instead of TABLE in OpenAPI output - @laurenceisla
 - #2622, Consider any PostgreSQL authentication failure as fatal and exit immediately - @michivi
 - #2620, Fix `NOTIFY pgrst` not reloading the db connections catalog cache - @steve-chavez

## [10.1.1] - 2022-11-08

### Fixed

 - #2548, Fix regression when embedding views with partial references to multi column FKs - @wolfgangwalther
 - #2558, Fix regression when requesting limit=0 and `db-max-row` is set - @laurenceisla
 - #2542, Return a clear error without hitting the database when trying to update or insert an unknown column with `?columns` - @aljungberg

## [10.1.0] - 2022-10-28

### Added

 - #2348, Add `db-pool-acquisition-timeout` configuration option, time in seconds to wait to acquire a connection. - @robx

### Fixed

 - #2261, #2349, #2467, Reduce allocations communication with PostgreSQL, particularly for request bodies. - @robx
 - #2401, #2444, Fix SIGUSR1 to fully flush connections pool. - @robx
 - #2428, Fix opening an empty transaction on failed resource embedding - @steve-chavez
 - #2455, Fix embedding the same table multiple times - @steve-chavez
 - #2518, Fix a regression when embedding views where base tables have a different column order for FK columns - @wolfgangwalther
 - #2458, Fix a regression with the location header when inserting into views with PKs from multiple tables - @wolfgangwalther
 - #2356, Fix a regression in openapi output with mode follow-privileges - @wolfgangwalther
 - #2283, Fix infinite recursion when loading schema cache with self-referencing view - @wolfgangwalther
 - #2343, Return status code 200 for PATCH requests which don't affect any rows - @wolfgangwalther
 - #2481, Treat computed relationships not marked SETOF as M2O/O2O relationship - @wolfgangwalther
 - #2534, Fix embedding a computed relationship with a normal relationship - @steve-chavez
 - #2362, Fix error message when [] is used inside select - @wolfgangwalther
 - #2475, Disallow !inner on computed columns - @wolfgangwalther
 - #2285, Ignore leading and trailing spaces in column names when parsing the query string - @wolfgangwalther
 - #2545, Fix UPSERT with PostgreSQL 15 - @wolfgangwalther
 - #2459, Fix embedding views with multiple references to the same base column - @wolfgangwalther

### Changed

 - #2444, Removed `db-pool-timeout` option, because this was removed upstream in hasql-pool. - @robx
 - #2343, PATCH requests that don't affect any rows no longer return 404 - @wolfgangwalther
 - #2537, Stricter parsing of query string. Instead of silently ignoring, the parser now throws on invalid syntax like json paths for embeddings, hints for regular columns, empty casts or fts languages, etc. - @wolfgangwalther

### Deprecated

 - #1385, Deprecate bulk-calls when including the `Prefer: params=multiple-objects` in the request. A function with a JSON array or object parameter should be used instead for a better performance.

## [10.0.0] - 2022-08-18

### Added

 - #1933, #2109, Add a minimal health check endpoint - @steve-chavez
   + For enabling this, the `admin-server-port` config must be set explicitly
   + A `<host>:<admin_server_port>/live` endpoint is available for checking if postgrest is running on its port/socket. 200 OK = alive, 503 = dead.
   + A `<host>:<admin_server_port>/ready` endpoint is available for checking a correct internal state(the database connection plus the schema cache). 200 OK = ready, 503 = not ready.
 - #1988, Add the current user to the request log on stdout - @DavidLindbom, @wolfgangwalther
 - #1823, Add the ability to run postgrest without any configuration. - @wolfgangwalther
   + #1991, Add the ability to run without `db-uri` using libpq's PG environment variables to connect. - @wolfgangwalther
   + #1769, Add the ability to run without `db-schemas`, defaulting to `db-schemas=public`. - @wolfgangwalther
   + #1689, Add the ability to run without `db-anon-role` disabling anonymous access. - @wolfgangwalther
 - #1543, Allow access to fields of composite types in select=, order= and filters through JSON operators -> and ->>. - @wolfgangwalther
 - #2075, Allow access to array items in ?select=, ?order= and filters through JSON operators -> and ->>. - @wolfgangwalther
 - #2156, #2211, Allow applying `limit/offset` to UPDATE/DELETE to only affect a subset of rows - @steve-chavez
   + It requires an explicit `order` on a unique column(s)
 - #1917, Add error codes with the `"PGRST"` prefix to the error response body to differentiate PostgREST errors from PostgreSQL errors - @laurenceisla
 - #1917, Normalize the error response body by always having the `detail` and `hint` error fields with a `null` value if they are empty - @laurenceisla
 - #2176, Errors raised with `SQLSTATE` now include the message and the code in the response body - @laurenceisla
 - #2236, Support POSIX regular expression operators for row filtering - @enote-kane
 - #2202, Allow returning XML from RPCs - @fjf2002
 - #2268, Allow returning XML from single-column queries - @fjf2002
 - #2300, RPC POST for function w/single unnamed XML param #2300 - @fjf2002
 - #1564, Allow geojson output by specifying the `Accept: application/geo+json` media type - @steve-chavez
   + Requires postgis >= 3.0
   + Works for GET, RPC, POST/PATCH/DELETE with `Prefer: return=representation`.
   + Resource embedding works and the embedded rows will go into the `properties` key
   + In case of multiple geometries in the same table, you can choose which one will go into the `geometry` key with the usual `?select` query parameter.
 - #1082, Add security definitions to the OpenAPI output - @laurenceisla
 - #2378, Support http OPTIONS method on RPC and root path - @steve-chavez
 - #2354, Allow getting the EXPLAIN plan of a request by using the `Accept: application/vnd.pgrst.plan` header - @steve-chavez
   + Only allowed if the `db-plan-enabled` config is set to true
   + Can generate the plan for different media types using the `for` parameter: `Accept: application/vnd.pgrst.plan; for="application/vnd.pgrst.object"`
   + Different options for the plan can be used with the `options` parameter: `Accept: application/vnd.pgrst.plan; options=analyze|verbose|settings|buffers|wal`
   + The plan can be obtained in text or json by using different media type suffixes: `Accept: application/vnd.pgrst.plan+text` and `Accept: application/vnd.pgrst.plan+json`.
 - #2144, Support computed relationships which allow extending and overriding relationships for resource embedding - @steve-chavez, @wolfgangwalther
 - #1984, Detect one-to-one relationships for resource embedding - @steve-chavez
   + Detected when there's a foreign key with a unique constraint or when a foreign key is also a primary key

### Fixed

 - #2058, Return 204 No Content without Content-Type for PUT - @wolfgangwalther
 - #2107, Clarify error for failed schema cache load. - @steve-chavez
   + From `Database connection lost. Retrying the connection` to `Could not query the database for the schema cache. Retrying.`
 - #1771, Fix silently ignoring filter on a non-existent embedded resource - @steve-chavez
 - #2152, Remove functions, which are uncallable because of unnamend arguments from schema cache and OpenAPI output. - @wolfgangwalther
 - #2145, Fix accessing json array fields with -> and ->> in ?select= and ?order=. - @wolfgangwalther
 - #2155, Ignore `max-rows` on POST, PATCH, PUT and DELETE - @steve-chavez
 - #2254, Fix inferring a foreign key column as a primary key column on views - @steve-chavez
 - #2070, Restrict generated many-to-many relationships - @steve-chavez
   + Only adds many-to-many relationships when: a table has FKs to two other tables and these FK columns are part of the table's PK columns.
 - #2278, Allow casting to types with underscores and numbers(e.g. `select=oid_array::_int4`) - @steve-chavez
 - #2277, #2238, #1643, Prevent views from breaking one-to-many/many-to-one embeds when using column or FK as target - @steve-chavez
    + When using a column or FK as target for embedding(`/tbl?select=*,col-or-fk(*)`), only tables are now detected and views are not.
    + You can still use a column or an inferred FK on a view to embed a table(`/view?select=*,col-or-fk(*)`)
 - #2317, Increase the `db-pool-timeout` to 1 hour to prevent frequent high connection latency - @steve-chavez
 - #2341, The search path now correctly identifies schemas with uppercase and special characters in their names (regression) - @laurenceisla
 - #2364, "404 Not Found" on nested routes and "405 Method Not Allowed" errors no longer start an empty database transaction - @steve-chavez
 - #2342, Fix inaccurate result count when an inner embed was selected after a normal embed in the query string - @laurenceisla
 - #2376, OPTIONS requests no longer start an empty database transaction - @steve-chavez
 - #2395, Allow using columns with dollar sign($) without double quoting in filters and `select` - @steve-chavez
 - #2410, Fix loop crash error on startup in Postgres 15 beta 3. Log: "UNION types \"char\" and text cannot be matched". - @yevon
 - #2397, Fix race conditions managing database connection helper - @robx
 - #2269, Allow `limit=0` in the request query to return an empty array - @gautam1168, @laurenceisla
 - #2401, Ensure database connections can't outlive SIGUSR1 - @robx

### Changed

 - #2001, Return 204 No Content without Content-Type for RPCs returning VOID - @wolfgangwalther
   + Previously, those RPCs would return "null" as a body with Content-Type: application/json.
 - #2156, `limit/offset` now limits the affected rows on UPDATE/DELETE  - @steve-chavez
   + Previously, `limit/offset` only limited the returned rows but not the actual updated rows
 - #2155, `max-rows` is no longer applied on POST/PATCH/PUT/DELETE returned rows - @steve-chavez
   + This was misleading because the affected rows were not really affected by `max-rows`, only the returned rows were limited
 - #2070, Restrict generated many-to-many relationships - @steve-chavez
   + A primary key that contains the foreign key columns is now needed for generating many-to-many relationships.
 - #2277, Views now are not detected when embedding using the column or FK as target (`/view?select=*,column(*)`) - @steve-chavez
   + This embedding form was easily made ambiguous whenever a new view was added.
   + You can use computed relationships to keep this embedding form working
 - #2312, Using `Prefer: return=representation` no longer returns a `Location` header - @laurenceisla
 - #1984, For the cases where one to one relationships are detected, json objects will be returned instead of json arrays of length 1
   + If you wish to override this behavior, you can use computed relationships to return arrays again
   + You can get the newly detected one-to-one relationships by using the `--dump-schema` option and filtering with [jq](https://github.com/jqlang/jq).
     ```
     ./postgrest --dump-schema  \
     | jq  '[.dbRelationships | .[] | .[1] | .[] | select(.relCardinality.tag == "O2O" and .relFTableIsView == false and .relTableIsView == false) | del(.relFTableIsView,.relTableIsView,.tag,.relIsSelf)]'
     ```

## [9.0.1] - 2022-06-03

### Fixed

- #2165, Fix json/jsonb columns should not have type in OpenAPI spec - @clrnd
- #2020, Execute deferred constraint triggers when using `Prefer: tx=rollback` - @wolfgangwalther
- #2077, Fix `is` not working with upper or mixed case values like `NULL, TrUe, FaLsE` - @steve-chavez
- #2024, Fix schema cache loading when views with XMLTABLE and DEFAULT are present - @wolfgangwalther
- #1724, Fix wrong CORS header Authentication -> Authorization - @wolfgangwalther
- #2120, Fix reading database configuration properly when `=` is present in value - @wolfgangwalther
- #2135, Remove trigger functions from schema cache and OpenAPI output, because they can't be called directly anyway. - @wolfgangwalther
- #2101, Remove aggregates, procedures and window functions from the schema cache and OpenAPI output. - @wolfgangwalther
- #2153, Fix --dump-schema running with a wrong PG version. - @wolfgangwalther
- #2042, Keep working when EMFILE(Too many open files) is reached. - @steve-chavez
- #2147, Ignore `Content-Type` headers for `GET` requests when calling RPCs. - @laurenceisla
    + Previously, `GET` without parameters, but with `Content-Type: text/plain` or `Content-Type: application/octet-stream` would fail with `404 Not Found`, even if a function without arguments was available.
- #2239, Fix misleading disambiguation error where the content of the `relationship` key looks like valid syntax - @laurenceisla
- #2294, Disable parallel GC for better performance on higher core CPUs - @steve-chavez
- #1076, Fix using CPU while idle - @steve-chavez

## [9.0.0] - 2021-11-25

### Added

 - #1783, Include partitioned tables into the schema cache. Allows embedding, UPSERT, INSERT with Location response, OPTIONS request and OpenAPI support for partitioned tables - @laurenceisla
 - #1878, Add Retry-After hint header when in recovery mode - @gautam1168
 - #1735, Allow calling function with single unnamed param through RPC POST. - @steve-chavez
   + Enables calling a function with a single json parameter without using `Prefer: params=single-object`
   + Enables uploading bytea to a function with `Content-Type: application/octet-stream`
   + Enables uploading raw text to a function with `Content-Type: text/plain`
 - #1938, Allow escaping inside double quotes with a backslash, e.g. `?col=in.("Double\"Quote")`, `?col=in.("Back\\slash")` - @steve-chavez
 - #1075, Allow filtering top-level resource based on embedded resources filters. This is enabled by adding `!inner` to the embedded resource, e.g. `/projects?select=*,clients!inner(*)&clients.id=eq.12`- @steve-chavez, @Iced-Sun
 - #1857, Make GUC names for headers, cookies and jwt claims compatible with PostgreSQL v14 - @laurenceisla, @robertsosinski
   + Getting the value for a header GUC on PostgreSQL 14 is done using `current_setting('request.headers')::json->>'name-of-header'` and in a similar way for `request.cookies` and `request.jwt.claims`
   + PostgreSQL versions below 14 can opt in to the new JSON GUCs by setting the `db-use-legacy-gucs` config option to false (true by default)
 - #1988, Allow specifying `unknown` for the `is` operator - @steve-chavez
 - #2031, Improve error message for ambiguous embedding and add a relevant hint that includes unambiguous embedding suggestions - @laurenceisla

### Fixed

 - #1871, Fix OpenAPI missing default values for String types and identify Array types as "array" instead of "string" - @laurenceisla
 - #1930, Fix RPC return type handling for `RETURNS TABLE` with a single column. Regression of #1615. - @wolfgangwalther
 - #1938, Fix using single double quotes(`"`) and backslashes(`/`) as values on the "in" operator - @steve-chavez
 - #1992, Fix schema cache query failing with standard_conforming_strings = off - @wolfgangwalther

### Changed

 - #1949, Drop support for embedding hints used with '.'(`select=projects.client_id(*)`), '!' should be used instead(`select=projects!client_id(*)`) - @steve-chavez
 - #1783, Partitions (created using `PARTITION OF`) are no longer included in the schema cache. - @laurenceisla
 - #2038, Dropped support for PostgreSQL 9.5 - @wolfgangwalther

## [8.0.0] - 2021-07-25

### Added

 - #1525, Allow http status override through response.status guc - @steve-chavez
 - #1512, Allow schema cache reloading with NOTIFY - @steve-chavez
 - #1119, Allow config file reloading with SIGUSR2 - @steve-chavez
 - #1558, Allow 'Bearer' with and without capitalization as authentication schema - @wolfgangwalther
 - #1470, Allow calling RPC with variadic argument by passing repeated params - @wolfgangwalther
 - #1559, No downtime when reloading the schema cache with SIGUSR1 - @steve-chavez
 - #504, Add `log-level` config option. The admitted levels are: crit, error, warn and info - @steve-chavez
 - #1607, Enable embedding through multiple views recursively - @wolfgangwalther
 - #1598, Allow rollback of the transaction with Prefer tx=rollback - @wolfgangwalther
 - #1633, Enable prepared statements for GET filters. When behind a connection pooler, you can disable preparing with `db-prepared-statements=false`
   + This increases throughput by around 30% for simple GET queries(no embedding, with filters applied).
 - #1729, #1760, Get configuration parameters from the db and allow reloading config with NOTIFY  - @steve-chavez
 - #1824, Allow OPTIONS to generate certain HTTP methods for a DB view - @laurenceisla
 - #1872, Show timestamps in startup/worker logs - @steve-chavez
 - #1881, Add `openapi-mode` config option that allows ignoring roles privileges when showing the OpenAPI output - @steve-chavez
 - CLI options(for debugging):
   + #1678, Add --dump-config CLI option that prints loaded config and exits - @wolfgangwalther
   + #1691, Add --example CLI option to show example config file - @wolfgangwalther
   + #1697, #1723, Add --dump-schema CLI option for debugging purposes - @monacoremo, @wolfgangwalther
 - #1794, (Experimental) Add `request.spec` GUC for db-root-spec - @steve-chavez

### Fixed

 - #1592, Removed single column restriction to allow composite foreign keys in join tables - @goteguru
 - #1530, Fix how the PostgREST version is shown in the help text when the `.git` directory is not available - @monacoremo
 - #1094, Fix expired JWTs starting an empty transaction on the db - @steve-chavez
 - #1162, Fix location header for POST request with select= without PK - @wolfgangwalther
 - #1585, Fix error messages on connection failure for localized postgres on Windows - @wolfgangwalther
 - #1636, Fix `application/octet-stream` appending `charset=utf-8` - @steve-chavez
 - #1469, #1638 Fix overloading of functions with unnamed arguments - @wolfgangwalther
 - #1560, Return 405 Method not Allowed for GET of volatile RPC instead of 500 - @wolfgangwalther
 - #1584, Fix RPC return type handling and embedding for domains with composite base type (#1615) - @wolfgangwalther
 - #1608, #1635, Fix embedding through views that have COALESCE with subselect - @wolfgangwalther
 - #1572, Fix parsing of boolean config values for Docker environment variables, now it accepts double quoted truth values ("true", "false") and numbers("1", "0") - @wolfgangwalther
 - #1624, Fix using `app.settings.xxx` config options in Docker, now they can be used as `PGRST_APP_SETTINGS_xxx` - @wolfgangwalther
 - #1814, Fix panic when attempting to run with unix socket on non-unix host and properly close unix domain socket on exit - @monacoremo
 - #1825, Disregard internal junction(in non-exposed schema) when embedding - @steve-chavez
 - #1846, Fix requests for overloaded functions from html forms to no longer hang (#1848) - @laurenceisla
 - #1858, Add a hint and clarification to the no relationship found error - @laurenceisla
 - #1841, Show comprehensive error when an RPC is not found in a stale schema cache - @laurenceisla
 - #1875, Fix Location headers in headers only representation for null PK inserts on views - @laurenceisla

### Changed

 - #1522, #1528, #1535, Docker images are now built from scratch based on a the static PostgREST executable (#1494) and with Nix instead of a `Dockerfile`. This reduces the compressed image size from over 30mb to about 4mb - @monacoremo
 - #1461, Location header for POST request is only included when PK is available on the table - @wolfgangwalther
 - #1560, Volatile RPC called with GET now returns 405 Method not Allowed instead of 500 - @wolfgangwalther
 - #1584, #1849 Functions that declare `returns composite_type` no longer return a single object array by default, only functions with `returns setof composite_type` return an array of objects - @wolfgangwalther
 - #1604, Change the default logging level to `log-level=error`. Only requests with a status greater or equal than 500 will be logged. If you wish to go back to the previous behaviour and log all the requests, use `log-level=info` - @steve-chavez
   + Because currently there's no buffering for logging, defaulting to the `error` level(minimum logging) increases throughput by around 15% for simple GET queries(no embedding, with filters applied).
 - #1617, Dropped support for PostgreSQL 9.4 - @wolfgangwalther
 - #1679, Renamed config settings with fallback aliases. e.g. `max-rows` is now `db-max-rows`, but `max-rows` is still accepted - @wolfgangwalther
 - #1656, Allow `Prefer=headers-only` on POST requests and change default to `minimal` (#1813) - @laurenceisla
 - #1854, Dropped undocumented support for gzip compression (which was surprisingly slow and easily enabled by mistake). In some use-cases this makes Postgres up to 3x faster - @aljungberg
 - #1872, Send startup/worker logs to stderr to differentiate from access logs on stdout - @steve-chavez

## [7.0.1] - 2020-05-18

### Fixed

- #1473, Fix overloaded computed columns on RPC - @wolfgangwalther
- #1471, Fix POST, PATCH, DELETE with ?select= and return=minimal and PATCH with empty body - @wolfgangwalther
- #1500, Fix missing `openapi-server-proxy-uri` config option - @steve-chavez
- #1508, Fix `Content-Profile` not working for POST RPC - @steve-chavez
- #1452, Fix PUT restriction for all columns - @steve-chavez

### Changed

- From this version onwards, the release page will only include a single Linux static executable that can be run on any Linux distribution.

## [7.0.0] - 2020-04-03

### Added

- #1417, `Accept: application/vnd.pgrst.object+json` behavior is now enforced for POST/PATCH/DELETE regardless of `Prefer: return=representation/minimal` - @dwagin
- #1415, Add support for user defined socket permission via `server-unix-socket-mode` config option - @Dansvidania
- #1383, Add support for HEAD request - @steve-chavez
- #1378, Add support for `Prefer: count=planned` and `Prefer: count=estimated` on GET /table - @steve-chavez, @LorenzHenk
- #1327, Add support for optional query parameter `on_conflict` to upsert with specified keys for POST - @ykst
- #1430, Allow specifying the foreign key constraint name(`/source?select=fk_constraint(*)`) to disambiguate an embedding - @steve-chavez
- #1168, Allow access to the `Authorization` header through the `request.header.authorization` GUC - @steve-chavez
- #1435, Add `request.method` and `request.path` GUCs - @steve-chavez
- #1088, Allow adding headers to GET/POST/PATCH/PUT/DELETE responses through the `response.headers` GUC - @steve-chavez
- #1427, Allow overriding provided headers(Location, Content-Type, etc) through the `response.headers` GUC - @steve-chavez
- #1450, Allow multiple schemas to be exposed in one instance. The schema to use can be selected through the headers `Accept-Profile` for GET/HEAD and `Content-Profile` for POST/PATCH/PUT/DELETE - @steve-chavez, @mahmoudkassem

### Fixed

- #1301, Fix self join resource embedding on PATCH - @herulume, @steve-chavez
- #1389, Fix many to many resource embedding on RPC/PATCH - @steve-chavez
- #1355, Allow PATCH/DELETE without `return=minimal` on tables with no select privileges - @steve-chavez
- #1361, Fix embedding a VIEW when its source foreign key is UNIQUE - @bwbroersma

### Changed

- #1385, bulk RPC call now should be done by specifying a `Prefer: params=multiple-objects` header - @steve-chavez
- #1401, resource embedding now outputs an error when multiple relationships between two tables are found - @steve-chavez
- #1423, default Unix Socket file mode from 755 to 660 - @dwagin
- #1430, Remove embedding with duck typed column names `GET /projects?select=client(*)`- @steve-chavez
  + You can rename the foreign key to `client` to make this request work in the new version: `alter table projects rename constraint projects_client_id_fkey to client`
- #1413, Change `server-proxy-uri` config option to `openapi-server-proxy-uri` - @steve-chavez

## [6.0.2] - 2019-08-22

### Fixed

- #1369, Change `raw-media-types` to accept a string of comma separated MIME types - @Dansvidania
- #1368, Fix long column descriptions being truncated at 63 characters in PostgreSQL 12 - @amedeedaboville
- #1348, Go back to converting plus "+" to space " " in querystrings by default - @steve-chavez

### Deprecated

- #1348, Deprecate `.` symbol for disambiguating resource embedding(added in #918). The url-safe '!' should be used instead. We refrained from using `+` as part of our syntax because it conflicts with some http clients and proxies.

## [6.0.1] - 2019-07-30

### Added

- #1349, Add user defined raw output media types via `raw-media-types` config option - @Dansvidania
- #1243, Add websearch_to_tsquery support - @herulume

### Fixed

- #1336, Error when testing on Chrome/Firefox: text/html requested but a single column was not selected - @Dansvidania
- #1334, Unable to compile v6.0.0 on windows - @steve-chavez

## [6.0.0] - 2019-06-21

### Added

- #1186, Add support for user defined unix socket via `server-unix-socket` config option - @Dansvidania
- #690, Add `?columns` query parameter for faster bulk inserts, also ignores unspecified json keys in a payload - @steve-chavez
- #1239, Add support for resource embedding on materialized views - @vitorbaptista
- #1264, Add support for bulk RPC call - @steve-chavez
- #1278, Add db-pool-timeout config option - @qu4tro
- #1285, Abort on wrong database password - @qu4tro
- #790, Allow override of OpenAPI spec through `root-spec` config option - @steve-chavez
- #1308, Accept `text/plain` and `text/html` for raw output - @steve-chavez


### Fixed

- #1223, Fix incorrect OpenAPI externalDocs url - @steve-chavez
- #1221, Fix embedding other resources when having a self join - @steve-chavez
- #1242, Fix embedding a view having a select in a where - @steve-chavez
- #1238, Fix PostgreSQL to OpenAPI type mappings for numeric and character types - @fpusch
- #1265, Fix query generated on bulk upsert with an empty array - @qu4tro
- #1273, Fix RPC ignoring unknown arguments by default - @steve-chavez
- #1257, Fix incorrect status when a PATCH request doesn't find rows to change - @qu4tro

### Changed

- #1288, Change server-host default of 127.0.0.1 to !4

### Deprecated

- #1288, Deprecate `.` symbol for disambiguating resource embedding(added in #918). '+' should be used instead. Though '+' is url safe, certain clients might need to encode it to '%2B'.

### Removed

- #1288, Removed support for schema reloading with SIGHUP, SIGUSR1 should be used instead - @steve-chavez

## [5.2.0] - 2018-12-12

### Added

- #1205, Add support for parsing JSON Web Key Sets - @russelldavies
- #1203, Add support for reading db-uri from a separate file - @zhoufeng1989
- #1200, Add db-extra-search-path config for adding schemas to the search_path, solves issues related to extensions created on the public schema - @steve-chavez
- #1219, Add ability to quote column names on filters - @steve-chavez

### Fixed

- #1182, Fix embedding on views with composite pks - @steve-chavez
- #1180, Fix embedding on views with subselects in pg10 - @steve-chavez
- #1197, Allow CORS for PUT - @bkylerussell
- #1181, Correctly qualify function argument of custom type in public schema - @steve-chavez
- #1008, Allow columns that contain spaces in filters - @steve-chavez

## [5.1.0] - 2018-08-31

### Added

- #1099, Add support for getting json/jsonb by array index - @steve-chavez
- #1145, Add materialized view columns to OpenAPI output - @steve-chavez
- #709, Allow embedding on views with subselects/CTE - @steve-chavez
- #1148, OpenAPI: add `required` section for the non-nullable columns - @laughedelic
- #1158, Add summary to OpenAPI doc for RPC functions - @mdr1384

### Fixed

- #1113, Fix UPSERT failing when having a camel case PK column - @steve-chavez
- #945, Fix slow start-up time on big schemas - @steve-chavez
- #1129, Fix view embedding when table is capitalized - @steve-chavez
- #1149, OpenAPI: Change `GET` response type to array - @laughedelic
- #1152, Fix RPC failing when having arguments with reserved or uppercase keywords - @mdr1384
- #905, Fix intermittent empty replies - @steve-chavez
- #1139, Fix JWTIssuedAtFuture failure for valid iat claim - @steve-chavez
- #1141, Fix app.settings resetting on pool timeout - @steve-chavez

### Changed

- #1099, Numbers in json path `?select=data->1->>key` now get treated as json array indexes instead of keys - @steve-chavez
- #1128, Allow finishing a json path with a single arrow `->`. Now a json can be obtained without resorting to casting, Previously: `/json_arr?select=data->>2::json`, now: `/json_arr?select=data->2` - @steve-chavez
- #724, Change server-host default of *4 to 127.0.0.1

### Deprecated

- #724, SIGHUP deprecated, SIGUSR1 should be used instead

## [0.5.0.0] - 2018-05-14

### Added

- The configuration (e.g. `postgrest.conf`) now accepts arbitrary settings that will be passed through as session-local database settings. This can be used to pass in secret keys directly as strings, or via OS environment variables. For instance: `app.settings.jwt_secret = "$(MYAPP_JWT_SECRET)"` will take `MYAPP_JWT_SECRET` from the environment and make it available to postgresql functions as `current_setting('app.settings.jwt_secret')`. Only `app.settings.*` values in the configuration file are treated in this way. - @canadaduane
- #256, Add support for bulk UPSERT with POST and single UPSERT with PUT - @steve-chavez
- #1078, Add ability to specify source column in embed - @steve-chavez
- #821, Allow embeds alias to be used in filters - @steve-chavez
- #906, Add jspath configurable `role-claim-key` - @steve-chavez
- #1061, Add foreign tables to OpenAPI output - @rhyamada

### Fixed

- #828, Fix computed column only working in public schema - @steve-chavez
- #925, Fix RPC high memory usage by using parametrized query and avoiding json encoding - @steve-chavez
- #987, Fix embedding with self-reference foreign key - @steve-chavez
- #1044, Fix view parent embedding when having many views - @steve-chavez
- #781, Fix accepting misspelled desc/asc ordering modificators - @onporat, @steve-chavez

### Changed

- #828, A `SET SCHEMA <db-schema>` is done on each request, this has the following implications:
  - Computed columns now only work if they belong to the db-schema
  - Stored procedures might require a `search_path` to work properly, for further details see https://postgrest.org/en/v5.0/api.html#explicit-qualification
- To use RPC now the `json_to_record/json_to_recordset` functions are needed, these are available starting from PostgreSQL 9.4 - @steve-chavez
- Overloaded functions now depend on the `dbStructure`, restart/sighup may be needed for their correct functioning - @steve-chavez
- #1098, Removed support for:
  + curly braces `{}` in embeds, i.e. `/clients?select=*,projects{*}` can no longer be used, from now on parens `()` should be used `/clients?select=*,projects(*)` - @steve-chavez
  + "in" operator without parens, i.e. `/clients?id=in.1,2,3` no longer supported, `/clients?id=in.(1,2,3)` should be used - @steve-chavez
  + "@@", "@>" and "<@" operators, from now on their mnemonic equivalents should be used "fts", "cs" and "cd" respectively - @steve-chavez

## [0.4.4.0] - 2018-01-08

### Added

- #887, #601, #1007, Allow specifying dictionary and plain/phrase tsquery in full text search - @steve-chavez
- #328, Allow doing GET on rpc - @steve-chavez
- #917, Add ability to map RAISE errorcode/message to http status - @steve-chavez
- #940, Add ability to map GUC to http response headers - @steve-chavez
- #1022, Include git sha in version report - @begriffs
- Faster queries using json_agg - @ruslantalpa

### Fixed

- #876, Read secret files as binary, discard final LF if any - @eric-brechemier
- #968, Treat blank proxy uri as missing - @begriffs
- #933, OpenAPI externals docs url to current version - @steve-chavez
- #962, OpenAPI don't err on nonexistent schema - @steve-chavez
- #954, make OpenAPI rpc output dependent on user privileges - @steve-chavez
- #955, Support configurable aud claim - @statik
- #996, Fix embedded column conflicts table name - @grotsev
- #974, Fix RPC error when function has single OUT param - @steve-chavez
- #1021, Reduce join size in allColumns for faster program start - @nextstopsun
- #411, Remove the need for pk in &select for parent embed - @steve-chavez
- #1016, Fix anonymous requests when configured with jwt-aud - @ruslantalpa

## [0.4.3.0] - 2017-09-06

### Added

- #567, Support more JWT signing algorithms, including RSA - @begriffs
- #889, Allow more than two conditions in a single and/or - @steve-chavez
- #883, Binary output support for RPC - @steve-chavez
- #885, Postgres COMMENTs on SCHEMA/TABLE/COLUMN are used for OpenAPI - @ldesgoui
- #907, Ability to embed using a specific relation when there are multiple between tables - @ruslantalpa
- #930, Split table comment on newline to get OpenAPI operation summary and description - @daurnimator
- #938, Support for range operators - @russelldavies

### Fixed

- #877, Base64 secret read from a file ending with a newline - @eric-brechemier
- #896, Boolean env var interpolation in config file - @begriffs
- #885, OpenAPI repetition reduced by using more definitions- @ldesgoui
- #924, Improve relations initialization time - @9too
- #927, Treat blank pre-request as missing - @begriffs

### Changed

- #938, Deprecate symbol operators with mnemonic names. - @russelldavies

## [0.4.2.0] - 2017-06-11

### Added

- #742, Add connection retrying on startup and SIGHUP - @steve-chavez
- #652, Add and/or params for complex boolean logic - @steve-chavez
- #808, Env var interpolation in config file (helps Docker) - @begriffs
- #878 - CSV output support for RPC - @begriffs

### Fixed

- #822, Treat blank string JWT secret as no secret - @begriffs

## [0.4.1.0] - 2017-04-25

### Added
- Allow requesting binary output on GET - @steve-chavez
- Accept clients requesting `Content-Type: application/json` from / - @feynmanliang
- #493, Updating with empty JSON object makes zero updates @koulakis
- Make HTTP headers and cookies available as GUCs #800 - @ruslantalpa
- #701, Ability to quote values on IN filters - @steve-chavez
- #641, Allow IN filter to have no values - @steve-chavez

### Fixed
- #827, Avoid Warp reaper, extend socket timeout to 1 hour - @majorcode
- #791, malformed nested JSON error - @diogob
- Resource embedding in views referencing tables in public schema - @fab1an
- #777, Empty body is allowed when calling a non-parameterized RPC - @koulakis
- #831, Fix proc resource embedding issue with search_path - @steve-chavez
- #547, Use read-only transaction for stable/immutable RPC - @begriffs

## [0.4.0.0] - 2017-01-19

### Added
- Allow test database to be on another host - @dsimunic
- `Prefer: params=single-object` to treat payload as single json argument in RPC - @dsimunic
- Ability to generate an OpenAPI spec - @mainx07, @hudayou, @ruslantalpa, @begriffs
- Ability to generate an OpenAPI spec behind a proxy - @hudayou
- Ability to set addresses to listen on - @hudayou
- Filtering, shaping and embedding with &select for the /rpc path - @ruslantalpa
- Output names of used-defined types (instead of 'USER-DEFINED') - @martingms
- Implement support for singular representation responses for POST/PATCH requests - @ehamberg
- Include RPC endpoints in OpenAPI output - @begriffs, @LogvinovLeon
- Custom request validation with `--pre-request` argument - @begriffs
- Ability to order by jsonb keys - @steve-chavez
- Ability to specify offset for a deeper level - @ruslantalpa
- Ability to use binary base64 encoded secrets - @TrevorBasinger

### Fixed
- Do not apply limit to parent items - @ruslantalpa
- Fix bug in relation detection when selecting parents two levels up by using the name of the FK - @ruslantalpa
- Customize content negotiation per route - @begriffs
- Allow using nulls order without explicit order direction - @steve-chavez
- Fatal error on postgres unsupported version, format supported version in error message - @steve-chavez
- Prevent database memory consumption by prepared statements caches - @ruslantalpa
- Use specific columns in the RETURNING section - @ruslantalpa
- Fix columns alias for RETURNING - @steve-chavez

### Changed
- Replace `Prefer: plurality=singular` with `Accept: application/vnd.pgrst.object` - @begriffs
- Standardize arrays in responses for `Prefer: return=representation` - @begriffs
- Calling unknown RPC gives 404, not 400 - @begriffs
- Use HTTP 400 for raise\_exception - @begriffs
- Remove non-OpenAPI schema description - @begriffs
- Use comma rather than semicolon to separate Prefer header values - @begriffs
- Omit total query count by default - @begriffs
- No more reserved `jwt_claims` return type - @begriffs
- HTTP 401 rather than 400 for expired JWT - @begriffs
- Remove default JWT secret - @begriffs
- Use GUC request.jwt.claim.foo rather than postgrest.claims.foo - @begriffs
- Use config file rather than command line arguments - @begriffs

## [0.3.2.0] - 2016-06-10

### Added
- Reload database schema on SIGHUP - @begriffs
- Support "-" in column names - @ruslantalpa
- Support column/node renaming `alias:column` - @ruslantalpa
- Accept posts from HTML forms - @begriffs
- Ability to order embedded entities - @ruslantalpa
- Ability to paginate using &limit and &offset parameters - @ruslantalpa
- Ability to apply limits to embedded entities and enforce --max-rows on all levels - @ruslantalpa, @begriffs
- Add allow response header in OPTIONS - @begriffs

### Fixed
- Return 401 or 403 for access denied rather than 404 - @begriffs
- Omit Content-Type header for empty body - @begriffs
- Prevent role from being changed twice - @begriffs
- Use read-only transaction for read requests - @ruslantalpa
- Include entities from the same parent table using two different foreign keys - @ruslantalpa
- Ensure that Location header in 201 response is URL-encoded - @league
- Fix garbage collector CPU leak - @ruslantalpa et al.
- Return deleted items when return=representation header is sent - @ruslantalpa
- Use table default values for empty object inserts - @begriffs

## [0.3.1.1] - 2016-03-28

### Fixed
- Preserve unicode values in insert,update,rpc (regression) - @begriffs
- Prevent duplicate call to stored procs (regression) - @begriffs
- Allow SQL functions to generate registered JWT claims - @begriffs
- Terminate gracefully on SIGTERM (for use in Docker) - @recmo
- Relation detection fix for views that depend on multiple tables - @ruslantalpa
- Avoid count on plurality=singular and allow multiple Prefer values - @ruslantalpa

## [0.3.1.0] - 2016-02-28

### Fixed
- Prevent query error from infecting later connection - @begriffs, @ruslantalpa, @nikita-volkov, @jwiegley

### Added
- Applies range headers to RPC calls - @diogob

## [0.3.0.4] - 2016-02-12

### Fixed
- Improved usage screen - @begriffs
- Reject non-POSTs to rpc endpoints - @begriffs
- Throw an error for OPTIONS on nonexistent tables - @calebmer
- Remove deadlock on simultaneous contentious updates - @ruslantalpa, @begriffs

## [0.3.0.3] - 2016-01-08

### Fixed
- Fix bug in many-many relation detection - @ruslantalpa
- Inconsistent escaping of table names in read queries - @calebmer

## [0.3.0.2] - 2015-12-16

### Fixed
- Miscalculation of time used for expiring tokens - @calebmer
- Remove bcrypt dependency to fix Windows build - @begriffs
- Detect relations event when authenticator does not have rights to intermediate tables - @ruslantalpa
- Ensure db connections released on sigint - @begriffs
- Fix #396 include records with missing parents - @ruslantalpa
- `pgFmtIdent` always quotes #388 - @calebmer
- Default schema, changed from `"1"` to `public` - @calebmer
- #414 revert to separate count query - @ruslantalpa
- Fix #399, allow inserting in tables with no select privileges using "Prefer: representation=minimal" - @ruslantalpa

### Added
- Allow order by computed columns - @diogob
- Set max rows in response with --max-rows - @begriffs
- Selection by column name (can detect if `_id` is not included) - @calebmer

## [0.3.0.1] - 2015-11-27

### Fixed
- Filter columns on embedded parent items - @ruslantalpa

## [0.3.0.0] - 2015-11-24

### Fixed
- Use reasonable amount of memory during bulk inserts - @begriffs

### Added
- Ensure JWT expires - @calebmer
- Postgres connection string argument - @calebmer
- Encode JWT for procs that return type `jwt_claims` - @diogob
- Full text operators `@>`,`<@` - @ruslantalpa
- Shaping of the response body (filter columns, embed relations) with &select parameter for POST/PATCH - @ruslantalpa
- Detect relationships between public views and private tables - @calebmer
- `Prefer: plurality=singular` for selecting single objects - @calebmer

### Removed
- API versioning feature - @calebmer
- `--db-x` command line arguments - @calebmer
- Secure flag - @calebmer
- PUT request handling - @ruslantalpa

### Changed
- Embed foreign keys with {} rather than () - @begriffs
- Remove version number from binary filename in release - @begriffs

## [0.2.12.1] - 2015-11-12

### Fixed
- Correct order for -> and ->> in a json path - @ruslantalpa
- Return empty array instead of 500 when a set returning function returns an empty result set - @diogob

## [0.2.12.0] - 2015-10-25

### Added
- Embed associations, e.g. `/film?select=*,director(*)` - @ruslantalpa
- Filter columns, e.g. `?select=col1,col2` - @ruslantalpa
- Does not execute the count total if header "Prefer: count=none" - @diogob

### Fixed
- Tolerate a missing role in user creation - @calebmer
- Avoid unnecessary text re-encoding - @ruslantalpa

## [0.2.11.1] - 2015-09-01

### Fixed
- Accepts `*/*` in Accept header - @diogob

## [0.2.11.0] - 2015-08-28
### Added
- Negate any filter in a uniform way, e.g. `?col=not.eq=foo` - @diogob
- Call stored procedures
- Filter NOT IN values, e.g. `?col=notin.1,2,3` - @rall
- CSV responses to GET requests with `Accept: text/csv` - @diogob
- Debian init scripts - @mkhon
- Allow filters by computed columns - @diogob

### Fixed
- Reset user role on error
- Compatible with Stack
- Add materialized views to results in GET / - @diogob
- Indicate insertable=true for views that are insertable through triggers - @diogob
- Builds under GHC 7.10
- Allow the use of columns named "count" in relations queried - @diogob

## [0.2.10.0] - 2015-06-03
### Added
- Full text search, eg `/foo?text_vector=@@.bar`
- Include auth id as well as db role to views (for row-level security)

## [0.2.9.1] - 2015-05-20
### Fixed
- Put -Werror behind a cabal flag (for CI) so Hackage accepts package

## [0.2.9.0] - 2015-05-20
### Added
- Return range headers in PATCH
- Return PATCHed resources if header "Prefer: return=representation"
- Allow nested objects and arrays in JSON post for jsonb columns
- JSON Web Tokens - [Federico Rampazzo](https://github.com/framp)
- Expose PostgREST as a Haskell package

### Fixed
- Return 404 if no records updated by PATCH

## [0.2.8.0] - 2015-04-17
### Added
- Option to specify nulls first or last, eg `/people?order=age.desc.nullsfirst`
- Filter nulls, `?col=is.null` and `?col=isnot.null`
- Filter within jsonb, `?col->a->>b=eq.c`
- Accept CSV in post body for bulk inserts

### Fixed
- Allow NULL values in posts
- Show full command line usage on param errors

## [0.2.7.0] - 2015-03-03
### Added
- Server response logging
- Filter IN values, e.g. `?col=in.1,2,3`
- Return POSTed resource if header "Prefer: return=representation"
- Allow override of default (v1) schema

## [0.2.6.0] - 2015-02-18
### Added
- A changelog
- Filter by substring match, e.g. `?col=like.*hello*` (or ilike for
  case insensitivity).
- Access-Control-Expose-Headers for CORS

### Fixed
- Make filter position match docs, e.g. `?order=col.asc` rather
  than `?order=asc.col`.
