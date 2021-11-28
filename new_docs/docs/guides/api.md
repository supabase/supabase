---
title: 'APIs'
description: 'Supabase APIs'
---

# APIs

## Overview

Supabase generates APIs directly from your database schema. The API is:

- Instant and auto-generated: as you update your database the changes are immediately accessible through your API.
- Self documenting: Supabase generates documentation in the Dashboard which updates as you make database changes.
- Secure: the API is configured to work with PostgreSQL's Row Level Security, provisioned behind an API gateway with key-auth enabled.
- Fast: our benchmarks for basic reads are more than 300% faster than Firebase. The API is a very thin layer on top of Postgres, which does most of the heavy lifting.
- Scalable: the API can serve thousands of simultaneous requests, and works well for Serverless workloads.

## RESTful API
