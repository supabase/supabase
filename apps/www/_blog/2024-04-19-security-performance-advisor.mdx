---
title: 'Supabase Security Advisor & Performance Advisor'
description: "We're making it easier to build a secure and high-performing application."
author: saltcod,oli_rice
imgSocial: ga-week/security-peformance-advisor/og.png?v=3
imgThumb: ga-week/security-peformance-advisor/thumb.png?v=3
categories:
  - product
tags:
  - launch-week
date: '2024-04-18'
toc_depth: 3
launchweek: '11'
---

We're dropping some handy tools in Supabase Studio this week to help with security and performance:

1. **Security Advisor:** for detecting insecure database configuration
2. **Performance Advisor**: for suggesting database optimizations
3. **Index Advisor**: for suggesting indexes on slow-running queries

We [announced General Availability](/ga) this week, reaching a point where we feel confident our organization can support all types of customers and help them become successful, regardless of their demands. It's a big milestone after four years of building.

As we've grown up as a company, so too have our customers. Many of you have been with us since the start and have seen your projects grow from 0 to literally millions of users, scaling from the Free Plan up to the largest size servers we offer.

<div className="video-container">
  <iframe
    className="w-full"
    src="https://www.youtube-nocookie.com/embed/NZEbVe47DfA"
    title="Supabase Security Advisor & Performance Advisor"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  />
</div>

## Helping you help yourself

Along with this growth, we've learned many lessons about the types of issues developers encounter using Postgres, especially as they start to get traction. We've built tooling, documentation, and support processes around common issues related to security, performance, resource usage, and slow queries.

As we've helped hundreds of thousands of customers through issues like these, a trend emerged: developers want their problems resolved quickly, but they also want to know what happened and why. This is the typical profile of a Supabase developer - thoughtful, curious, and hungry to learn more about the inner workings of Postgres.

This week, we're adding features into Supabase Studio to address common issues as you scale up. These are powered by tools that we have open sourced this week: [index_advisor](https://github.com/supabase/index_advisor) and [splinter](https://github.com/supabase/splinter) (“**S**upabase **P**ostgres **linter**").

## Security Advisor

<Img
  alt="security-peformance-advisor"
  src={{
    light: '/images/blog/ga-week/security-peformance-advisor/security-advisor--light.png',
    dark: '/images/blog/ga-week/security-peformance-advisor/security-advisor.png',
  }}
  captionAlign="left"
  zoomable={false}
/>

This week we're adding a Security Advisor to Supabase Studio. This is a new interface for exploring security issues with your database because, well, sometimes even Postgres veterans get it wrong. The Security Advisor runs a set queries on your database to identify configuration issues.

The Security Advisor is helpful in pointing out security issues that you might have forgotten or not yet be aware: some lints are general purpose for Postgres projects, while others are specific to Supabase.

As with all of our tooling, it's designed to both help and to teach. The suggestions are well-documented with a rationale, descriptions, examples and remediation steps. Did you know, for example, that views don't respect RLS policies unless you've set `security_invoker=on`? Now you do!

## Performance Advisor

<Img
  alt="security-peformance-advisor"
  src={{
    light: '/images/blog/ga-week/security-peformance-advisor/performance-advisor--light.png',
    dark: '/images/blog/ga-week/security-peformance-advisor/performance-advisor.png',
  }}
  captionAlign="left"
  zoomable={false}
/>

While database tuning is a speciality on its own, many projects have simple optimizations to improve performance. We're releasing a new Performance Advisor in Supabase Studio to surface the low-hanging fruit.

The Performance Advisor checks for misconfigurations, like tables with unindexed foreign key columns, inefficient RLS policies, or columns with duplicate indexes. As a project grows, issues like this can sneak in and slow your projects down (and fill up your disks).

If you're looking for ways to speed up your database, this is the place to start.

## Bonus: Index Advisor

<Img
  alt="security-peformance-advisor"
  src={{
    light: '/images/blog/ga-week/security-peformance-advisor/index-advisor--light.png',
    dark: '/images/blog/ga-week/security-peformance-advisor/index-advisor.png',
  }}
  captionAlign="left"
  zoomable={false}
/>

Speaking of performance, we have another treat for you. Last week, we announced [PostgreSQL index advisor](https://news.ycombinator.com/item?id=40028111) on Hacker News. This is a Postgres extension that can determine if a given query should have an index. It's already proving useful:

<Quote img="yc.png" caption="noob-4-life on Hacker News">
  Awesome, the Index Advisor sped my slowest query 4x!
</Quote>

The Supabase [Index Advisor](https://github.com/supabase/index_advisor) is now available inside Supabase Studio. We've integrated the Index Advisor into our existing Query Performance tool so that you can find your slowest queries and check recommendations. As its name suggests, this analyzes your queries and make recommendations to add or remove table indexes.

<details>
  <summary>What is an index?</summary>
  <div>
    Not sure what an index is? Imagine having to look up a person's name in a phonebook where the
    entries are not alphabetical. This is what your database tables look like by default. Finding a
    number from a randomly sorted list of records would take a long time. When you add an index, the
    database stores the sorted values, allowing it to quickly locate a row without having to search
    through every record sequentially.
  </div>
</details>

This is just the beginning of our plan to make automated data analysis tooling available to all developers. Even if you're experienced with databases, this will be a huge help with the optimization work you have already planned to do. If you're new to databases, the Index Advisor will help you level-up, surfacing issues and showing you how to fix them.

Let's have a look at some queries:

<Img
  alt="security-peformance-advisor"
  src={{
    light: '/images/blog/ga-week/security-peformance-advisor/no-index--light.png',
    dark: '/images/blog/ga-week/security-peformance-advisor/no-index.png',
  }}
  captionAlign="left"
  zoomable={false}
  caption="This query doesn't need an index"
/>

<Img
  alt="security-peformance-advisor"
  src={{
    light: '/images/blog/ga-week/security-peformance-advisor/needs-index--light.png',
    dark: '/images/blog/ga-week/security-peformance-advisor/needs-index.png',
  }}
  captionAlign="left"
  zoomable={false}
  caption="This query would benefit from an index"
/>

## What's next

We plan to expand the set of suggestions available in Studio to cover more areas of potential improvement for security and performance. Some of the ideas we have in mind for the future include:

- checking for liberally-permissioned columns that contain personally identifiable information (PII)
- identifying bloated tables/indexes
- advanced Postgres configuration
- suggestions for tighting up Supabase Auth as you move into production

### Contributions welcome

Community feedback plays a key role in helping us determine where to invest time developing future lints. We encourage contributions by suggesting new lints or enhancements.

If you have ideas for new lints or wish to report problems you can open an issue on our GitHub repository [`splinter`](https://github.com/supabase/splinter) or [`index_advisor`](https://github.com/supabase/index_advisor).
