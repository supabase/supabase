
## Docker

You can run Supabase on your local machine using `docker-compose`:

- Starting all services: `docker-compose up -d`
- Stopping all services: `docker-compose down`

**Usage**

```js
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://localhost:8000'
const SUPABASE_KEY = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJhdWQiOiIiLCJzdWIiOiIiLCJSb2xlIjoicG9zdGdyZXMifQ.kdRWxJKxqgFOlx4BZQj-GIIOEeMILqUvdHMh8ebcn8M'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

Accessing the services directly:

- Kong: http://localhost:8000
  - GoTrue: http://localhost:8000/auth/v1/
  - PostgREST: http://localhost:8000/rest/v1/
  - Realtime: http://localhost:8000/realtime/v1/
- Postgres: http://localhost:5432

