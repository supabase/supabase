# Getting Started with Supabase Postgres


This guide covers getting up and running with Supabase Postgres. After reading this guide, you will understand:

* What Supabase Postgres provides and why you might want to use it
* How the project is organized and what each directory contains
* How to build and run Postgres with extensions locally
* The basics of working with the extension ecosystem

---

## What is Supabase Postgres?

Supabase Postgres is a batteries-included PostgreSQL distribution that provides unmodified PostgreSQL with a curated set of the most useful extensions pre-installed. Think of it as PostgreSQL with superpowers - you get the reliability and power of standard PostgreSQL, plus immediate access to extensions for tasks like:

* Full-text search and indexing
* Geospatial data processing
* Time-series data management
* JSON validation and GraphQL support
* Cryptography and security
* Message queuing
* And much more

The goal is simple: make it fast and easy to get started with a production-ready PostgreSQL setup without having to hunt down, compile, and configure dozens of extensions yourself.

## Philosophy

Supabase Postgres follows these core principles:

1. **Unmodified PostgreSQL** - We don't fork or modify PostgreSQL itself. You get standard PostgreSQL with extensions.
2. **Curated Extensions** - We include well-maintained, production-tested extensions that solve real problems.
3. **Multi-version Support** - Currently supporting PostgreSQL 15, 17, and OrioleDB-17.
4. **Ready for Production** - Configured with sensible defaults for replication, security, and performance.
5. **Open Source** - Everything is open source and can be self-hosted.

## Directory Structure

Here's a comprehensive overview of the project's directory structure:

| File/Directory | Purpose |
| -------------- | ------- |
| **nix/** | Core build system directory containing all Nix expressions for building PostgreSQL and extensions |
| nix/postgresql/ | PostgreSQL version configurations, patches, and base package definitions |
| nix/ext/ | Individual extension package definitions and build configurations |
| nix/ext/wrappers/ | Wrapper scripts and utilities for extensions |
| nix/ext/tests/ | Extension-specific integration test suites implemented using nixos-test|
| nix/overlays/ | Nix overlays for customizing and overriding package definitions |
| nix/tools/ | Build tools, utilities, and helper scripts |
| nix/docker/ | Docker image build definitions using Nix |
| nix/tests/ | postgres specific test suites for validating builds, including pg_regress tests |
| nix/tests/smoke/ | Quick smoke tests for basic functionality |
| nix/tests/migrations/ | Migration and upgrade test scenarios |
| nix/tests/expected/ | Expected `pg_regress` test outputs for validation |
| nix/tests/sql/ | SQL test scripts that are run in `pg_regress` tests |
| nix/docs/ | Build system documentation |
| **ansible/** | Infrastructure as Code for server configuration and deployment of production hosted AWS AMI image |
| ansible/playbook.yml | Main Ansible playbook for PostgreSQL/PostgREST/pgbouncer/Auth server setup |
| ansible/tasks/ | Modular Ansible tasks for specific configuration steps |
| ansible/files/ | Static files, scripts, and templates used by Ansible |
| ansible/vars.yml | AMI version tracking, legacy package version tracking |
| **migrations/** | Database migration management and upgrade tools |
| migrations/db/ | Database schema migrations |
| migrations/db/migrations/ | Individual migration files |
| migrations/db/init-scripts/ | Database initialization scripts |
| migrations/tests/ | Migration testing infrastructure |
| migrations/tests/database/ | Database-specific migration tests |
| migrations/tests/storage/ | Storage-related migration tests |
| migrations/tests/extensions/ | Extension migration tests |
| Dockerfile-15 | Docker image definition for PostgreSQL 15 |
| Dockerfile-17 | Docker image definition for PostgreSQL 17 |
| **tests/** | Integration and system tests |
| testinfra/ | Infrastructure tests using pytest framework |
| tests/ | General integration test suites |
| **docs/** | Additional documentation, images, and resources |
| **ebssurrogate/** | AWS EBS surrogate building for AMI creation |
| **http/** | HTTP-related configurations and files |
| **rfcs/** | Request for Comments - design documents and proposals |
| **db/** | Database-related utilities and configurations |
| **.github/** | GitHub-specific configurations (Actions, templates, etc.) |
| **Root Config Files** |  |
| .gitignore | Git ignore patterns |
| .envrc.recommended | Recommended environment variables for development |
| amazon-arm64-nix.pkr.hcl | Packer configuration for AWS ARM64 builds |
| common-nix.vars.pkr.hcl | Common Packer variables |
| development-arm64.vars.pkr.hcl | ARM development environment variables |
| CONTRIBUTING.md | Contribution guidelines |
| README.md | Main project documentation |

## Key Concepts

### Extensions

Extensions are the superpower of PostgreSQL. They add functionality without modifying the core database. Supabase Postgres includes dozens of pre-built extensions covering:

* **Data Types & Validation** - pg_jsonschema, pg_hashids
* **Search & Indexing** - pgroonga, rum, hypopg
* **Geospatial** - PostGIS, pgrouting
* **Time-series** - TimescaleDB
* **Security** - pgsodium, vault, pgaudit
* **Development** - pgtap, plpgsql_check
* **And many more...**

### Multi-version Support

The project supports multiple PostgreSQL versions simultaneously:

* **PostgreSQL 15** - Stable, battle-tested version
* **PostgreSQL 17** - Latest features and improvements
* **OrioleDB-17** - Experimental storage engine for PostgreSQL 17

Each version has its own set of compatible extensions defined in the Nix build system.

### Build System (Nix)

The project uses Nix as its build system, which provides:

* **Reproducible Builds** - Same input always produces the same output
* **Declarative Configuration** - Define what you want, not how to build it
* **Dependency Management** - Automatic handling of complex dependency trees
* **Cross-platform Support** - Build for Linux, macOS, and more

## Common Tasks

To skip hours of building and download packages instead, start using the Supabase Postgres Nix binary cache: [nix/docs/binary-cache.md](nix/docs/binary-cache.md).

### Building Locally

To build PostgreSQL with extensions locally:

```bash
# Build PostgreSQL 15 with extensions
nix build .#psql_15/bin

# Build PostgreSQL 17
nix build .#psql_17/bin

# Build a specific extension
nix build .#psql_17/exts/pg_graphql
```

### Running Tests

```bash
# Run all tests
nix flake check -L

# Run specific test suite (for macos apple silicon for example)
nix build .#checks.aarch64-darwin.psql_17 -L
```

### Creating Docker Images

```bash
# Build Docker image for PostgreSQL 15
docker build -f Dockerfile-15 -t supabase-postgres:15 .

# Build Docker image for PostgreSQL 17
docker build -f Dockerfile-17 -t supabase-postgres:17 .
```

## Next Steps

Now that you understand the basics of Supabase Postgres:

* Check the [build guide](nix/docs/build-postgres.md) and [Docker docs](nix/docs/docker.md) for deployment options
* Explore the [Extension Documentation](#) to learn about available extensions
* Review [Contributing Guidelines](CONTRIBUTING.md) if you want to contribute
* Join the [Supabase Community](https://github.com/supabase/postgres/discussions) for questions and discussions

## Getting Help

* **GitHub Issues** - For bugs and feature requests
* **Discussions** - For questions and general discussion
* **[nix/docs](nix/docs/README.md)** - For detailed documentation
* **Discord** - For real-time chat with the community

---

This is the same PostgreSQL build that powers [Supabase](https://supabase.io), battle-tested in production by over one million projects.


## Primary Features
- ✅ Postgres [postgresql-15.19](https://www.postgresql.org/docs/15/index.html)
- ✅ Postgres [postgresql-17.11](https://www.postgresql.org/docs/17/index.html)
- ✅ Postgres [orioledb-postgresql-17_11](https://github.com/orioledb/orioledb)
- ✅ Ubuntu 24.04 (Noble Numbat).
- ✅ [wal_level](https://www.postgresql.org/docs/current/runtime-config-wal.html) = logical and [max_replication_slots](https://www.postgresql.org/docs/current/runtime-config-replication.html) = 5. Ready for replication.
- ✅ [Large Systems Extensions](https://github.com/aws/aws-graviton-getting-started#building-for-graviton-and-graviton2). Enabled for ARM images.
## Extensions

### PostgreSQL 15 Extensions
| Extension | Version | Description |
| ------------- | :-------------: | ------------- |
| [http]() | [1.6]() |  |
| [hypopg]() | [1.4.1]() |  |
| [index_advisor]() | [0.2.0]() |  |
| [pg-safeupdate](https://github.com/eradman/pg-safeupdate/archive/1.4.tar.gz) | [1.4](https://github.com/eradman/pg-safeupdate/archive/1.4.tar.gz) | A simple extension to PostgreSQL that requires criteria for UPDATE and DELETE |
| [pg_cron]() | [1.6.4]() | Run Cron jobs through PostgreSQL (multi-version compatible) |
| [pg_graphql](https://github.com/supabase/pg_graphql/archive/v1.5.11.tar.gz) | [1.5.11](https://github.com/supabase/pg_graphql/archive/v1.5.11.tar.gz) | GraphQL support for PostreSQL |
| [pg_hashids](https://github.com/iCyberon/pg_hashids/archive/cd0e1b31d52b394a0df64079406a14a4f7387cd6.tar.gz) | [cd0e1b31d52b394a0df64079406a14a4f7387cd6](https://github.com/iCyberon/pg_hashids/archive/cd0e1b31d52b394a0df64079406a14a4f7387cd6.tar.gz) | Generate short unique IDs in PostgreSQL |
| [pg_jsonschema](https://github.com/supabase/pg_jsonschema/archive/v0.3.3.tar.gz) | [0.3.3](https://github.com/supabase/pg_jsonschema/archive/v0.3.3.tar.gz) | JSON Schema Validation for PostgreSQL |
| [pg_net]() | [0.8.0]() |  |
| [pg_plan_filter](https://github.com/pgexperts/pg_plan_filter/archive/5081a7b5cb890876e67d8e7486b6a64c38c9a492.tar.gz) | [5081a7b5cb890876e67d8e7486b6a64c38c9a492](https://github.com/pgexperts/pg_plan_filter/archive/5081a7b5cb890876e67d8e7486b6a64c38c9a492.tar.gz) | Filter PostgreSQL statements by execution plans |
| [pg_repack](https://github.com/reorg/pg_repack/archive/ver_1.5.2.tar.gz) | [1.5.2](https://github.com/reorg/pg_repack/archive/ver_1.5.2.tar.gz) | Reorganize tables in PostgreSQL databases with minimal locks |
| [pg_stat_monitor](https://github.com/percona/pg_stat_monitor/archive/refs/tags/2.1.0.tar.gz) | [2.1.0](https://github.com/percona/pg_stat_monitor/archive/refs/tags/2.1.0.tar.gz) | Query Performance Monitoring Tool for PostgreSQL |
| [pg_tle](https://github.com/aws/pg_tle/archive/refs/tags/v1.4.0.tar.gz) | [1.4.0](https://github.com/aws/pg_tle/archive/refs/tags/v1.4.0.tar.gz) | Framework for 'Trusted Language Extensions' in PostgreSQL |
| [pgaudit](https://github.com/pgaudit/pgaudit/archive/1.7.0.tar.gz) | [1.7.0](https://github.com/pgaudit/pgaudit/archive/1.7.0.tar.gz) | Open Source PostgreSQL Audit Logging |
| [pgjwt](https://github.com/michelp/pgjwt/archive/9742dab1b2f297ad3811120db7b21451bca2d3c9.tar.gz) | [9742dab1b2f297ad3811120db7b21451bca2d3c9](https://github.com/michelp/pgjwt/archive/9742dab1b2f297ad3811120db7b21451bca2d3c9.tar.gz) | PostgreSQL implementation of JSON Web Tokens |
| [pgmq](https://github.com/tembo-io/pgmq/archive/v1.4.4.tar.gz) | [1.4.4](https://github.com/tembo-io/pgmq/archive/v1.4.4.tar.gz) | A lightweight message queue. Like AWS SQS and RSMQ but on Postgres. |
| [pgroonga](https://packages.groonga.org/source/pgroonga/pgroonga-3.2.5.tar.gz) | [3.2.5](https://packages.groonga.org/source/pgroonga/pgroonga-3.2.5.tar.gz) | A PostgreSQL extension to use Groonga as the index |
| [pgrouting](https://github.com/pgRouting/pgrouting/archive/v3.4.1.tar.gz) | [3.4.1](https://github.com/pgRouting/pgrouting/archive/v3.4.1.tar.gz) | A PostgreSQL/PostGIS extension that provides geospatial routing functionality |
| [pgsodium]() | [3.1.8]() |  |
| [pgtap](https://github.com/theory/pgtap/archive/v1.2.0.tar.gz) | [1.2.0](https://github.com/theory/pgtap/archive/v1.2.0.tar.gz) | A unit testing framework for PostgreSQL |
| [plpgsql-check](https://github.com/okbob/plpgsql_check/archive/v2.7.11.tar.gz) | [2.7.11](https://github.com/okbob/plpgsql_check/archive/v2.7.11.tar.gz) | Linter tool for language PL/pgSQL |
| [plv8](https://github.com/plv8/plv8/archive/v3.1.10.tar.gz) | [3.1.10](https://github.com/plv8/plv8/archive/v3.1.10.tar.gz) | V8 Engine Javascript Procedural Language add-on for PostgreSQL |
| [postgis](https://download.osgeo.org/postgis/source/postgis-3.3.7.tar.gz) | [3.3.7](https://download.osgeo.org/postgis/source/postgis-3.3.7.tar.gz) | Geographic Objects for PostgreSQL |
| [rum]() | [1.3]() |  |
| [supautils](https://github.com/supabase/supautils/archive/refs/tags/v2.9.4.tar.gz) | [2.9.4](https://github.com/supabase/supautils/archive/refs/tags/v2.9.4.tar.gz) | PostgreSQL extension for enhanced security |
| [timescaledb]() | [2.9.1]() |  |
| [vault](https://github.com/supabase/vault/archive/refs/tags/v0.3.1.tar.gz) | [0.3.1](https://github.com/supabase/vault/archive/refs/tags/v0.3.1.tar.gz) | Store encrypted secrets in PostgreSQL |
| [vector]() | [0.8.0]() |  |
| [wal2json](https://github.com/eulerto/wal2json/archive/wal2json_2_6.tar.gz) | [2_6](https://github.com/eulerto/wal2json/archive/wal2json_2_6.tar.gz) | PostgreSQL JSON output plugin for changeset extraction |
| [wrappers]() | [0.5.4]() |  |

### PostgreSQL 17 Extensions
| Extension | Version | Description |
| ------------- | :-------------: | ------------- |
| [http]() | [1.6]() |  |
| [hypopg]() | [1.4.1]() |  |
| [index_advisor]() | [0.2.0]() |  |
| [pg-safeupdate](https://github.com/eradman/pg-safeupdate/archive/1.4.tar.gz) | [1.4](https://github.com/eradman/pg-safeupdate/archive/1.4.tar.gz) | A simple extension to PostgreSQL that requires criteria for UPDATE and DELETE |
| [pg_cron]() | [1.6.4]() | Run Cron jobs through PostgreSQL (multi-version compatible) |
| [pg_graphql](https://github.com/supabase/pg_graphql/archive/v1.5.11.tar.gz) | [1.5.11](https://github.com/supabase/pg_graphql/archive/v1.5.11.tar.gz) | GraphQL support for PostreSQL |
| [pg_hashids](https://github.com/iCyberon/pg_hashids/archive/cd0e1b31d52b394a0df64079406a14a4f7387cd6.tar.gz) | [cd0e1b31d52b394a0df64079406a14a4f7387cd6](https://github.com/iCyberon/pg_hashids/archive/cd0e1b31d52b394a0df64079406a14a4f7387cd6.tar.gz) | Generate short unique IDs in PostgreSQL |
| [pg_jsonschema](https://github.com/supabase/pg_jsonschema/archive/v0.3.3.tar.gz) | [0.3.3](https://github.com/supabase/pg_jsonschema/archive/v0.3.3.tar.gz) | JSON Schema Validation for PostgreSQL |
| [pg_net]() | [0.19.5]() |  |
| [pg_plan_filter](https://github.com/pgexperts/pg_plan_filter/archive/5081a7b5cb890876e67d8e7486b6a64c38c9a492.tar.gz) | [5081a7b5cb890876e67d8e7486b6a64c38c9a492](https://github.com/pgexperts/pg_plan_filter/archive/5081a7b5cb890876e67d8e7486b6a64c38c9a492.tar.gz) | Filter PostgreSQL statements by execution plans |
| [pg_repack](https://github.com/reorg/pg_repack/archive/ver_1.5.2.tar.gz) | [1.5.2](https://github.com/reorg/pg_repack/archive/ver_1.5.2.tar.gz) | Reorganize tables in PostgreSQL databases with minimal locks |
| [pg_stat_monitor](https://github.com/percona/pg_stat_monitor/archive/refs/tags/2.1.0.tar.gz) | [2.1.0](https://github.com/percona/pg_stat_monitor/archive/refs/tags/2.1.0.tar.gz) | Query Performance Monitoring Tool for PostgreSQL |
| [pg_tle](https://github.com/aws/pg_tle/archive/refs/tags/v1.4.0.tar.gz) | [1.4.0](https://github.com/aws/pg_tle/archive/refs/tags/v1.4.0.tar.gz) | Framework for 'Trusted Language Extensions' in PostgreSQL |
| [pgaudit](https://github.com/pgaudit/pgaudit/archive/17.0.tar.gz) | [17.0](https://github.com/pgaudit/pgaudit/archive/17.0.tar.gz) | Open Source PostgreSQL Audit Logging |
| [pgjwt](https://github.com/michelp/pgjwt/archive/9742dab1b2f297ad3811120db7b21451bca2d3c9.tar.gz) | [9742dab1b2f297ad3811120db7b21451bca2d3c9](https://github.com/michelp/pgjwt/archive/9742dab1b2f297ad3811120db7b21451bca2d3c9.tar.gz) | PostgreSQL implementation of JSON Web Tokens |
| [pgmq](https://github.com/tembo-io/pgmq/archive/v1.4.4.tar.gz) | [1.4.4](https://github.com/tembo-io/pgmq/archive/v1.4.4.tar.gz) | A lightweight message queue. Like AWS SQS and RSMQ but on Postgres. |
| [pgroonga](https://packages.groonga.org/source/pgroonga/pgroonga-3.2.5.tar.gz) | [3.2.5](https://packages.groonga.org/source/pgroonga/pgroonga-3.2.5.tar.gz) | A PostgreSQL extension to use Groonga as the index |
| [pgrouting](https://github.com/pgRouting/pgrouting/archive/v3.4.1.tar.gz) | [3.4.1](https://github.com/pgRouting/pgrouting/archive/v3.4.1.tar.gz) | A PostgreSQL/PostGIS extension that provides geospatial routing functionality |
| [pgsodium]() | [3.1.8]() |  |
| [pgtap](https://github.com/theory/pgtap/archive/v1.2.0.tar.gz) | [1.2.0](https://github.com/theory/pgtap/archive/v1.2.0.tar.gz) | A unit testing framework for PostgreSQL |
| [plpgsql-check](https://github.com/okbob/plpgsql_check/archive/v2.7.11.tar.gz) | [2.7.11](https://github.com/okbob/plpgsql_check/archive/v2.7.11.tar.gz) | Linter tool for language PL/pgSQL |
| [postgis](https://download.osgeo.org/postgis/source/postgis-3.3.7.tar.gz) | [3.3.7](https://download.osgeo.org/postgis/source/postgis-3.3.7.tar.gz) | Geographic Objects for PostgreSQL |
| [rum]() | [1.3]() |  |
| [supautils](https://github.com/supabase/supautils/archive/refs/tags/v2.9.4.tar.gz) | [2.9.4](https://github.com/supabase/supautils/archive/refs/tags/v2.9.4.tar.gz) | PostgreSQL extension for enhanced security |
| [vault](https://github.com/supabase/vault/archive/refs/tags/v0.3.1.tar.gz) | [0.3.1](https://github.com/supabase/vault/archive/refs/tags/v0.3.1.tar.gz) | Store encrypted secrets in PostgreSQL |
| [vector]() | [0.8.0]() |  |
| [wal2json](https://github.com/eulerto/wal2json/archive/wal2json_2_6.tar.gz) | [2_6](https://github.com/eulerto/wal2json/archive/wal2json_2_6.tar.gz) | PostgreSQL JSON output plugin for changeset extraction |
| [wrappers]() | [0.5.4]() |  |

### PostgreSQL orioledb-17 Extensions
| Extension | Version | Description |
| ------------- | :-------------: | ------------- |
| [http]() | [1.6]() |  |
| [hypopg]() | [1.4.1]() |  |
| [index_advisor]() | [0.2.0]() |  |
| [orioledb](https://github.com/orioledb/orioledb/archive/beta12.tar.gz) | [orioledb](https://github.com/orioledb/orioledb/archive/beta12.tar.gz) | orioledb |
| [pg-safeupdate](https://github.com/eradman/pg-safeupdate/archive/1.4.tar.gz) | [1.4](https://github.com/eradman/pg-safeupdate/archive/1.4.tar.gz) | A simple extension to PostgreSQL that requires criteria for UPDATE and DELETE |
| [pg_cron]() | [1.6.4]() | Run Cron jobs through PostgreSQL (multi-version compatible) |
| [pg_graphql](https://github.com/supabase/pg_graphql/archive/v1.5.11.tar.gz) | [1.5.11](https://github.com/supabase/pg_graphql/archive/v1.5.11.tar.gz) | GraphQL support for PostreSQL |
| [pg_hashids](https://github.com/iCyberon/pg_hashids/archive/cd0e1b31d52b394a0df64079406a14a4f7387cd6.tar.gz) | [cd0e1b31d52b394a0df64079406a14a4f7387cd6](https://github.com/iCyberon/pg_hashids/archive/cd0e1b31d52b394a0df64079406a14a4f7387cd6.tar.gz) | Generate short unique IDs in PostgreSQL |
| [pg_jsonschema](https://github.com/supabase/pg_jsonschema/archive/v0.3.3.tar.gz) | [0.3.3](https://github.com/supabase/pg_jsonschema/archive/v0.3.3.tar.gz) | JSON Schema Validation for PostgreSQL |
| [pg_net]() | [0.19.5]() |  |
| [pg_plan_filter](https://github.com/pgexperts/pg_plan_filter/archive/5081a7b5cb890876e67d8e7486b6a64c38c9a492.tar.gz) | [5081a7b5cb890876e67d8e7486b6a64c38c9a492](https://github.com/pgexperts/pg_plan_filter/archive/5081a7b5cb890876e67d8e7486b6a64c38c9a492.tar.gz) | Filter PostgreSQL statements by execution plans |
| [pg_repack](https://github.com/reorg/pg_repack/archive/ver_1.5.2.tar.gz) | [1.5.2](https://github.com/reorg/pg_repack/archive/ver_1.5.2.tar.gz) | Reorganize tables in PostgreSQL databases with minimal locks |
| [pg_stat_monitor](https://github.com/percona/pg_stat_monitor/archive/refs/tags/2.1.0.tar.gz) | [2.1.0](https://github.com/percona/pg_stat_monitor/archive/refs/tags/2.1.0.tar.gz) | Query Performance Monitoring Tool for PostgreSQL |
| [pg_tle](https://github.com/aws/pg_tle/archive/refs/tags/v1.4.0.tar.gz) | [1.4.0](https://github.com/aws/pg_tle/archive/refs/tags/v1.4.0.tar.gz) | Framework for 'Trusted Language Extensions' in PostgreSQL |
| [pgaudit](https://github.com/pgaudit/pgaudit/archive/17.0.tar.gz) | [17.0](https://github.com/pgaudit/pgaudit/archive/17.0.tar.gz) | Open Source PostgreSQL Audit Logging |
| [pgjwt](https://github.com/michelp/pgjwt/archive/9742dab1b2f297ad3811120db7b21451bca2d3c9.tar.gz) | [9742dab1b2f297ad3811120db7b21451bca2d3c9](https://github.com/michelp/pgjwt/archive/9742dab1b2f297ad3811120db7b21451bca2d3c9.tar.gz) | PostgreSQL implementation of JSON Web Tokens |
| [pgmq](https://github.com/tembo-io/pgmq/archive/v1.4.4.tar.gz) | [1.4.4](https://github.com/tembo-io/pgmq/archive/v1.4.4.tar.gz) | A lightweight message queue. Like AWS SQS and RSMQ but on Postgres. |
| [pgroonga](https://packages.groonga.org/source/pgroonga/pgroonga-3.2.5.tar.gz) | [3.2.5](https://packages.groonga.org/source/pgroonga/pgroonga-3.2.5.tar.gz) | A PostgreSQL extension to use Groonga as the index |
| [pgrouting](https://github.com/pgRouting/pgrouting/archive/v3.4.1.tar.gz) | [3.4.1](https://github.com/pgRouting/pgrouting/archive/v3.4.1.tar.gz) | A PostgreSQL/PostGIS extension that provides geospatial routing functionality |
| [pgsodium]() | [3.1.8]() |  |
| [pgtap](https://github.com/theory/pgtap/archive/v1.2.0.tar.gz) | [1.2.0](https://github.com/theory/pgtap/archive/v1.2.0.tar.gz) | A unit testing framework for PostgreSQL |
| [plpgsql-check](https://github.com/okbob/plpgsql_check/archive/v2.7.11.tar.gz) | [2.7.11](https://github.com/okbob/plpgsql_check/archive/v2.7.11.tar.gz) | Linter tool for language PL/pgSQL |
| [postgis](https://download.osgeo.org/postgis/source/postgis-3.3.7.tar.gz) | [3.3.7](https://download.osgeo.org/postgis/source/postgis-3.3.7.tar.gz) | Geographic Objects for PostgreSQL |
| [rum]() | [1.3]() |  |
| [supautils](https://github.com/supabase/supautils/archive/refs/tags/v2.9.4.tar.gz) | [2.9.4](https://github.com/supabase/supautils/archive/refs/tags/v2.9.4.tar.gz) | PostgreSQL extension for enhanced security |
| [vault](https://github.com/supabase/vault/archive/refs/tags/v0.3.1.tar.gz) | [0.3.1](https://github.com/supabase/vault/archive/refs/tags/v0.3.1.tar.gz) | Store encrypted secrets in PostgreSQL |
| [vector]() | [0.8.0]() |  |
| [wal2json](https://github.com/eulerto/wal2json/archive/wal2json_2_6.tar.gz) | [2_6](https://github.com/eulerto/wal2json/archive/wal2json_2_6.tar.gz) | PostgreSQL JSON output plugin for changeset extraction |
| [wrappers]() | [0.5.4]() |  |
## Additional Goodies
*This is only available for our AWS EC2*

| Goodie | Version | Description |
| ------------- | :-------------: | ------------- |
| [PgBouncer](https://www.pgbouncer.org/) | [1.19.0](http://www.pgbouncer.org/changelog.html#pgbouncer-119x) | Set up Connection Pooling. |
| [PostgREST](https://postgrest.org/en/stable/) | [v14.18](https://github.com/PostgREST/postgrest/releases/tag/v14.18) | Instantly transform your database into an RESTful API. |
| [WAL-G](https://github.com/wal-g/wal-g#wal-g) | [v2.0.1](https://github.com/wal-g/wal-g/releases/tag/v2.0.1) | Tool for physical database backup and recovery. | -->


## Install

See the [documentation index](nix/docs/README.md) for installation instructions.

[![Docker](https://github.com/supabase/postgres/blob/develop/docs/img/docker.png)](nix/docs/docker.md)

<!-- ### Marketplace Images
TODO: find way to automate this
|   | Postgres & Extensions | PgBouncer | PostgREST | WAL-G |
|---|:---:|:---:|:---:|:---:|
| Supabase Postgres |  ✔️   | ❌    | ❌   |  ✔️   |
| Supabase Postgres: PgBouncer Bundle  |  ✔️   |  ✔️  | ❌    |   ✔️ |
| Supabase Postgres: PostgREST Bundle |  ✔️   |  ❌  |  ✔️   |   ✔️ |
| Supabase Postgres: Complete Bundle |  ✔️  |  ✔️   | ✔️   | ✔️   |

#### Availability
|   | AWS ARM | AWS x86 | Digital Ocean x86 |
|---|:---:|:---:|:---:|
| Supabase Postgres | Coming Soon | Coming Soon | Coming Soon |
| Supabase Postgres: PgBouncer Bundle  | Coming Soon | Coming Soon | Coming Soon |
| Supabase Postgres: PostgREST Bundle | Coming Soon | Coming Soon | Coming Soon |
| Supabase Postgres: Complete Bundle | Coming Soon | Coming Soon | Coming Soon |

``` -->

## Motivation

- Make it fast and simple to get started with Postgres.
- Show off a few of Postgres' most exciting features.
- This is the same build we offer at [Supabase](https://supabase.io).
- Open a github issue if you have a feature request

## License

[The PostgreSQL License](https://opensource.org/licenses/postgresql). We realize that licensing is tricky since we are bundling all the various plugins. If we have infringed on any license, let us know and we will make the necessary changes (or remove that extension from this repo).

## Sponsors

We are building the features of Firebase using enterprise-grade, open source products. We support existing communities wherever possible, and if the products don’t exist we build them and open source them ourselves.

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
