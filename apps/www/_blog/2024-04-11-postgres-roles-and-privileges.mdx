---
title: Postgres Roles and Privileges
description: A guide to Postgres roles and privileges
author: raminder_singh
imgSocial: 2024-04-11-postgres-roles/pg-roles-og.png
imgThumb: 2024-04-11-postgres-roles/pg-roles-og.png
categories:
  - engineering
tags:
  - supabase-engineering
  - planetpg
date: '2024-04-11'
toc_depth: 3
---

Controlling access to data in Postgres is paramount for data security. Postgres provides a robust and flexible permissions model for users to manage access to their data. The permissions model is based on the familiar object, privilege, role model but has subtleties which must be understood by a database administrator to create airtight access. In this post we will take a detailed look at how roles and permissions work in Postgres.

# Basic Concepts

Let's first understand some basic concepts which will be used throughout the rest of the post.

## Database Object

A database object is any entity created in the database. Tables, foreign tables, views, materialized views, types, domains, operators, functions, triggers etc. are database objects. Objects allow operations on them which vary for each object. For example, you can _select_ data from a table and you can _execute_ a function.

## Privilege

A privilege controls what operation is allowed to be run on a database object. For example, the `select` privilege on a table controls the ability to read data from the table. Similarly, the `execute` privilege controls the ability to execute a function. Privileges are assigned to roles. A role must have the permission for the operation it is performing on an object.

## Role

A role is a user or a group. A user is someone who can login to the database. A group is a collection of users to make it easier to manage privileges for users. Unlike a user, a group can't login to the database. The distinction between a user and a group doesn’t matter to Postgres for the most part as they are both roles, but it is still useful to think of them as separate concepts for ease of understanding.

## Owner

Every database object has an owner. The owner has complete control over the object. They can modify or delete the object or grant privileges to other users and groups. When a user creates a new object, they become the owner of the object. An owner can also transfer the ownership of objects to other roles. A role cannot be deleted before all its owned objects’ ownership is transferred to another role.

With these basic terms defined, let's take a look at the permissions model in Postgres in depth. The rest of the post will be more like a tutorial, so you can follow along. I'll be using a hosted Supabase project, but you are free to use any Postgres installation.

# Setting Up

Create a new Supabase project (or use an existing one) and copy its connection string URI from the [Database Settings page](https://supabase.com/dashboard/project/_/database/settings). The URI looks like the following:

```bash
postgres://[USER].[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[REGION-SUBDOMAIN].pooler.supabase.com:5432/postgres
```

Where `USER` is the user to connect as. `YOUR-PROJECT-REF` is a string uniquely identifying your project. `YOUR-PASSWORD` is the database password for the `USER` user and `REGION-SUBDOMAIN` is the subdomain where your database is hosted.

Use the [`psql` command line tool](https://www.postgresql.org/download/) to connect to the database:

```bash
➜ psql postgres://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[REGION-SUBDOMAIN].pooler.supabase.com:5432/postgres
```

Once connected, confirm that you are connected as the `postgres` user by running `select current_role` command:

```bash
# as postgres
postgres=> select current_role;
┌──────────────┐
│ current_role │
├──────────────┤
│ portgres     │
└──────────────┘
(1 row)
```

## Creating Roles

Now, let's create two users named `junior_dev` and `senior_dev`. A database role can be created with the `create role` command. Since a user is a role that can login, use the `login` parameter:

```bash
# as postgres
postgres=> create role junior_dev login password 'a long and secure password';
CREATE ROLE
postgres=> create role senior_dev login password 'another long and secure password';
CREATE ROLE
```

You can now confirm that the `junior_dev` and `senior_dev` users can login to the database:

```bash
➜ psql postgres://junior_dev.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[REGION-SUBDOMAIN].pooler.supabase.com:5432/postgres

postgres=> select current_role;
┌──────────────┐
│ current_role │
├──────────────┤
│ junior_dev   │
└──────────────┘
(1 row)

postgres=> exit

➜ psql postgres://senior_dev.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[REGION-SUBDOMAIN].pooler.supabase.com:5432/postgres

postgres=> select current_role;
┌──────────────┐
│ current_role │
├──────────────┤
│ senior_dev   │
└──────────────┘
(1 row)
```

For the rest of the post, open three terminals and login each with `junior_dev`, `senior_dev` and `postgres` to easily switch between them. Each executed command will list at the beginning the user it should be executed as, for example:

```bash
# as junior_dev
postgres=> this command should be executed from the junior_dev's terminal
```

## Creating Objects and Assigning Privileges

Let's now try to create a table from as `junior_dev`:

```bash
# as junior_dev
postgres=> create table public.apps(id serial primary key, name text);
ERROR:  permission denied for schema public
LINE 1: create table public.apps(id serial primary key, name text);
                     ^
```

What happened? The error `permission denied for schema public` tells us that `junior_dev` doesn't have some permission on the `public` schema. We can check existing permissions on a schema using the `dn+ <schema>` command in `psql`:

```bash
# as junior_dev
postgres=> \dn+ public
                                        List of schemas
┌────────┬───────────────────┬────────────────────────────────────────┬────────────────────────┐
│  Name  │       Owner       │           Access privileges            │      Description       │
├────────┼───────────────────┼────────────────────────────────────────┼────────────────────────┤
│ public │ pg_database_owner │ pg_database_owner=UC/pg_database_owner↵│ standard public schema │
│        │                   │ =U/pg_database_owner                  ↵│                        │
│        │                   │ postgres=U/pg_database_owner          ↵│                        │
│        │                   │ anon=U/pg_database_owner              ↵│                        │
│        │                   │ authenticated=U/pg_database_owner     ↵│                        │
│        │                   │ service_role=U/pg_database_owner       │                        │
└────────┴───────────────────┴────────────────────────────────────────┴────────────────────────┘
(1 row)
```

Indeed, the `Access privileges` column doesn’t list `junior_dev` role anywhere, which means it doesn’t have any permission on the `public` schema. How do we fix this? The`postgres` user in Supabase hosted databases is a powerful role with more privileges than many other roles. Think of the `postgres` role as an admin role, although it is not a superuser. We can use this role to grant appropriate permissions.

So, let’s switch to the `postgres` user connection and grant `junior_dev` the permission to create objects in the `public` schema. The general format of the `grant` command is `grant <privilege> on <object> to <role>`. You can consult the [privileges page in Postgres documentation](https://www.postgresql.org/docs/current/ddl-priv.html) to find out the correct privilege name.

```bash
# as postgres
postgres=> grant create on schema public to junior_dev;
GRANT
```

Let’s check the permissions again:

```bash
# as junior_dev
postgres=> \dn+ public
                                        List of schemas
┌────────┬───────────────────┬────────────────────────────────────────┬────────────────────────┐
│  Name  │       Owner       │           Access privileges            │      Description       │
├────────┼───────────────────┼────────────────────────────────────────┼────────────────────────┤
│ public │ pg_database_owner │ pg_database_owner=UC/pg_database_owner↵│ standard public schema │
│        │                   │ =U/pg_database_owner                  ↵│                        │
│        │                   │ postgres=U/pg_database_owner          ↵│                        │
│        │                   │ anon=U/pg_database_owner              ↵│                        │
│        │                   │ authenticated=U/pg_database_owner     ↵│                        │
│        │                   │ service_role=U/pg_database_owner      ↵│                        │
│        │                   │ junior_dev=C/pg_database_owner         │                        │
└────────┴───────────────────┴────────────────────────────────────────┴────────────────────────┘
(1 row)
```

This time we see a new line in the access privileges column:

<aside>

💡 The grantor in the above case is `pg_database_owner` which is a role which owns the `public` schema. `pg_database_owner` has the owner of the current database as the only member, which is `postgres` in our case.

</aside>

```bash
# as junior_dev
postgres=> create table public.apps(id serial primary key, name text);
CREATE TABLE
```

Let’s insert some data in it:

```bash
# as junior_dev
postgres=> insert into public.apps(name) values ('next app');
INSERT 0 1
postgres=> select * from public.apps;
┌────┬──────────┐
│ id │   name   │
├────┼──────────┤
│  1 │ next app │
└────┴──────────┘
(1 row)
```

Now switch to `senior_dev` and try to select data from the table:

```bash
# as senior_dev
postgres=> select * from public.apps;
ERROR:  permission denied for table apps
```

`senior_dev` can’t select data from the `public.apps` table. Let’s debug the permissions error as before. The command in `psql` to view table permissions is `\dp <tablename>`:

```bash
# as senior_dev
postgres=> \dp public.apps
                             Access privileges
┌────────┬──────┬───────┬───────────────────┬───────────────────┬──────────┐
│ Schema │ Name │ Type  │ Access privileges │ Column privileges │ Policies │
├────────┼──────┼───────┼───────────────────┼───────────────────┼──────────┤
│ public │ apps │ table │                   │                   │          │
└────────┴──────┴───────┴───────────────────┴───────────────────┴──────────┘
(1 row)
```

No access privileges are present at all. As we did before, let’s now switch to the `postgres` user and fix the permissions. The [privileges page](https://www.postgresql.org/docs/current/ddl-priv.html) tells us that we need to grant the `select` privilege to `senior_dev` for them to select data from the `public.apps` table:

```bash
# as postgres
postgres=> grant select on table public.apps to senior_dev;
ERROR:  permission denied for table apps
```

Why can’t `postgres` grant the `select` privilege? Because it is neither an owner, nor has it any access privileges on the table. But then how was `junior_dev` able to select data from the table? That is because `junior_dev` is the owner of the table:

```bash
# as postgres
postgres=> \dt public.apps
          List of relations
┌────────┬──────┬───────┬────────────┐
│ Schema │ Name │ Type  │   Owner    │
├────────┼──────┼───────┼────────────┤
│ public │ apps │ table │ junior_dev │
└────────┴──────┴───────┴────────────┘
(1 row)
```

Since an owner has all the privileges on an object, `junior_dev` can select the data. `junior_dev` can also grant privileges on the owned objects to other roles. Let’s fix the permissions with `junior_dev`:

```bash
# as junior_dev
postgres=> grant select on public.apps to senior_dev;
GRANT
```

Now `senior_dev` can select the data:

```bash
# as senior_dev
postgres=> select * from public.apps;
┌────┬──────────┐
│ id │   name   │
├────┼──────────┤
│  1 │ next app │
└────┴──────────┘
(1 row)
```

Another option in the above example would have been for `junior_dev` to grant the _privilege to grant the `select` privilege_ to the `postgres` role. The `postgres` role would then have been able to grant the `select` privilege to `senior_dev`. To try this, let’s revoke the previously granted privilege to `senior_dev` first:

```bash
# as junior_dev
postgres=> revoke select on public.apps from senior_dev;
REVOKE
```

And then grant the `select` privilege `with grant option` to `postgres`:

```bash
# as junior_dev
postgres=> grant select on public.apps to postgres with grant option;
GRANT
```

Now, if we view the permissions on the `public.apps` table:

```bash
# as_junior_dev
postgres=> \dp public.apps
                                   Access privileges
┌────────┬──────┬───────┬───────────────────────────────┬───────────────────┬──────────┐
│ Schema │ Name │ Type  │       Access privileges       │ Column privileges │ Policies │
├────────┼──────┼───────┼───────────────────────────────┼───────────────────┼──────────┤
│ public │ apps │ table │ junior_dev=arwdDxt/junior_dev↵│                   │          │
│        │      │       │ postgres=r*/junior_dev        │                   │          │
└────────┴──────┴───────┴───────────────────────────────┴───────────────────┴──────────┘
(1 row)
```

Notice the `*` after the `r` in `postgres=r*/junior_dev`. which indicates that the `select` permission was granted `with grant option`. Now `postgres` can grant the `select` privilege to `senior_dev`:

```bash
# as postgres
postgres=> grant select on table public.apps to senior_dev;
GRANT
```

And `senior_dev` has the `select` privilege and can select from the table again:

```bash
# as senior_dev
postgres=> \dp public.apps
                                   Access privileges
┌────────┬──────┬───────┬───────────────────────────────┬───────────────────┬──────────┐
│ Schema │ Name │ Type  │       Access privileges       │ Column privileges │ Policies │
├────────┼──────┼───────┼───────────────────────────────┼───────────────────┼──────────┤
│ public │ apps │ table │ junior_dev=arwdDxt/junior_dev↵│                   │          │
│        │      │       │ postgres=r*/junior_dev       ↵│                   │          │
│        │      │       │ senior_dev=r/postgres         │                   │          │
└────────┴──────┴───────┴───────────────────────────────┴───────────────────┴──────────┘
(1 row)

postgres=> select * from public.apps;
┌────┬──────────┐
│ id │   name   │
├────┼──────────┤
│  1 │ next app │
└────┴──────────┘
(1 row)
```

A `grant` command only adds privileges for existing objects. What if we want to grant certain privileges to objects as soon as they are created? That’s where default access privileges come in.

### Default Access Privileges

If `junior_dev` now creates another table, it has to grant the privileges again to `senior_dev`. To avoid doing this each time `junior_dev` creates a new table, we can alter `junior_dev`'s default access privileges. First let’s see the current default privileges on the `public` schema:

```bash
# as junior_dev
postgres=> \ddp public
                          Default access privileges
┌────────────────┬────────┬──────────┬──────────────────────────────────────┐
│     Owner      │ Schema │   Type   │          Access privileges           │
├────────────────┼────────┼──────────┼──────────────────────────────────────┤
│ postgres       │ public │ function │ postgres=X/postgres                 ↵│
│                │        │          │ anon=X/postgres                     ↵│
│                │        │          │ authenticated=X/postgres            ↵│
│                │        │          │ service_role=X/postgres              │
│ postgres       │ public │ sequence │ postgres=rwU/postgres               ↵│
│                │        │          │ anon=rwU/postgres                   ↵│
│                │        │          │ authenticated=rwU/postgres          ↵│
│                │        │          │ service_role=rwU/postgres            │
│ postgres       │ public │ table    │ postgres=arwdDxt/postgres           ↵│
│                │        │          │ anon=arwdDxt/postgres               ↵│
│                │        │          │ authenticated=arwdDxt/postgres      ↵│
│                │        │          │ service_role=arwdDxt/postgres        │
│ supabase_admin │ public │ function │ postgres=X/supabase_admin           ↵│
│                │        │          │ anon=X/supabase_admin               ↵│
│                │        │          │ authenticated=X/supabase_admin      ↵│
│                │        │          │ service_role=X/supabase_admin        │
│ supabase_admin │ public │ sequence │ postgres=rwU/supabase_admin         ↵│
│                │        │          │ anon=rwU/supabase_admin             ↵│
│                │        │          │ authenticated=rwU/supabase_admin    ↵│
│                │        │          │ service_role=rwU/supabase_admin      │
│ supabase_admin │ public │ table    │ postgres=arwdDxt/supabase_admin     ↵│
│                │        │          │ anon=arwdDxt/supabase_admin         ↵│
│                │        │          │ authenticated=arwdDxt/supabase_admin↵│
│                │        │          │ service_role=arwdDxt/supabase_admin  │
└────────────────┴────────┴──────────┴──────────────────────────────────────┘
(6 rows)
```

Neither `junior_dev` nor `senior_dev` are listed. Let’s alter `junior_dev`'s default privileges:

```bash
# as junior_dev
postgres=> alter default privileges in schema public grant select on tables to senior_dev;
ALTER DEFAULT PRIVILEGES
```

Here we are altering default privileges such that whenever `junior_dev` creates a new table in the `public` schema, `senior_dev` should be granted `select` privilege on it. Let’s check the privileges again:

```bash
# as junior_dev
postgres=> \ddp public
                          Default access privileges
┌────────────────┬────────┬──────────┬──────────────────────────────────────┐
│     Owner      │ Schema │   Type   │          Access privileges           │
├────────────────┼────────┼──────────┼──────────────────────────────────────┤
│ junior_dev     │ public │ table    │ senior_dev=r/junior_dev              │
│ postgres       │ public │ function │ postgres=X/postgres                 ↵│
│                │        │          │ anon=X/postgres                     ↵│
│                │        │          │ authenticated=X/postgres            ↵│
│                │        │          │ service_role=X/postgres              │
│ postgres       │ public │ sequence │ postgres=rwU/postgres               ↵│
│                │        │          │ anon=rwU/postgres                   ↵│
│                │        │          │ authenticated=rwU/postgres          ↵│
│                │        │          │ service_role=rwU/postgres            │
│ postgres       │ public │ table    │ postgres=arwdDxt/postgres           ↵│
│                │        │          │ anon=arwdDxt/postgres               ↵│
│                │        │          │ authenticated=arwdDxt/postgres      ↵│
│                │        │          │ service_role=arwdDxt/postgres        │
│ supabase_admin │ public │ function │ postgres=X/supabase_admin           ↵│
│                │        │          │ anon=X/supabase_admin               ↵│
│                │        │          │ authenticated=X/supabase_admin      ↵│
│                │        │          │ service_role=X/supabase_admin        │
│ supabase_admin │ public │ sequence │ postgres=rwU/supabase_admin         ↵│
│                │        │          │ anon=rwU/supabase_admin             ↵│
│                │        │          │ authenticated=rwU/supabase_admin    ↵│
│                │        │          │ service_role=rwU/supabase_admin      │
│ supabase_admin │ public │ table    │ postgres=arwdDxt/supabase_admin     ↵│
│                │        │          │ anon=arwdDxt/supabase_admin         ↵│
│                │        │          │ authenticated=arwdDxt/supabase_admin↵│
│                │        │          │ service_role=arwdDxt/supabase_admin  │
└────────────────┴────────┴──────────┴──────────────────────────────────────┘
(7 rows)
```

The first line now indicates the default access privilege we just added. Let’s now create a new table and insert a row in it:

```bash
# as junior_dev
postgres=> create table public.users(id serial primary key, name text);
CREATE TABLE
postgres=> insert into public.users(name) values ('john doe');
INSERT 0 1
```

Now try to select data in `public.users` from `senior_dev`:

```bash
# as senior_dev
postgres=> select * from public.users;
┌────┬──────────┐
│ id │   name   │
├────┼──────────┤
│  1 │ john doe │
└────┴──────────┘
(1 row)
```

Note that we were immediately able to select data from `public.users` without explicit grants from `junior_dev`.

It is clear from above that the owner has all the privileges on an object which they can grant to other roles. But it can become cumbersome for the owner to keep granting the same privileges to every new role. There is a better way. We can ensure that objects are owned by a group and then any users which need access to those objects are assigned membership to the group. Let’s see how this works.

## Creating Groups

We want to create a new `developers` group which will own the `public.apps` table. Then we will make `junior_dev` and `senior_dev` members of the `developers` group. This will ensure that they both have the same kind of access, without explicitly granting privileges after creating a new object.

First, let’s drop the `public.apps` table:

```bash
# as junior_dev
postgres=> drop table public.apps;
DROP TABLE
```

Let’s also revoke the `create` privilege from `junior_dev` on the `public` schema:

```bash
# as postgres
postgres=> revoke create on schema public from junior_dev;
REVOKE
```

Let’s create a `developers` group. Since a group is a role that is not allowed to login, use the `nologin` parameter:

```bash
# as postgres
postgres=> create role developers nologin;
CREATE ROLE
```

You can't login with the `developers` role because we set the `nologin` parameter. The `login`/`nologin` parameters control the `login` attribute of a role. Earlier we also set the `password` attribute of the `junior_dev` and `senior_dev` roles. There are many other [role attributes](https://www.postgresql.org/docs/current/role-attributes.html) which we will talk about later in the post.

Let’s give the `create` privilege to the `developers` group:

```bash
# as postgres
postgres=> grant create on schema public to developers;
GRANT
```

Since `junior_dev` and `senior_dev` users do not have `create` privilege on the `public` schema, they can’t create objects in it. The `developers` group can, but we can’t login with it. So how do we create `public.apps` owned by `developers`? Well, a user can temporarily impersonate a group if they are a member of the group. So let’s ensure `junior_dev` and `senior_dev` are members of the `developers` group:

```bash
# as postgres
postgres=> grant developers to junior_dev;
GRANT ROLE
postgres=> grant developers to senior_dev;
GRANT ROLE
```

The `grant <group> to <user>` is another variant of the `grant` command but should be mentally read as `add <user> to <group>`.

<aside>
💡 In this form of the `grant` command Postgres doesn’t check that the `<user>` is a user and `<group>` is a group. That is, Postgres doesn’t care about these roles’s ability to login. Hence, `grant <user1> to <user2>` is also allowed, in which case `<user2>` can impersonate `<user1>`. In fact, for the most part, Postgres doesn’t care much about the difference between a user or a group. To it, both are just roles.

</aside>

Now `junior_dev` (or `senior_dev`) can impersonate `developers`:

```bash
# as junior_dev
postgres=> set role developers;
SET
postgres=> select current_role;
┌──────────────┐
│ current_role │
├──────────────┤
│ developers   │
└──────────────┘
(1 row)
```

And create the `public.apps` table:

```bash
# as junior_dev
postgres=> create table public.apps(id serial primary key, name text);
CREATE TABLE
```

Which is owned by the `developers` group:

```bash
# as junior_dev
postgres=> \dt public.apps
          List of relations
┌────────┬──────┬───────┬────────────┐
│ Schema │ Name │ Type  │   Owner    │
├────────┼──────┼───────┼────────────┤
│ public │ apps │ table │ developers │
└────────┴──────┴───────┴────────────┘
(1 row)
```

Now if you stop impersonation:

```bash
# as junior_dev
postgres=> reset role;
RESET
postgres=> select current_role;
┌──────────────┐
│ current_role │
├──────────────┤
│ junior_dev   │
└──────────────┘
(1 row)
```

And try to insert or select data from `public.apps` it works:

```bash
# as junior_dev or senior_dev
postgres=> insert into public.apps(name) values ('next app');
INSERT 0 1
postgres=> select * from public.apps;
┌────┬──────────┐
│ id │   name   │
├────┼──────────┤
│  1 │ next app │
└────┴──────────┘
(1 row)
```

The reason `junior_dev` and `senior_dev` are able to insert and select data is because they are part of the `developers` group. If a new developer is created later, they are just a `grant developers to <new dev>` away from having the same access as every other developer. Contrast this with the previous method in which the new user would have to ask the owner of every object to grant them permissions.

## Grant Options

Making a user part of another group might grant it three abilities:

1. The ability to impersonate the group.
2. The ability to inherit the permissions from the group.
3. The ability to add or remove other users from the group.

All of these abilities can be controlled independently while running the `grant <group> to <user>` command by using the `with <option name> true/false` suffixed to it. The names of each of the above options are `set`, `inherit`, and `admin`. For example, to disallow a user from impersonating a group run `grant <group> to <user> with set false`.

<aside>
💡 In Postgres 15, only the `admin` option can be controlled. In Postgres 16, the `inherit` and `set` options can also be controlled. If these options are omitted from the `grant` command, their default values are `true` for `set` and `inherit` and `false` for `admin`.

</aside>

To demonstrate, if we enable admin option on `junior_dev`:

```bash
# as postgres
postgres=> grant developers to junior_dev with admin option;
GRANT ROLE
```

It will be able to remove `senior_dev` from the `developers` group:

```bash
# as junior_dev
postgres=> revoke developers from senior_dev;
REVOKE ROLE
```

Without the `admin` option, `junior_dev` wouldn’t have been able to do this.

## Role Attributes

Every role has some attributes associated with it which control the behavior of the role. Some of the common ones are listed below. For the full list and their details, refer to the [Postgres role attributes documentation](https://www.postgresql.org/docs/current/role-attributes.html).

- `login` - controls the role’s ability to login.
- `superuser` - controls whether the role is a superuser or not. See next section for details.
- `createdb` - controls whether the role will be able to create databases.
- `createrole` - controls whether the role will be able to create other roles.
- `replication` - controls whether the role can be used to initiate replication.
- `bypassrls` - controls whether the role can bypass row level security.
- `connection limit` - limits the maximum number of connections that the role can make to the database.
- `inherit` - controls whether the role can inherit permissions from roles it is a member of.

## Special Roles

There are two special roles which play an important part in how roles and privileges are managed.

### Superuser

A `superuser` is a role with the `superuser` attribute set. A `superuser` is like a root user on the \*nix OSes. It is very powerful and bypasses all privilege checks except authentication during login. For this reason, you should avoid working with this role as much as possible. Only superusers can create other `superuser` roles.

### Public

`public` is a group role which every other role is automatically a part of. There is only one `public` role. So unlike `superuser`, there’s no `public` role attribute. The `public` role is used to provide privileges which are considered to be so common that every role should have them. These privileges are:

- `connect` - ability to connect to the database.
- `temporary` - ability to create temporary tables.
- `execute` - ability to execute functions.
- `usage` - ability to use an object like a domain, language or type.

The `public` role can’t be deleted, but its privileges can be revoked.

Privileges of a role are union of three sets of privileges:

1. Those granted to the role directly.
2. Those inherited from the roles this role is an explicit member of.
3. Those inherited from the `public` role, which every role is implicitly a member of.

Privileges inherited from the `public` role are a common source of confusion when working with roles in Postgres. Imagine that we want to disallow `junior_dev` from executing functions. Let’s first create a function:

```bash
# as postgres
postgres=> create function add(integer, integer)
returns integer
as 'select $1 + $2;'
language sql;
CREATE FUNCTION
```

`junior_dev` is currently able to execute this function:

```bash
# as junior_dev
postgres=> select add(1, 2);
┌─────┐
│ add │
├─────┤
│   3 │
└─────┘
(1 row)
```

Now let’s revoke `junior_dev`'s `execute` permission:

```bash
# as postgres
postgres=> revoke execute on function add(integer, integer) from junior_dev;
REVOKE
```

But `junior_dev` is still able to execute the function:

```bash
# as junior_dev
postgres=> select add(1, 2);
┌─────┐
│ add │
├─────┤
│   3 │
└─────┘
(1 row)
```

How? Let’s check `add` function’s privileges:

```bash
# as postgres
postgres=> \df+ add
┌────────┬──────┬──────────────────┬─────────────────────┬──────┬────────────┬──────────┬──────────┬──────────┬──────────────────────────┬──────────┐
│ Schema │ Name │ Result data type │ Argument data types │ Type │ Volatility │ Parallel │   Owner  │ Security │     Access privileges    │ Language │
├────────┼──────┼──────────────────┼─────────────────────┼──────┼────────────┼──────────┼──────────┼──────────┼──────────────────────────┼──────────│
│ public │ add  │ integer          │ integer, integer    │ func │ volatile   │ unsafe   │ postgres │ invoker  │ =X/postgres             ↵│ sql      │
│        │      │                  │                     │      │            │          │          │          │ postgres=X/postgres     ↵│          │
│        │      │                  │                     │      │            │          │          │          │ anon=X/postgres         ↵│          │
│        │      │                  │                     │      │            │          │          │          │ authenticated=X/postgres↵│          │
│        │      │                  │                     │      │            │          │          │          │ service_role=X/postgres  │          │
└────────┴──────┴──────────────────┴─────────────────────┴──────┴────────────┴──────────┴──────────┴──────────┴──────────────────────────┴──────────┘
(1 row)
```

`junior_dev` doesn’t have any privilege, but the missing role name in the `=X/postgres` line means the `public` role. Let’s revoke `execute` from `public`:

```bash
# as postgres
postgres=> revoke execute on function add(integer, integer) from public;
REVOKE
postgres=> \df+ add
┌────────┬──────┬──────────────────┬─────────────────────┬──────┬────────────┬──────────┬──────────┬──────────┬──────────────────────────┬──────────┐
│ Schema │ Name │ Result data type │ Argument data types │ Type │ Volatility │ Parallel │   Owner  │ Security │     Access privileges    │ Language │
├────────┼──────┼──────────────────┼─────────────────────┼──────┼────────────┼──────────┼──────────┼──────────┼──────────────────────────┼──────────│
│ public │ add  │ integer          │ integer, integer    │ func │ volatile   │ unsafe   │ postgres │ invoker  │ postgres=X/postgres     ↵│ sql      │
│        │      │                  │                     │      │            │          │          │          │ anon=X/postgres         ↵│          │
│        │      │                  │                     │      │            │          │          │          │ authenticated=X/postgres↵│          │
│        │      │                  │                     │      │            │          │          │          │ service_role=X/postgres  │          │
│        │      │                  │                     │      │            │          │          │          │                          │          │
└────────┴──────┴──────────────────┴─────────────────────┴──────┴────────────┴──────────┴──────────┴──────────┴──────────────────────────┴──────────┘
(1 row)
```

Now `junior_dev` can not longer execute the `add` function:

```bash
# as junior_dev
postgres=> select add(1, 2);
ERROR:  permission denied for function add
```

Another thing to note here is that when we revoked `execute` privilege on `add` from `junior_dev`, there was actually nothing to revoke. But Postgres did not show us any warning. So it is important to always explicitly check the permissions, especially after a `revoke` command.

## Summary

To summarize:

- Every database object has an owner.
- Operations on database objects are controlled by privileges.
- Owners can grant privileges on owned objects to other roles.
- Roles can be either users or groups.
- Roles can inherit permissions from roles they are a member of.
- `public` role is a role which every other role is implicitly a member of. It can’t be deleted, but its privileges can be revoked.
- `superuser` roles are all powerful roles that bypass all privilege checks and should be used with care.
- `grant` command only grants privileges on existing objects.
- Default privileges control privileges to be granted to objects created in the future.

## Conclusion

Postgres permissions follow the traditional objects, roles, privileges model but it has its subtleties which can surprise users unless they understand it in detail. In this post we experimented with this model to understand it in depth. Hope this understanding will allow you to manage and protect your Postgres database more effectively.
