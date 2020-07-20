---
id: aws
title: AWS
description: 'Host your own Realtime server'
---

## Quick Install

You can use our AMI which is registered in the AWS Marketplace under the name [Supabase Realtime](https://aws.amazon.com/marketplace/pp/B089N4FH7N/).

Once the instance is up and running, you first need to point Realtime to listen to your PostgreSQL database. First, SSH to the instance, and edit `/etc/realtime/realtime.env`:

```bash
sudo nano /etc/realtime/realtime.env
```

You'll see some environment variables you need to set. If you use our [Supabase Postgres](https://aws.amazon.com/marketplace/pp/B08915TCJ2?ref_=srh_res_product_title) AMI, you simply need to set `DB_HOST` to the Postgres instance's public IP, `DB_PASSWORD` to the password you set with `\password postgres`, and `SECRET_KEY_BASE` to a randomly generated secret which you can get by running the command below:

```bash
openssl rand -base64 48
```

Now you need the Realtime service to use the newly set environment variables:

```bash
sudo systemctl daemon-reload && sudo systemctl restart realtime
```

You can now disconnect from SSH. Now you should be able to visit your Realtime endpoint at `http://your_realtime_ip:4000` and receive the greeting page, which means you're ready to subscribe to changes to your database with Realtime!

## Build from Scratch

Make sure you have Packer [installed](https://learn.hashicorp.com/packer/getting-started/install).

Set your AWS security credentials (you can create these [here](https://console.aws.amazon.com/iam/home?#security_credential)):

```bash
export AWS_ACCESS_KEY=youraccesskey
export AWS_SECRET_KEY=yoursecretkey
```

Run Packer on `aws.json`:

```bash
packer build aws.json
```

Launch an instance from the image created by Packer, and follow the steps in Quick Install.
