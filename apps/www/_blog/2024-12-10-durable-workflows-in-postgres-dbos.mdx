---
title: 'Running Durable Workflows in Postgres using DBOS'
description: Technical deep dive into the new DBOS integration for Supabase
author: paul_copplestone
imgSocial: dbos/og.png
imgThumb: dbos/og.png
categories:
  - developers
  - postgres
tags:
  - integration
  - postgres
date: '2024-12-10T00:00:01'
toc_depth: 3
---

Michael Stonebraker is the inventor of Postgres and a Turing Award winner. His latest venture is [DBOS](https://www.dbos.dev/), a three-year joint research project between Stanford and MIT. The DBOS team have built a Durable Workflow engine using Postgres. It's one of the more elegant designs I've seen, leveraging the features of Postgres to keep it lightweight and fast.

The DBOS team have released a Supabase integration, so you can use your Postgres database as a durable workflow engine.

<Img
  alt="DBOS Supabase integration"
  src={{
    dark: '/images/blog/dbos/dbos-integration.png',
    light: '/images/blog/dbos/dbos-integration.png',
  }}
/>

**Continue reading or just get started?**

I really love the design of DBOS, so I'm going to write more below. Their design is aligned with our philosophy at Supabase: “just use Postgres”. I'll take you through the lower-level details in the rest of this post. If you just want to get started using DBOS with Supabase, get started using their tutorial:

[Use DBOS With Supabase →](https://docs.dbos.dev/integrations/supabase)

## What's a Durable Workflow engine?

Let's start with a common situation where a workflow is useful: you're running an e-commerce platform where an order goes through multiple “steps”:

<Img
  alt="Workflow steps"
  src={{
    dark: '/images/blog/dbos/durable-workflow-engine-dark.png',
    light: '/images/blog/dbos/durable-workflow-engine-light.png',
  }}
  quality={100}
/>

The process is simple, but writing a _robust_ program for this is surprisingly difficult. Some potential problems:

- You get to step 2, “Check Inventory”, and you're out of stock. You need to wait 24 hours for the new inventory before you can ship it. You need that “step” to sleep for a day.
- Your program crashes during step 3, “Ship Order”, and it doesn't record that you've shipped the inventory. You end up sending the same order twice.

A Durable Workflow Engine helps with these problems (and more). There are a few on the market that provide different architectures like [Oban](https://oban.pro/), [Trigger.dev](https://trigger.dev/), [Inngest](https://www.inngest.com/), [Windmill](https://www.windmill.dev), [Temporal](https://temporal.io/), and [AWS Step Functions](https://aws.amazon.com/step-functions/).

DBOS offers a relatively unique approach to Workflows, storing the state in your own Postgres database. Let's explore how DBOS does it.

## What is DBOS?

DBOS is a platform where you can write your programming logic in serverless functions (similar to Supabase Edge Functions). Functions can be written in either [Python](https://docs.dbos.dev/python/programming-guide) or [TypeScript](https://docs.dbos.dev/typescript/programming-guide).

### Creating workflows with decorators

One thing that's different to Supabase Edge Functions is the ability to add **decorators** to your Functions with `DBOS.step()` and `DBOS.workflow()`:

<Img
  alt="Python decorators"
  src={{
    dark: '/images/blog/dbos/dbos-python.png',
    light: '/images/blog/dbos/dbos-python.png',
  }}
/>

When you do this, DBOS stores the “state” of every step in Postgres:

<Img
  alt="DBOS state in Postgres"
  src={{
    dark: '/images/blog/dbos/dbos-state-in-pg-dark.svg',
    light: '/images/blog/dbos/dbos-state-in-pg-light.svg',
  }}
/>

This is the part I find the most interesting! If you're a gamer, it's a bit like having a “[save point](https://en.wikipedia.org/wiki/Saved_game)” in your programs. If a Function fails at any point, a new Function can start, picking up at the last checkpoint.

<Img
  alt="DBOS save point"
  src={{
    dark: '/images/blog/dbos/save-final-fantasy.png',
    light: '/images/blog/dbos/save-final-fantasy.png',
  }}
/>

### Storing function state in Postgres

When you create an application with DBOS, they create a new database inside your Postgres cluster for storing this state.

Using their “Widget Store” example, you can see two new databases -

1. `widget_store`: for storing the application data
2. `widget_store_dbos_sys`: for storing the workflow state.

<Img
  alt="Postgres cluster"
  src={{
    dark: '/images/blog/dbos/databases.png',
    light: '/images/blog/dbos/databases.png',
  }}
/>

The `widget_store_dbos_sys` database holds the workflow state:

<Img
  alt="DBOS Schema"
  src={{
    dark: '/images/blog/dbos/schema.png',
    light: '/images/blog/dbos/schema.png',
  }}
/>

### **Workflow logic**

The DBOS team were kind enough to share some of the logic with me about how their workflow engine works:

1. When a workflow starts, it generates a unique ID and stores it in a Postgres `workflow_status` table with a `PENDING` status. It also stores its inputs in Postgres.
2. Each time a step completes, it stores its output in a Postgres `operation_outputs` table.
3. When a workflow completes, it updates its status in the Postgres `workflow_status` table to `SUCCESS` (or to `ERROR`, if it threw an uncaught exception).

### Error logic

If a program is interrupted, on restart the DBOS library launches a background thread that resumes all incomplete workflows from the last completed step.

1. It queries Postgres to find all `PENDING` workflows, then starts each one. Because workflows are just Python functions, it can restart a workflow by simply calling the workflow function with its original inputs, retrieved from Postgres.
2. As a workflow re-executes, before trying each step, it first checks Postgres to see if that step was previously executed. If it finds the step in Postgres, it doesn't re-execute the step, instead re-using its original output.
3. Eventually, the workflow reaches the first step whose output isn't stored in Postgres and resumes execution from there - “resuming from the last completed step.”

All this works because workflows are deterministic, so they can re-execute them using stored step outputs to recover their pre-interruption state.

## The benefits of using Postgres

DBOS isn't the first to create a workflow engine. Others in the market include [Temporal](https://temporal.io/) and [AWS Step Functions](https://aws.amazon.com/step-functions/). DBOS provides a number of benefits over workflow engines that use external orchestrators like AWS Step Functions:

### Performance

Because a step transition is just a Postgres write (~1ms) versus an async dispatch from an external orchestrator (~100ms), it means DBOS is [25x faster than AWS Step Functions](https://www.dbos.dev/blog/dbos-vs-aws-step-functions-benchmark):

<Img
  alt="Add a message"
  src={{
    dark: '/images/blog/dbos/performance.png',
    light: '/images/blog/dbos/performance.png',
  }}
/>

### Exactly-once execution

DBOS has a special `@DBOS.Transaction` decorator. This runs the entire step inside a Postgres transaction. This guarantees exactly-once execution for databases transactional steps.

### Idempotency

You can set an idempotency key for a workflow to guarantee it executes only once, even if called multiple times with that key. Under the hood, this works by setting the workflow's unique ID to your idempotency key.

### Other Postgres features

Since it's all in Postgres, you get all the tooling you're familiar with. Backups, GUIs, CLI tools - you name it. It all “just works”.

## Get started

To get started with DBOS and Supabase, check out their official integration docs:

[Use DBOS With Supabase →](https://docs.dbos.dev/integrations/supabase)
