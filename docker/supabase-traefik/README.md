# Supabase Docker with Traefik

Note: this setup is unnofficial. It is supported by the Supabase community only.

This guide is covering a self-hosted Supabase setup with [Traefik](https://github.com/traefik/traefik) as a reverse proxy.

Please make sure you read the [self-hosting guide](https://supabase.io/docs/guides/self-hosting#running-supabase).

## Not using Traefik yet? Getting started from scratch

### Goal

- Super simple to install
- Run Supabase on bare metal (maximum privacy) - dedicated/root server or VPS
- Uses Let's Encrypt certificates
- Uses pgAdmin to provide at least some interface to Supabase on the self-hosted Supabase instance

### Requirements/Assumptions

- Machine with Linux and SSH access
- Installed git, docker and docker-compose
- Access to a Traefik supported DNS providers API: [see this list](https://doc.traefik.io/traefik/https/acme/#providers)
- Traefik isn't used yet
- Ports 443 and 80 aren't used yet


### Getting started

Traefik is a proxy that gets its configuration from the docker-compose labels.
The labels needed for Supabase are already provided in the docker-compose.yml.

#### 1. Clone the Supabase repository

```sh
git clone https://github.com/supabase/supabase
```

#### 2. Setup Traefik

##### 2.1 Change the directory into the Traefik folder

First we are setting up Traefik to act as the reverse proxy and certificate generator.
`cd supabase/docker/supabase-traefik/traefik`

##### 2.2 Add your DNS provider for automatic/easy certificate generation

Edit the *docker/supabase-traefik/traefik/.env* file and add your Let's Encrypt contact email address as well as your provider. This example is using PowerDNS.

```.env
# pdns is for PowerDNS - a self-hosted DNS server
ACME_DNS_CHALLENGE_PROVIDER=pdns
ACME_EMAIL=letsencrypt@example.com

# DNS provider specific config for pdns
PDNS_API_KEY=SOME API KEY
PDNS_API_URL=https://some.url.to.your.pdns.server
```

[Learn more about the DNS challenge](https://doc.traefik.io/traefik/user-guides/docker-compose/acme-dns/)

[Learn more about available DNS providers (there are MANY)](https://doc.traefik.io/traefik/https/acme/#providers)

##### 2.3 Add the DNS provider specific details

Edit the *docker/supabase-traefik/traefik/docker-compose.yml* environment section to be compatible with your DNS provider. This example is using PowerDNS.

PDNS_API_KEY and PDNS_API_URL are acting as variables between the .env and the docker-compose file.

```.yaml
environment:
    - PDNS_API_KEY=${PDNS_API_KEY}
    - PDNS_API_URL=${PDNS_API_URL}
```

##### 2.4 Start Traefik

Run following command in *docker/supabase-traefik/traefik/* to start Traefik detached
`docker-compose up -d`

#### 3. Change the directory into the docker/supabase-traefik folder

`cd ..` (or `cd supabase/docker/supabase-traefik` if you haven't followed Step 2.)

#### 4. Edit the .env file and insert your own environment variables: passwords etc.

##### 4.1. Change your hostname

- Change the SUPABASE_HOSTNAME to the hostname/subdomain you want to use for Supabase
```sh
TRAEFIK_NETWORK=rp
SUPABASE_HOSTNAME=supabase.example.com
```

### 5. Start the Supabase containers with docker-compose

Run following command in *docker/supabase-traefik/* to start the Supabase containers detached
`docker-compose up -d`

### 6. Test the endpoints below


## Use Supabase with an existing Traefik setup

You can also use the docker-compose.yml with an existing Traefik setup.
Just ignore the *traefik* folder and customize the *.env* file and *docker-compose.yml* as it fits your setup. Run `docker-compose up -d` and check if all endpoints below are working. Use them as described in the docker/readme.md.


## Endpoints

### **Kong**

```
supabase.example.com/
```

### **GoTrue**

```
supabase.example.com/auth/v1/
```
you can test GoTrue with

```
supabase.example.com/auth/v1/settings
```
as the default path returns 404

### **PostgREST**

```
supabase.example.com/rest/v1/
```

### **Realtime**

```
supabase.example.com/realtime/v1/
```

### Postgres

The Postgres database is only available internally via the *db* docker network. You can however access it through pgAdmin.
```
supabase.example.com/pgadmin/
```
