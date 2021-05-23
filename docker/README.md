# Supabase Docker

You can run Supabase on your local machine or a server using `docker-compose`.
For a more secure setup to use on a server (e.g. using HTTPS), have a look at the *supabase-traefik* setup.

## Configuration

Add your passwords to the .env file.
For better customization and security, please make sure you read the [self-hosting guide](https://supabase.io/docs/guides/self-hosting#running-supabase).

## Run via docker-compose

- Starting all services: `docker-compose up`
- Stopping all services: `docker-compose down`

## Usage

```js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://localhost:8000'
const SUPABASE_KEY = '<anon-apikey-from-kong.yml>'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

Accessing the services directly:

- Kong: http://localhost:8000
  - GoTrue: http://localhost:8000/auth/v1/?apikey=<anon-apikey-from-kong.yml>
  - PostgREST: http://localhost:8000/rest/v1/?apikey=<anon-apikey-from-kong.yml>
  - Realtime: http://localhost:8000/realtime/v1/?apikey=<anon-apikey-from-kong.yml>
- Postgres: http://localhost:5432