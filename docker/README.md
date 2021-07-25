# Supabase Docker

Run Supabase locally.
## Configuration

Add your passwords to the `.env` file.
For better customization and security, please read the [self-hosting guide](https://supabase.io/docs/guides/self-hosting#running-supabase).

## Run via `docker-compose`

- Starting all services: `docker-compose up`
- Stopping all services: `docker-compose down`

## Usage

### Accessing the services directly

- Kong: http://localhost:8000
  - GoTrue: http://localhost:8000/auth/v1/?apikey=<anon-apikey-from-kong.yml>
  - PostgREST: http://localhost:8000/rest/v1/?apikey=<anon-apikey-from-kong.yml>
  - Realtime: http://localhost:8000/realtime/v1/?apikey=<anon-apikey-from-kong.yml>
  - Storage: http://localhost:8000/storage/v1/?apikey=<anon-apikey-from-kong.yml>
- Postgres: http://localhost:5432


### With Javascript

```js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://localhost:8000'
const SUPABASE_KEY = '<anon-apikey-from-kong.yml>'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

### Quickstart example

Once you have started all the services, you can use any of the examples in the `/examples` folder. For example:

- Add some SMTP credentials in `env`
- Run `docker-compose up` 
- Move to the Auth+Storage example: `cd ../examples/nextjs-ts-user-management`
- update `.env.local` 
  - `NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-apikey-from-kong.yml>`
- `npm install`
- `npm run dev`