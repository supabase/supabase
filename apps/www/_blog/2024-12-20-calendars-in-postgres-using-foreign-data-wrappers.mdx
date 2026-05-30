---
title: 'Calendars in Postgres using Foreign Data Wrappers'
description: 'Calendar data integration with Cal.com using Wasm foreign data wrapper on Supabase'
author: bo_lu
imgSocial: 2024-12-20-cal-wrapper/og-calcom.png
imgThumb: 2024-12-20-cal-wrapper/og-calcom.png
categories:
  - developers
  - product
tags:
  - wasm
  - wrappers
  - integration
date: '2024-12-20'
toc_depth: 3
---

Today we're releasing Foreign Data Wrappers for [Cal.com](https://cal.com) so that you can create event bookings directly from Postgres.

This is especially useful for signup forms where you create an event in your database and schedule an event simultaneously: now you can do all this in a single Postgres transaction.

## What's Cal.com?

[Cal.com](http://cal.com/) is an open-source scheduling platform that allows individuals and businesses to book and manage appointments. It is designed to work with a variety of use cases, from personal calendars to enterprise-grade scheduling systems. They have a great [developer toolkit](https://cal.com/platform).

## Creating event bookings with Postgres

[Cal.com](http://Cal.com) offers various scheduling features. One of the most common scenarios for developers is creating a new event in a calendar (for example, after someone has purchased a flight).

Let's use your Supabase database to create an event in [Cal.com](http://cal.com/), using Postgres Foreign Data Wrappers.

### Set up a Cal.com account

- Sign up on [Cal.com](http://Cal.com)
- Visit [Settings -> Developer -> API keys](https://app.cal.com/settings/developer/api-keys) to create an API key

<Img
  alt="create API key on Cal.com"
  src={{
    dark: '/images/blog/2024-12-20-cal-wrapper/01-cal-api-key.png',
    light: '/images/blog/2024-12-20-cal-wrapper/01-cal-api-key.png',
  }}
/>

### Set up a Supabase account

- Sign up on [supabase.com](http://supabase.com)
- Create a project or open an existing project
- Go to [supabase.com/dashboard/project/\_/database/extensions](https://supabase.com/dashboard/project/_/database/extensions) to enable `wrappers` extension

<Img
  alt="enable wrappers extension"
  src={{
    dark: '/images/blog/2024-12-20-cal-wrapper/02-enable-wrapper-ext.png',
    light: '/images/blog/2024-12-20-cal-wrapper/02-enable-wrapper-ext.png',
  }}
/>

### Create Wasm wrapper and a foreign server

Visit [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql/new), use below SQL to create the Wasm foreign data wrapper:

```sql
create foreign data wrapper wasm_wrapper
  handler wasm_fdw_handler
  validator wasm_fdw_validator;
```

And then create a foreign server for [Cal.com](http://Cal.com) connection with your API Key:

```sql
create server cal_server
  foreign data wrapper wasm_wrapper
  options (
    fdw_package_url 'https://github.com/supabase/wrappers/releases/download/wasm_cal_fdw_v0.1.0/cal_fdw.wasm',
    fdw_package_name 'supabase:cal-fdw',
    fdw_package_version '0.1.0',
    fdw_package_checksum '4afe4fac8c51f2caa1de8483b3817d2cec3a14cd8a65a3942c8b4ff6c430f08a',
    api_key '<your Cal.com API key>'
  );
```

<Admonition>
  Find the latest version and checksum in the docs:
  [fdw.dev/catalog/cal](https://fdw.dev/catalog/cal/)
</Admonition>

### Set up foreign tables

Now let's setup the foreign tables. First of all, create a dedicate schema for the foreign tables:

```sql
create schema if not exists cal;
```

And then create a foreign table for [Event Types](https://app.cal.com/event-types):

```sql
create foreign table cal.event_types (
  attrs jsonb
)
  server cal_server
  options (
    object 'event-types'
  );
```

And another foreign table for [Bookings](https://app.cal.com/bookings/upcoming):

```sql
create foreign table cal.bookings (
  attrs jsonb
)
  server cal_server
  options (
    object 'bookings',
    rowid_column 'attrs'
  );
```

Note the `rowid_column` option which is required to insert data into `cal.bookings` table, we will see it later.

### Query Event Types and Bookings from Cal.com

Great, now we are all set, it's time to query some juicy data from Cal.com! Let's start query from [Event Types](https://app.cal.com/event-types) first:

```sql
-- extract event types
select
  etg->'profile'->>'name' as profile,
  et->>'id' as id,
  et->>'title' as title
from cal.event_types t
  cross join json_array_elements((attrs->'eventTypeGroups')::json) etg
  cross join json_array_elements((etg->'eventTypes')::json) et;
```

<Img
  alt="query event types from Cal.com"
  src={{
    dark: '/images/blog/2024-12-20-cal-wrapper/03-query-event-types.png',
    light: '/images/blog/2024-12-20-cal-wrapper/03-query-event-types.png',
  }}
/>

Note all the scheduling information returned from [Cal.com](http://Cal.com) API are stored in the JSON column `attrs` , from which we can extract any fields of that object. For example, we can extract `id`, `title`, `name` and etc., from [Bookings](https://app.cal.com/bookings/upcoming) object:

```sql
-- extract bookings
select
  bk->>'id' as id,
  bk->>'title' as title,
  bk->'responses'->>'name' as name,
  bk->>'startTime' as start_time
from cal.bookings t
  cross join json_array_elements((attrs->'bookings')::json) bk;
```

<Img
  alt="query bookings from Cal.com"
  src={{
    dark: '/images/blog/2024-12-20-cal-wrapper/04-query-booking.png',
    light: '/images/blog/2024-12-20-cal-wrapper/04-query-booking.png',
  }}
/>

Oops, it looks like we haven't booked any meetings with anybody yet. Now it's the fun part, let's make a booking on [Cal.com](http://Cal.com) from Supabase!

### Make a bookings on Cal.com from Supabase

To make a booking directly from Postgres, all we need to do is to insert a record to `cal.bookings` foreign table, with the booking details in JSON format. For example,

```sql
-- make a 15 minutes meeting with Elon Musk
insert into cal.bookings(attrs)
values (
  '{
     "start": "2025-01-01T23:30:00.000Z",
     "eventTypeId": 1398027,
     "attendee": {
       "name": "Elon Musk",
       "email": "elon.musk@x.com",
       "timeZone": "America/New_York"
     }
  }'::jsonb
);
```

<Img
  alt="make a bookings from postgres"
  src={{
    dark: '/images/blog/2024-12-20-cal-wrapper/05-make-booking.png',
    light: '/images/blog/2024-12-20-cal-wrapper/05-make-booking.png',
  }}
/>

Here you can see we made a 15 minutes meeting booking with Elon, just to give him a happy new year greeting 😄. Note the `eventTypeId` , “1398027”, is our `15 Min Meeting` event type ID, you can find yours by querying the `cal.event_types` foreign table using above example SQL.

After inserting the booking record, we can verify it appears on our upcoming list in [Cal.com](http://Cal.com).

<Img
  alt="verify bookings is on Cal.com"
  src={{
    dark: '/images/blog/2024-12-20-cal-wrapper/06-verify-on-cal.png',
    light: '/images/blog/2024-12-20-cal-wrapper/06-verify-on-cal.png',
  }}
/>

When we query `cal.bookings` again using the previous SQL, we can see our new booking record is in the results as well.

<Img
  alt="verify bookings on Supabase"
  src={{
    dark: '/images/blog/2024-12-20-cal-wrapper/07-verify-on-supabase.png',
    light: '/images/blog/2024-12-20-cal-wrapper/07-verify-on-supabase.png',
  }}
/>

That wraps up our tutorial! We've covered how to interact with [Cal.com](http://Cal.com) in Supabase using foreign wrapper and tables. For more information about available objects and fields, refer to the [Cal.com API v2 reference](https://cal.com/docs/api-reference/v2/introduction) and the [Wrappers Cal.com Wasm Wrapper documentation](https://fdw.dev/catalog/cal/).

## Built with Wrappers

The [Cal.com](http://Cal.com) FDW is built with [Wrappers](https://fdw.dev), a framework for Postgres Foreign Data Wrappers (FDW). Our latest release supports [Wasm (WebAssembly)](https://webassembly.org/) to simplify development for API-based services.

## Explore more

We've built a variety of wrappers available on [fdw.dev](https://fdw.dev/), ranging from popular tools like [Stripe](https://stripe.com/) and [Notion](https://www.notion.com/) to databases like [ClickHouse](https://clickhouse.com/) and [BigQuery](https://cloud.google.com/bigquery). Check out the [full catalog](https://fdw.dev/catalog/) and get started with Supabase today:

[database.new](https://database.new)
