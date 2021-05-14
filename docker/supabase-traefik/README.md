# not using traefik yet? getting started from scratch

## goal
- super simple to install
- run supabase on bare metal (maximum privacy) - dedicated/root server or vps
- uses letsencrypt certificates
- uses pgadmin to provide at least some interface to supabase on the self hosted supabase instance

## requirements/assumptions
- machine with linux and ssh access
- installed git, docker and docker-compose
- access to a traefik supported dns providers api: [list here](https://doc.traefik.io/traefik/https/acme/#providers)
- traefik isn't used yet
- ports 443 and 80 aren't used yet


## getting started
traefik is a proxy that gets it's configuration from the docker-compose labels.

the labels needed for supabase are already provided in the docker-compose.yml.

### 1. clone the supabase repository
```sh
git clone https://github.com/supabase/supabase
```

### 2. create traefik
#### 2.1 change the directory into the traefik folder
first we are creating traefik to act as the load balancer/reverse proxy/certificate generator
```sh
cd supabase/docker/supabase-traefik/traefik
```

#### 2.2 add your dns provider for automatic/easy certificate generation
edit the *docker/supabase-traefik/traefik/.env* file and add your letsencrypt contact email address as well as your provider. this example is using powerdns.

```.env
# pdns is for powerdns - a self hosted dns server
ACME_DNS_CHALLENGE_PROVIDER=pdns
ACME_EMAIL=letsencrypt@example.com

# dns provider specific config for pdns
PDNS_API_KEY=SOME API KEY
PDNS_API_URL=https://some.url.to.your.pdns.server
```

[learn more about the dns challenge](https://doc.traefik.io/traefik/user-guides/docker-compose/acme-dns/)

[learn more about available dns providers (there are MANY)](https://doc.traefik.io/traefik/https/acme/#providers)

#### 2.3 add the dns provider specific details
edit the *docker/supabase-traefik/traefik/docker-compose.yml* enviroment section to be compatible with your dns provider. this example is using powerdns.

PDNS_API_KEY and PDNS_API_URL are acting as variables between the .env and the docker-compose file.

```.yaml
environment:
    - PDNS_API_KEY=${PDNS_API_KEY}
    - PDNS_API_URL=${PDNS_API_URL}
```

#### 2.4 start traefik
run following command in *docker/supabase-traefik/traefik/* to start traefik detached
```
docker-compose up -d
```


### 3. change the directory into the docker/supabase-traefik folder

```sh
cd ..
```
or
```sh
cd supabase/docker/supabase-traefik
```
if you haven't followed step 2.

### 4. edit the .env file and insert your own enviroment variables: passwords etc.

#### 4.1. change your hostname

- change the SUPABASE_HOSTNAME to the hostname/subdomain you want to use for supabase
```sh
TRAEFIK_NETWORK=rp
SUPABASE_HOSTNAME=supabase.example.com
```
### 5. start the supabase containers with compose 
run following command in *docker/supabase-traefik/* to start the supabase containers detached
```
docker-compose up -d
```
### 6. check out the endpoints below

# if you know traefik: use supabase with existing traefik setup

## fill the .env file run docker-compose up -d and reach the apis here


## endpoints

### **pgadmin**
```
supabase.example.com/pgadmin/
```


### **auth**

```
supabase.example.com/auth/
```
you can test auth with 

```
supabase.example.com/auth/settings 
```
as the default path returns 404

### **realtime**
```
supabase.example.com/realtime/
```

### **rest**
```
supabase.example.com/rest/
```

### **kong**
```
supabase.example.com/kong/
```