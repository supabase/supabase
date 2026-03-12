---
title = "Grafana not displaying data"
github_url = "https://github.com/orgs/supabase/discussions/30579"
date_created = "2024-11-21T03:45:05+00:00"
topics = [ "database" ]
keywords = [ "grafana", "docker", "metrics", "configuration" ]
database_id = "76a4099e-450f-4b5b-a539-224760348c18"
---

This guide is for identifying configuration mistakes in [self-hosted Supabase Grafana installations](/docs/guides/monitoring-troubleshooting/metrics#deploying-supabase-grafana)

## Step 1: Ping your Grafana endpoint

Use the below cURL command to make sure your metrics endpoint returns data:

```sh
curl https://<YOUR_PROJECT_REF>.supabase.co/customer/v1/privileged/metrics --user 'service_role:<SECRET_API_KEY>'
```

## Step 2: Set your Grafana Dashboard to auto-refresh in the top right corner

![388343266-ed4b8f38-e0cd-474e-bc1c-1ac6ae68e1aa](/docs/img/troubleshooting/47998bed-0b77-433a-bfed-63222beb2aee.png)

## Step 3: Make sure your docker container has the default configurations

Run the following command in the terminal:

```sh
docker ps -f name=supabase-grafana
```

The output should look something like this:

![image](/docs/img/troubleshooting/6c284180-0ffd-432d-b86b-e9fbcfe23868.png)

Here it is in an easier to read format

```
- CONTAINER ID: < container id >
- IMAGE: supabase-grafana-supabase-grafana
- COMMAND: /entrypoint.sh
- CREATED: < time >
- STATUS: Up < unit of time > ago
- PORTS: 3000/tcp, 0.0.0.0:8000 → 8080/tcp
- NAMES: supabase-grafana-supabase-grafana-1
```

## Step 4: Enter the container

Try running the following terminal command:

```sh
docker exec -it <container id> bash
```

## Step 5: Check the environment variables for errors

Run the following in the docker container:

```sh
printenv | egrep 'GRAFANA_PASSWORD|SUPABASE_PROJECT_REF|SUPABASE_SERVICE_ROLE_KEY'
```

Ensure the values are correct by comparing them with those in the Dashboard. Users have previously encountered issues by accidentally omitting the last character of their strings, so a thorough check is essential.

## Step 6: Go to the root folder and check permissions on the `entrypoint.sh` file

Run the following terminal commands:

```sh
cd /
ls -l | grep entrypoint.sh
```

`entrypoint.sh` should have the following permissions:

```sh
-rwxr-xr-x
```

If off, update the values

```sh
chmod +x entrypoint.sh
```
