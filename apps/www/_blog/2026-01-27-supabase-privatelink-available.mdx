---
title: 'Supabase PrivateLink is now available'
description: 'Connect to your Supabase database without touching the public internet.'
author: miles_thomas
date: '2026-01-27'
categories:
  - launch-week
tags:
  - privatelink
  - aws
  - security
  - networking
  - database
  - postgres
  - compliance
imgSocial: '2026-01-27-supabase-privatelink-available/og.png'
imgThumb: '2026-01-27-supabase-privatelink-available/thumb.png'
toc_depth: 3
---

Today we're launching Supabase PrivateLink, a new capability that lets you connect your database to AWS cloud resources over private networks. When enabled, your database connections stay entirely within the AWS network. No public internet exposure. No additional attack surface.

If you work in a regulated industry or handle sensitive data, you've had this conversation with your security team: "Can we connect to the database without going over the public internet?" Until now, the answer was complicated. You could use IP allowlists and SSL, but traffic still flowed over public networks. For some organizations, that's a non-starter.

Supabase PrivateLink solves this. Traffic never leaves private networks. From a network perspective, your Supabase database behaves like it's inside your own VPC.

This matters for compliance. Many regulatory frameworks require private network connectivity for sensitive data. It also matters for security. Fewer public endpoints mean fewer attack vectors. You can disable public database access entirely once PrivateLink is configured.

## How AWS PrivateLink works

Our AWS PrivateLink implementation uses AWS VPC Lattice under the hood. When you enable PrivateLink, we share a VPC Lattice Resource Configuration with your AWS account. You accept the share and create an endpoint in your VPC.

Your applications connect to the endpoint using a private DNS name. Traffic flows through AWS infrastructure to your Supabase database. The connection supports both direct Postgres connections and PgBouncer for connection pooling.

Latency is typically lower than public connections because traffic takes a more direct path through AWS networks.

## When to use Supabase PrivateLink

Supabase PrivateLink makes sense when:

- **You have compliance requirements.** Highly compliant industries such as healthcare, finance, and public sector often require private network connectivity. PrivateLink satisfies these requirements without needing to do configurations on your own.
- **You want to minimize your attack surface.** Every public endpoint is a potential target. PrivateLink lets you disable public database access entirely.
- **Your workloads already run on AWS.** If your applications are in AWS, setting up PrivateLink is straightforward. Traffic stays within the same cloud provider.

PrivateLink is not necessary for every use case. If you're building a side project or your security requirements are satisfied by SSL and IP allowlists, the standard public connection works fine.

## Current limitations

Supabase PrivateLink is in Beta with some constraints:

- **AWS environments required.** This initial release supports connections to AWS VPCs via PrivateLink. Your workloads need to run in AWS to use PrivateLink.
- **Database connections only.** PrivateLink works for Postgres and PgBouncer connections. It does not cover the Supabase API, Storage, Auth, or Realtime services. Those still use public endpoints. To establish PrivateLink with a Read Replica, reach out to your account rep.
- **Same region required.** Your AWS VPC must be in the same region as your Supabase project.
- **Team or Enterprise plan required.** PrivateLink is available on Team and Enterprise plans.

## Setting it up

If you're familiar with AWS networking, setup is straightforward. Here's the overview:

1. Go to Settings > Integrations in your Supabase dashboard and add your AWS account ID
2. Accept the resource share in your AWS RAM console
3. Create a PrivateLink endpoint in your VPC (or attach to an existing VPC Lattice Service Network)
4. Configure your security group to allow TCP port 5432
5. Update your application connection string to use the private endpoint
6. Test the connection with psql
7. Optionally disable public database access

The full walkthrough with screenshots is in [our documentation](https://supabase.com/docs/guides/platform/privatelink).

## Getting started

Supabase PrivateLink is available today for Team and Enterprise customers. Head to Settings > Integrations in your dashboard to get started.

If you run into issues or have questions, open [a support ticket](https://www.supabase.com/support) or [ask in our Discord](https://discord.supabase.com). We're collecting feedback during the Beta to improve the experience.
