# Supabase Docker

You can run Supabase on your local machine or a server using `docker-compose`.
For a more secure setup to use on a server (e.g. using HTTPS), have a look at the *supabase-traefik* setup.

Update the docker-compose file with your valid AWS_SECRET_ACCESS_KEY and AWS_ACCESS_KEY_ID in the storage section. The key must have permissions to `s3:PutObject , s3:GetObject, s3:DeleteObject` in the bucket you have chosen. 
In production, PGRST_JWT_SECRET and derived keys from the JWT secret like ANON_KEY need to be changed to different values. 

You can run Supabase on your local machine using `docker-compose`:

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
  - GoTrue: http://localhost:8000/auth/v1/
  - PostgREST: http://localhost:8000/rest/v1/
  - Realtime: http://localhost:8000/realtime/v1/
  - Supabase: http://localhost:8000/storage/v1
- Postgres: http://localhost:5432

