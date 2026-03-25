---
title: 'Supabase CLI v2: Config as Code'
description: Commit the configuration for all of your Projects and Branches into version control.
author: qiao
imgSocial: launch-week-13/supabase-cli-v2-config-as-code/og.jpg
imgThumb: launch-week-13/supabase-cli-v2-config-as-code/thumb.jpg
categories:
  - product
tags:
  - launch-week
date: '2024-12-04T00:00:00'
toc_depth: 3
launchweek: '13'
---

We have released Supabase CLI v2 today, adding support for Configuration as Code.

This means you can commit the configuration for all of your Projects and Branches into version control (like git) for reproducible environments for your entire team.

## Using the CLI in CI/CD pipelines

The Supabase CLI started as a way to bootstrap the entire Supabase stack on your local machine. It uses exactly the same infra as our hosted platform, giving you unlimited Supabase projects for local testing and offline usage.

In the last 2 years, the CLI has grown to more than 180,000 weekly installs. Nearly 85% of these come from Continuous Integration/Deployment environments like GitHub Actions. Some of the popular CI/CD use cases include migrating production databases, deploying functions, and running pgTAP tests. With this in mind, we started focusing on the CLI as a deployment tool for the v2 release.

## Configuration as Code using the Supabase CLI

<BlogCollapsible title="What is Configuration as Code?" containerClassName="mb-4">

**Configuration as Code** is a practice where infrastructure configuration is managed and versioned in source control using code or declarative files. It allows for automation, consistency, and repeatability. Some examples include Terraform and Docker Compose. It offers several key features:

- **Version Control**: Configurations are stored in repositories like Git, enabling collaboration and history tracking.
- **Reproducibility**: You can recreate environments from code, avoiding manual drift.
- **Automation**: Tools apply configurations automatically, reducing human error.

</ BlogCollapsible >

Our CLI’s Configuration as Code feature is an opinionated setup using a human readable `config.toml` file.

You can make deployments consistent and repeatable by promoting Edge Functions, Storage objects, and other services from preview environments to staging and production.

To demonstrate this workflow, let’s use the `supabase.com` website as an example. It’s hosted on Vercel with [Supabase Branching](/docs/guides/deployment/branching) enabled for development. If you are not using Branching, a similar setup can be achieved using GitHub Actions.

<Admonition type="tip" title="Detecting config drift">

Before changing any project configuration, it’s a good idea to verify that your remote config has not drifted.

This can be done by running `supabase link` command locally which diffs your entire local `config.toml` with your remote project settings.

</Admonition>

### Managing Auth Config

We use Vercel Previews for our frontend. To configure the Auth service of Supabase branches to support login for any Vercel preview URL, we declare a wildcard for the `additional_redirect_urls` in auth config:

```toml
[auth]
additional_redirect_urls = [
  "https://*-supabase.vercel.app/*/*",
  "https://supabase.com/*/*",
  "http://localhost:3000/*/*",
]
```

View the [Auth config](/docs/guides/local-development/cli/config#auth-config) docs.

### Managing Edge Functions

The Supabase website uses several [Edge Functions](https://github.com/supabase/supabase/tree/master/supabase/functions) for AI docs, search embeddings, and image generation for launch week tickets. To configure automatic deployment of `search-embeddings` function, we add the following block to `config.toml`:

```toml
[functions.search-embeddings]
verify_jwt = false
```

If you are using a monorepo (like the [@supabase/supabase](https://github.com/supabase/supabase) GitHub repository), you may also want to customize the paths to your function’s entrypoint and import map files. This is especially useful for code sharing between your frontend application and Edge Functions.

<Admonition type="tip" title="Setting Edge Function secrets">

Edge Function secrets must be manually added to branches as of this release. We plan to support setting Function secrets at deploy time in the near future.

</Admonition>

View the [Edge Functions config](/docs/guides/local-development/cli/config#edge-functions-config) docs.

### Managing Storage Objects

The [images and fonts](https://supabase.com/dashboard/project/xguihxuzqibwxjnimxev/storage/buckets/images) for all launch week tickets are stored in Supabase Storage. These assets are distributed to CDNs around the world to improve latency for visitors to our website.

When developing locally, we can add a `[storage.buckets]` block to `config.toml` so that files in `supabase/assets` directory are automatically uploaded to Supabase Storage.

```toml
[storage.buckets.assets]
objects_path = "./assets"
```

In our case, the assets are small enough (< 1MB) to be committed and tracked in git. This allows branching to automatically seed these objects to Supabase Storage for preview. Larger files like videos are best uploaded to Supabase Storage via AWS S3 CLI.

View the [Storage config](/docs/guides/local-development/cli/config#storage-config) docs.

### Managing Database Settings and Webhooks

While Supabase manages the Postgres default settings based on your database compute size, sometimes you need to tweak these settings yourself. Using the `config.toml` file, we can easily update and keep track of database settings.

```toml
[db.settings]
track_commit_timestamp = true
```

Our Management API automatically figures out if one or more parameters require restarting the database. If not, the config will be applied by simply sending `SIGUP` to Postgres process.

Moreover, you can now enable database webhooks using `[experimental]` config block. This feature allows your database to call HTTP endpoints directly from Postgres functions.

```toml
[experimental.webhooks]
enabled = true
```

To create a webhook, simply add a new [schema migration](https://github.com/supabase/supabase/tree/master/supabase/migrations) file with the before or after triggers for the tables you want to listen on.

View the [Database config](/docs/guides/local-development/cli/config#database-config) docs.

## Managing Branches and multiple “remotes”

If you have [Branching](/docs/guides/deployment/branching#enable-supabase-branching) enabled in your project, your settings in `config.toml` are automatically synced to all your ephemeral branches. This works because we maintain a one-to-one mapping between your git branch and Supabase branch.

To make a config change to your Supabase branch, simply update config.toml and push to GitHub. Our runner will pick up the diff and apply it to the corresponding Supabase branch.

If you need to configure specific settings for a single persistent branch, you can declare them using `[remotes]` block of your config by providing its project ID. For example, the following config declares a separate seed script just for your staging environment.

```toml
[remotes.staging]
project_id = "your-project-ref"

[remotes.staging.db.seed]
sql_paths = ["./seeds/staging.sql"]
```

Since the `project_id` field must refer to an existing branch, you won’t be able to provision and configure a persistent branch in the same commit. Instead, always provision a persistent branch first using the CLI command so you can add the project ID returned to `config.toml`.

```bash
$ supabase --experimental branches create --persistent
Do you want to create a branch named develop? [Y/n]
```

When merging a PR to any persistent branch, our runner checks and logs any configuration changes before applying them to the target remote. If you didn’t declare any remotes or provided the wrong project ID, the whole configuration step would be skipped.

All other config options are also available in the remotes block.

## Getting started

To start using configuration as code, you may follow [our guide](/docs/guides/deployment/branching#how-to-use-supabase-branching) to connect a GitHub repository to your Supabase project and enable Supabase Branching.

Alternatively, you can get started with the Supabase CLI today: `supabase config push`

### Installing

Install the Supabase CLI: [docs](/docs/guides/local-development/cli/getting-started#installing-the-supabase-cli).

### Upgrading

Upgrade your CLI: [docs](/docs/guides/local-development/cli/getting-started#updating-the-supabase-cli).

### Breaking changes

There are no breaking changes in v2.

### Contributors

The CLI Team: [Qiao](https://github.com/sweatybridge), [Andrew](https://github.com/avallete)

The Supabase Team: [Bobbie](https://github.com/soedirgo), [Lakshan](https://github.com/laktek), [Joel](https://github.com/J0), [Filipe](https://github.com/filipecabaco), [TzeYiing](https://github.com/Ziinc), [Div](https://github.com/darora), [Ant](https://github.com/awalias), [Thor](https://github.com/thorwebdev), [Wen Bo](https://github.com/w3b6x9), [Kangming](https://github.com/kangmingtay), [Ivan](https://github.com/ivasilov), [Kevin](https://github.com/KevinBrolly), [Long](https://github.com/loong), [Stojan](https://github.com/hf), [Kamil](https://github.com/kamilogorek), [Inian](https://github.com/inian), [Greg](https://github.com/gregnr), [Fabrizio](https://github.com/fenos), [Chris](https://github.com/encima), [Julien](https://github.com/jgoux), [Terry](https://github.com/saltcod), [Egor](https://github.com/egor-romanov), [Joshen](https://github.com/joshenlim), [Steve](https://github.com/steve-chavez), [Guilherme](https://github.com/grdsdev), [Crispy](https://github.com/Crispy1975), [Bo](https://github.com/burmecia), [Rodrigo](https://github.com/mansueli), [Beng](https://github.com/thebengeu), [Copple](https://github.com/kiwicopple)

With contributions from: [@nyannyacha](https://github.com/nyannyacha), [@grschafer](https://github.com/grschafer), [@osaxma](https://github.com/osaxma), [@theo-m](https://github.com/theo-m), [@kandros](https://github.com/kandros), [@silentworks](https://github.com/silentworks), [@Ananya2001-an](https://github.com/Ananya2001-an), [@Wakeful-Cloud](https://github.com/Wakeful-Cloud), [@snorremd](https://github.com/snorremd), [@S96EA](https://github.com/S96EA), [@wilhuff](https://github.com/wilhuff), [@djhi](https://github.com/djhi), [@FelixZY](https://github.com/FelixZY), [@dagingaa](https://github.com/dagingaa), [@ibilalkayy](https://github.com/ibilalkayy), [@akoenig](https://github.com/akoenig), [@mclean25](https://github.com/mclean25), [@pvanliefland](https://github.com/pvanliefland), [@zlepper](https://github.com/zlepper), [@ruggi99](https://github.com/ruggi99), [@ryankazokas](https://github.com/ryankazokas), [@yahsan2](https://github.com/yahsan2), [@kinolaev](https://github.com/kinolaev), [@simbas](https://github.com/simbas), [@SoraKumo001](https://github.com/SoraKumo001), [@oxcabe](https://github.com/oxcabe), [@PaulRosset](https://github.com/PaulRosset), [@paolodesa](https://github.com/paolodesa), [@eifr](https://github.com/eifr), [@NixBiks](https://github.com/NixBiks), [@nrayburn-tech](https://github.com/nrayburn-tech), [@mosnicholas](https://github.com/mosnicholas), [@NatoNathan](https://github.com/NatoNathan), [@Myzel394](https://github.com/Myzel394), [@mikelhamer](https://github.com/mikelhamer), [@zaerald](https://github.com/zaerald), [@tiniscule](https://github.com/tiniscule), [@samuba](https://github.com/samuba), [@rhnaxifg4y](https://github.com/rhnaxifg4y), [@redraskal](https://github.com/redraskal), [@madx](https://github.com/madx), [@kouwasi](https://github.com/kouwasi), [@etzelc](https://github.com/etzelc), [@arvalaan](https://github.com/arvalaan), [@arika0093](https://github.com/arika0093), [@zachblume](https://github.com/zachblume), [@yashas-hm](https://github.com/yashas-hm), [@vbaluch](https://github.com/vbaluch), [@dshukertjr](https://github.com/dshukertjr), [@tmountain](https://github.com/tmountain), [@tobowers](https://github.com/tobowers), [@tim-dianahr](https://github.com/tim-dianahr), [@StanGirard](https://github.com/StanGirard), [@chreck](https://github.com/chreck), [@chaoky](https://github.com/chaoky), [@carlobeltrame](https://github.com/carlobeltrame), [@bhaan](https://github.com/bhaan), [@bastiaanv](https://github.com/bastiaanv), [@code-withAshish](https://github.com/code-withAshish), [@ashtable](https://github.com/ashtable), [@n0tank3sh](https://github.com/n0tank3sh), [@asevich](https://github.com/asevich), [@aloisklink](https://github.com/aloisklink), [@alinjie](https://github.com/alinjie), [@codesnik](https://github.com/codesnik), [@alexanderl19](https://github.com/alexanderl19), [@alex-ketch](https://github.com/alex-ketch), [@adrientiburce](https://github.com/adrientiburce), [@abeisleem](https://github.com/abeisleem), [@AaronDewes](https://github.com/AaronDewes), [@beeme1mr](https://github.com/beeme1mr), [@isaif](https://github.com/isaif), [@maxkostow](https://github.com/maxkostow), [@Marviel](https://github.com/Marviel), [@xmliszt](https://github.com/xmliszt), [@LautaroJayat](https://github.com/LautaroJayat), [@everzet](https://github.com/everzet), [@kartikk-k](https://github.com/kartikk-k), [@j1philli](https://github.com/j1philli), [@disjukr](https://github.com/disjukr), [@jibin2706](https://github.com/jibin2706), [@felixgabler](https://github.com/felixgabler), [@eleijonmarck](https://github.com/eleijonmarck), [@activenode](https://github.com/activenode), [@jibsaramnim](https://github.com/jibsaramnim), [@byudaniel](https://github.com/byudaniel), [@clarkevandenhoven](https://github.com/clarkevandenhoven)

## Conclusion

Managing your project environments often go beyond schema migrations when your entire backend runs on Supabase. With Supabase CLI v2, you can easily manage these development environments using a configuration file to ensure a consistent development experience between all services in staging and production.
