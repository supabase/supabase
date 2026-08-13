# End-to-end: the `embed` worker

The canonical scenario for the Select demo — a Python service that receives text over HTTP, calls an embeddings API, writes a row into the project's Postgres, and returns the row id. It exercises the widest surface the alpha promises: Python runtime, public access, secrets, and a DB connection.

## 1. Write the app

`supabase/workers/embed/main.py`:

```python
import os, json
from http.server import BaseHTTPRequestHandler, HTTPServer
import httpx, psycopg

DATABASE_URL = os.environ["DATABASE_URL"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        text = body["text"]

        embedding = httpx.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            json={"model": "text-embedding-3-small", "input": text},
        ).json()["data"][0]["embedding"]

        with psycopg.connect(DATABASE_URL) as conn:
            row = conn.execute(
                "insert into documents (content, embedding) values (%s, %s) returning id",
                (text, embedding),
            ).fetchone()

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"id": row[0]}).encode())

HTTPServer(("0.0.0.0", int(os.environ["PORT"])), Handler).serve_forever()
```

## 2. Add config

`supabase/config.toml`:

```toml
[workers.embed]
runtime   = "python"
size      = "2x1"
access    = "public"
instances = 2
secrets   = ["OPENAI_API_KEY"]
```

`DATABASE_URL` is injected automatically; `OPENAI_API_KEY` resolves from the Secrets API at deploy time.

## 3. Deploy

```bash
supabase workers deploy embed
```

```
› Detected runtime: python (python:3.14-slim)
› Building image … done
› Scheduling 2 instances in us-west-1 …
  deploying ▸ active
✓ embed is live at https://workers.supabase.co/v1/embed
```

## 4. Verify

```bash
curl -L -X POST 'https://workers.supabase.co/v1/embed' \
  -H 'Authorization: Bearer [YOUR ANON KEY]' \
  -H 'Content-Type: application/json' \
  --data '{"text":"hello world"}'
# → {"id":"9f3c…"}
```

## 5. Observe

Open **Workers → embed** in the dashboard:

- **Overview** — last-24h requests, error rate, latency, CPU/memory.
- **Logs** — the request log line, streamed through the Logs Explorer.
- **Settings** — the resolved container (base image, entrypoint, `$PORT → 8080`) and resources.

## Read-it-cold check

A new reader should be able to go from an empty repo to a working `embed` worker without asking a follow-up question. If any step needs outside knowledge, fix the spec — it's the primary artifact for the code-first pass.
