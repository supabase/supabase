---
title: 'Point in Time Recovery is now available for Pro projects'
description: "We're making PITR available for more projects, with a new Dashboard UI that makes it simple to use."
author: angelico_de_los_reyes
imgSocial: launch-week-6/pitr/og-pitr.png
imgThumb: launch-week-6/pitr/og-pitr.png
categories:
  - product
tags:
  - launch-week
  - postgres
  - backups
  - planetpg
date: '2022-12-16'
toc_depth: 3
---

When we announced Point-in-Time a few months ago, it was only available for Enterprise customers. Today, we're making PITR available for more projects, with a new Dashboard UI that makes it simple to use.

Pro Plan projects created from August 2022 onwards (excluding Northeast Asia / Seoul region), can now enable Point In Time Recovery (PITR) from the dashboard. Projects must have the "Small" compute add-on to ensure that PITR operates smoothly behind the scenes.

For older projects, don't worry - we're working on making it available for everybody. In the meantime, if you would like to have PITR enabled for your ineligible project, reach out directly [here](https://supabase.com/dashboard/support/new), or stay tuned for further updates.

## What is Point in Time Recovery?

![point in time recovery overview](/images/blog/launch-week-6/pitr/pitr-overview.png)

Point in Time Recovery provides the ability for a database to be restored at any specified point in time. This is useful when averting disasters, for all those times that a, _cough_, natural calamity strikes (like accidentally dropping a table). With PITR, the database can be restored to a state it was in mere seconds before trouble.

All of this is made possible by a combination of physical backups and archives from the [Write Ahead Log (WAL)](https://www.postgresql.org/docs/current/wal-intro.html). Physical backups provide a snapshot of the underlying directory of the database, while WAL files contain records of every change made in the database.

Under the hood, we use [WAL-G](https://github.com/wal-g/wal-g), an open source archival and restoration tool, to handle all aspects of PITR. On a daily basis, WAL-G takes a snapshot of the database and sends it to our storage servers. Throughout the day, as database transactions occur, WAL files are generated and uploaded to archived.

## Should I enable PITR?

![point in time recovery date selection](/images/blog/launch-week-6/pitr/pitr-date-selection.png)

Consider your Recovery Point Objective (RPO) when deciding whether to enable Point in Time Recovery. RPO is the threshold for how much data, measured in time, a business could lose when disaster strikes. This is dependent on a business and its underlying requirements. The agreed upon RPO would be a deciding factor in choosing which solution best fits a project.

While all Pro Plan projects and above are backed up on a daily basis, this means that at the worst case, a project could lose up to 24 hours worth of data if disaster hits at the most inopportune time. With Point in Time Recovery however, backups are made at much shorter intervals, shortening the RPO. WAL files are backed up at two minute intervals. This could be faster if it hits a certain file threshold before the two minute mark.

## Getting started

Enabling Point in Time Recovery can be done [in the Dashboard](https://supabase.com/dashboard/project/_/settings/addons?panel=pitr). Retention for backups used by PITR is set to up to 7 days by default but could be increased to up to 28 days via self-serve.

## More Launch Week 6

- [Day 1: New Supabase Docs, built with Next.js](https://supabase.com/blog/new-supabase-docs-built-with-nextjs)
- [Day 2: Supabase Storage v2: Image resizing and Smart CDN](https://supabase.com/blog/storage-image-resizing-smart-cdn)
- [Day 3: Multi-factor Authentication via Row Level Security Enforcement](https://supabase.com/blog/mfa-auth-via-rls)
- [Day 4: Supabase Wrappers, a Postgres FDW framework written in Rust](https://supabase.com/blog/postgres-foreign-data-wrappers-rust)
- [Day 5: Supabase Vault is now in Beta](https://supabase.com/blog/vault-now-in-beta)
- [Community Day](https://supabase.com/blog/launch-week-6-community-day)
- [Custom Domain Names are now available](https://supabase.com/blog/custom-domain-names)
- [Wrap Up: everything we shipped](https://supabase.com/blog/launch-week-6-wrap-up)
