---
id: digitalocean
title: DigitalOcean
description: 'Host your own Realtime server'
---

## Create your droplet

Head over to our Digital Ocean marketplace [listing](https://marketplace.digitalocean.com/apps/supabase-postgres) and create your droplet. You are free to create one even at the most basic configuration. No restrictions for you here.

## Set up the password

Set up the password for the DB Superuser **postgres**.

SSH into your instance using the user **root** and type in the following once you are in:

```
$ sudo -u postgres psql
```

This logs you into the **psql** terminal as the DB Superuser **postgres**.

![psql Screenshot](https://dev-to-uploads.s3.amazonaws.com/i/j0kdzn07wu8uawmr6nmz.png)

Set your password with this command:

```
$ \password
```

Enter your desired password afterward and re-enter it when prompted. Once done, you can now exit your SSH connection.

## Try out your new database

With any SQL client of your choice (Such as [DBeaver](https://dbeaver.io/)), connect to your database with the following credentials:

- Host: **_insert droplet ip address_**
- Port: **5432**
- User: **postgres**
- Password: **_insert your chosen password_**
- Database: **postgres**
