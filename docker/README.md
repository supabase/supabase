# Supabase Docker

You can run Supabase on your local machine using `docker-compose`:

- Add passwords to the .env file

- Starting all services: `docker-compose up`
- Stopping all services: `docker-compose down`

**Usage**

```js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://localhost:8000'
const SUPABASE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoxNjIwNzQyMTM1LCJhdWQiOiIiLCJzdWIiOiIiLCJSb2xlIjoiYW5vbiIsImp0aSI6ImQ1N2ZkMjFlLTNkYjQtNDk3YS1hNGViLTI4ZDY3Yzg2NjEwMiJ9.Uc0w024BLhWjMAAdzMJfkMxaFa82N-6pBxAtEGzrXCQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

Accessing the services directly:

- Kong: http://localhost:8000
  - GoTrue: http://localhost:8000/auth/v1/?apikey=XXX
  - PostgREST: http://localhost:8000/rest/v1/?apikey=XXX
  - Realtime: http://localhost:8000/realtime/v1/?apikey=XXX
- Postgres: http://localhost:5432

