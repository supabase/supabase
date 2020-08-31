---
id: digitalocean
title: DigitalOcean
description: 'Host your own Realtime server'
---

## Quick Install

You can use our droplet which is registered in the DigitalOcean Marketplace under the name [Supabase Realtime](https://marketplace.digitalocean.com/apps/supabase-realtime).

Before we start, this droplet enables UFW that allows port `22` for SSH, port `5432` for PostgreSQL, and port `4000` for serving Supabase Realtime subscriptions. If you want to use different ports for your PostgreSQL database or Realtime, you have to configure UFW to allow those ports. Otherwise, read on!

Once the droplet is up and running, you first need to point Realtime to listen to your PostgreSQL database. First, SSH to the droplet instance, and edit `/etc/realtime/realtime.env`:

```bash
nano /etc/realtime/realtime.env
```

You'll see some environment variables you will need to set. If you are using our [Supabase Postgres](https://marketplace.digitalocean.com/apps/supabase-postgres) droplet, you simply need to set `DB_HOST` to the Postgres droplet's public IP, `DB_PASSWORD` to the password you set with `\password postgres`, and `SECRET_KEY_BASE` to a randomly generated secret which you can get by running the command below:

```bash
openssl rand -base64 48
```

Now you need the Realtime service to use the newly set environment variables:

```bash
systemctl daemon-reload && systemctl restart realtime
```

You can now disconnect from SSH. Now you should be able to visit your Realtime endpoint at `http://your_realtime_droplet_ip:4000` and receive the greeting page, which means you're ready to subscribe to changes to your database with Realtime!

## Build from Scratch

Make sure you have Packer [installed](https://learn.hashicorp.com/packer/getting-started/install).

Set `DO_API_TOKEN` to a personal access token (you can create one by following [these steps](https://www.digitalocean.com/docs/apis-clis/api/create-personal-access-token/)):

```bash
export DO_API_TOKEN=youraccesstoken
```

Run Packer on `do.json`:

```bash
packer build do.json
```

Launch an instance from the image created by Packer, and follow the steps in Quick Install.
