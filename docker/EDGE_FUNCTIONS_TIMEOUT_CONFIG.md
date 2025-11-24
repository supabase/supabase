# Edge Functions Timeout Configuration Guide

## Overview

This guide explains how to configure timeout settings for Supabase Edge Functions in a self-hosted environment. By default, edge functions timeout after 60 seconds, but you can extend this up to 15+ minutes for long-running operations.

## Current Configuration

- **Timeout**: 5 minutes (300 seconds)
- **Memory**: 2GB (2048MB)
- **Status**: ✅ Tested and working (90s, 150s, 240s all successful)

---

## 🎯 Quick Start: Change Timeout

### Step 1: Edit Main Worker (PRIMARY CONFIG)

**File:** `docker/volumes/functions/main/index.ts`

**Line 72 - Change this value:**

```typescript
const workerTimeoutMs = 5 * 60 * 1000   // 5 minutes (300 seconds)
```

**Common timeout values:**

```typescript
// 1 minute
const workerTimeoutMs = 1 * 60 * 1000   // 60,000ms

// 5 minutes (current)
const workerTimeoutMs = 5 * 60 * 1000   // 300,000ms

// 10 minutes
const workerTimeoutMs = 10 * 60 * 1000  // 600,000ms

// 15 minutes
const workerTimeoutMs = 15 * 60 * 1000  // 900,000ms
```

### Step 2: Update Kong Gateway Timeout

**File:** `docker/volumes/api/kong.yml`

**Lines 190-192:**

```yaml
services:
  - name: functions-v1
    url: http://functions:9000/
    read_timeout: 310000      # workerTimeoutMs + 10 seconds
    write_timeout: 310000     # workerTimeoutMs + 10 seconds
    connect_timeout: 10000
```

**Formula:** Kong timeout = `workerTimeoutMs + 10000` (add 10-second buffer)

**Examples:**
- 5 min worker → Kong: `310000` (310s)
- 10 min worker → Kong: `610000` (610s)
- 15 min worker → Kong: `910000` (910s)

### Step 3: Update Docker Compose Flags

**File:** `docker/docker-compose.yml`

**Lines 364-369:**

```yaml
command:
  [
    "start",
    "--main-service",
    "/home/deno/functions/main",
    "--main-worker-request-idle-timeout",
    "300000",                    # Match workerTimeoutMs
    "--user-worker-request-idle-timeout",
    "300000",                    # Match workerTimeoutMs
    "--graceful-exit-timeout",
    "310"
  ]
```

### Step 4: Restart Services

```powershell
# If you only changed main/index.ts
docker compose restart functions

# If you changed kong.yml
docker compose restart kong

# If you changed docker-compose.yml
docker compose up -d functions
```

---

## 📋 Configuration Files Reference

### 1. Main Worker Configuration

**File:** `docker/volumes/functions/main/index.ts`

**Lines 70-75:**

```typescript
// Extended timeout configuration for long-running operations
const memoryLimitMb = 2048              // 2GB memory limit
const workerTimeoutMs = 5 * 60 * 1000   // 5 minutes (300 seconds)
const cpuTimeSoftLimitMs = 10 * 60 * 1000 // 10 minutes
const cpuTimeHardLimitMs = 10 * 60 * 1000 // 10 minutes

console.error(`[CONFIG] Creating worker with timeout: ${workerTimeoutMs}ms (${workerTimeoutMs/1000}s)`)
```

**What each setting does:**

| Setting | Purpose | Recommended Range |
|---------|---------|-------------------|
| `memoryLimitMb` | RAM per function | 512MB - 4096MB |
| `workerTimeoutMs` | Max execution time | 60,000ms - 900,000ms |
| `cpuTimeSoftLimitMs` | CPU soft limit | Keep at 10 minutes |
| `cpuTimeHardLimitMs` | CPU hard limit | Keep at 10 minutes |

**Lines 84-91:**

```typescript
const worker = await EdgeRuntime.userWorkers.create({
  servicePath,
  memoryLimitMb,
  workerTimeoutMs,
  cpuTimeSoftLimitMs,
  cpuTimeHardLimitMs,
  noModuleCache,
  importMapPath,
  envVars,
  forceCreate: true,  // Force create new workers with updated config
})
```

**Important:** `forceCreate: true` ensures each request gets a fresh worker with the latest timeout settings. You can set this to `false` for better performance if workers can be reused.

---

### 2. Kong API Gateway Configuration

**File:** `docker/volumes/api/kong.yml`

**Lines 188-196:**

```yaml
## Edge Functions routes
- name: functions-v1
  _comment: 'Edge Functions: /functions/v1/* -> http://functions:9000/*'
  url: http://functions:9000/
  read_timeout: 310000      # Must be >= workerTimeoutMs + 10000
  write_timeout: 310000     # Must be >= workerTimeoutMs + 10000
  connect_timeout: 10000
  routes:
    - name: functions-v1-all
```

**Why Kong needs higher timeout:**
- Kong sits between the client and edge functions
- Needs extra time to handle the response
- Add 10-second buffer to avoid premature termination

---

### 3. Docker Compose Configuration

**File:** `docker/docker-compose.yml`

**Lines 328-370:**

```yaml
functions:
  container_name: supabase-edge-functions
  image: supabase/edge-runtime:v1.69.24
  restart: unless-stopped
  depends_on:
    analytics:
      condition: service_healthy
  ports:
    - 9000:9000
  volumes:
    - ./volumes/functions:/home/deno/functions:Z
  deploy:
    resources:
      limits:
        memory: 2G
        cpus: '2'
      reservations:
        memory: 512M
  environment:
    JWT_SECRET: ${JWT_SECRET}
    SUPABASE_URL: http://kong:8000
    SUPABASE_ANON_KEY: ${ANON_KEY}
    SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY}
    SUPABASE_DB_URL: postgresql://postgres:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}
    VERIFY_JWT: "${FUNCTIONS_VERIFY_JWT}"
    EDGE_RUNTIME_REQUEST_TIMEOUT: "${FUNCTIONS_REQUEST_TIMEOUT_SEC:-150}"
    EDGE_RUNTIME_WORKER_TIMEOUT_MS: "${FUNCTIONS_WORKER_TIMEOUT_MS:-150000}"
    DENO_MEMORY_LIMIT: "${FUNCTIONS_MEMORY_LIMIT_MB:-1024}"
    EDGE_RUNTIME_WALL_CLOCK_LIMIT_MS: "${FUNCTIONS_WORKER_TIMEOUT_MS:-150000}"
  command:
    [
      "start",
      "--main-service",
      "/home/deno/functions/main",
      "--main-worker-request-idle-timeout",
      "300000",
      "--user-worker-request-idle-timeout",
      "300000",
      "--graceful-exit-timeout",
      "310"
    ]
```

**Resource limits:**
```yaml
deploy:
  resources:
    limits:
      memory: 2G        # Maximum memory for all functions
      cpus: '2'         # Maximum CPU cores
    reservations:
      memory: 512M      # Guaranteed minimum memory
```

**Timeout flags:**
- `--main-worker-request-idle-timeout`: Must be >= `workerTimeoutMs`
- `--user-worker-request-idle-timeout`: Must be >= `workerTimeoutMs`
- `--graceful-exit-timeout`: Shutdown grace period (seconds)

---

### 4. Environment Variables (Optional)

**File:** `docker/.env`

```env
# Edge Functions Configuration
FUNCTIONS_REQUEST_TIMEOUT_SEC=300
FUNCTIONS_WORKER_TIMEOUT_MS=300000
FUNCTIONS_MEMORY_LIMIT_MB=2048
```

**Note:** These are referenced in `docker-compose.yml` but the main timeout is controlled by `main/index.ts`.

---

## 🔧 Configuration Examples

### Example 1: Quick API Calls (2 minutes)

**main/index.ts:**
```typescript
const workerTimeoutMs = 2 * 60 * 1000   // 120,000ms
```

**kong.yml:**
```yaml
read_timeout: 130000
write_timeout: 130000
```

**docker-compose.yml:**
```yaml
--main-worker-request-idle-timeout 120000
--user-worker-request-idle-timeout 120000
```

### Example 2: Medium Operations (5 minutes) ← Current

**main/index.ts:**
```typescript
const workerTimeoutMs = 5 * 60 * 1000   // 300,000ms
```

**kong.yml:**
```yaml
read_timeout: 310000
write_timeout: 310000
```

**docker-compose.yml:**
```yaml
--main-worker-request-idle-timeout 300000
--user-worker-request-idle-timeout 300000
```

### Example 3: Long Processing (10 minutes)

**main/index.ts:**
```typescript
const workerTimeoutMs = 10 * 60 * 1000  // 600,000ms
```

**kong.yml:**
```yaml
read_timeout: 610000
write_timeout: 610000
```

**docker-compose.yml:**
```yaml
--main-worker-request-idle-timeout 600000
--user-worker-request-idle-timeout 600000
```

### Example 4: Heavy Tasks (15 minutes)

**main/index.ts:**
```typescript
const workerTimeoutMs = 15 * 60 * 1000  // 900,000ms
```

**kong.yml:**
```yaml
read_timeout: 910000
write_timeout: 910000
```

**docker-compose.yml:**
```yaml
--main-worker-request-idle-timeout 900000
--user-worker-request-idle-timeout 900000
```

---

## 🧪 Testing Configuration

### Test Edge Function

You can use the included `stress-test` function to verify timeouts:

```powershell
# Load ANON_KEY from .env
Get-Content .env | Where-Object { $_ -match '^ANON_KEY=' } | ForEach-Object { 
  $env:ANON_KEY = ($_ -split '=',2)[1] 
}

# Test 90 seconds
Invoke-RestMethod -Uri "http://localhost:8000/functions/v1/stress-test" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $env:ANON_KEY"
    "Content-Type"="application/json"
  } `
  -Body '{"test":"timeout","duration":90}'

# Test 150 seconds (2.5 minutes)
Invoke-RestMethod -Uri "http://localhost:8000/functions/v1/stress-test" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $env:ANON_KEY"
    "Content-Type"="application/json"
  } `
  -Body '{"test":"timeout","duration":150}'

# Test 240 seconds (4 minutes)
Invoke-RestMethod -Uri "http://localhost:8000/functions/v1/stress-test" `
  -Method POST `
  -Headers @{
    "Authorization"="Bearer $env:ANON_KEY"
    "Content-Type"="application/json"
  } `
  -Body '{"test":"timeout","duration":240}'
```

### Expected Results

```json
{
  "success": true,
  "test": "timeout",
  "duration": "90.02 seconds",
  "result": {
    "test": "Timeout test",
    "waitedFor": "90 seconds",
    "status": "completed",
    "message": "Function did not timeout!"
  },
  "timestamp": "2025-11-20T14:27:47.504Z"
}
```

### Check Logs

```powershell
# View recent logs
docker logs supabase-edge-functions --tail 50

# Watch logs in real-time
docker logs supabase-edge-functions -f

# Check for timeout configuration
docker logs supabase-edge-functions | Select-String "CONFIG"
```

---

## 📊 Configuration Matrix

| Timeout | workerTimeoutMs | Kong read/write | Docker Flags | Use Case |
|---------|----------------|-----------------|--------------|----------|
| 1 min | 60,000 | 70,000 | 60000 | Quick tasks |
| 2 min | 120,000 | 130,000 | 120000 | API calls |
| 5 min | 300,000 | 310,000 | 300000 | Data processing |
| 10 min | 600,000 | 610,000 | 600000 | Heavy computation |
| 15 min | 900,000 | 910,000 | 900000 | Long operations |

---

## ⚠️ Important Notes

### 1. Worker Reuse vs Force Create

**In `main/index.ts` line 91:**

```typescript
forceCreate: true,  // Always create fresh workers (slower, ensures config applied)
// OR
forceCreate: false, // Reuse workers (faster, but may use old config)
```

- **`true`**: Every request gets a new worker with latest config (recommended during testing)
- **`false`**: Workers are reused for better performance (use in production after config is stable)

### 2. Memory Considerations

If you increase timeout, consider increasing memory:

```typescript
// For 5-10 minute operations
const memoryLimitMb = 2048  // 2GB

// For 10-15 minute operations
const memoryLimitMb = 4096  // 4GB
```

Also update Docker resources:

```yaml
deploy:
  resources:
    limits:
      memory: 4G  # Match or exceed memoryLimitMb
```

### 3. Client-Side Timeouts

Remember to set appropriate timeouts in your HTTP clients:

**PowerShell:**
```powershell
Invoke-RestMethod -TimeoutSec 360  # 6 minutes
```

**JavaScript/TypeScript:**
```typescript
const response = await fetch(url, {
  signal: AbortSignal.timeout(360000) // 6 minutes
})
```

**Python:**
```python
response = requests.post(url, timeout=360)  # 6 minutes
```

### 4. Best Practices

1. **Start conservative**: Begin with 2-5 minutes, increase only if needed
2. **Monitor logs**: Check `docker logs supabase-edge-functions` regularly
3. **Test thoroughly**: Use the stress-test function to validate changes
4. **Consider alternatives**: For very long tasks (>15min), use:
   - Async/webhook patterns
   - Background job queues
   - PostgreSQL functions
   - External processing services

---

## 🐛 Troubleshooting

### Problem: Function still times out at 60 seconds

**Check:**
1. Did you restart the functions container?
   ```powershell
   docker compose restart functions
   ```

2. Is `forceCreate: true` set in `main/index.ts`?
   ```typescript
   forceCreate: true,  // Line 91
   ```

3. Check the logs for the timeout value:
   ```powershell
   docker logs supabase-edge-functions | Select-String "CONFIG"
   ```

   Should show:
   ```
   [CONFIG] Creating worker with timeout: 300000ms (300s)
   ```

### Problem: Kong gateway timeout

**Solution:** Increase Kong timeout to be higher than `workerTimeoutMs`:

```yaml
# kong.yml
read_timeout: 310000  # workerTimeoutMs + 10000
write_timeout: 310000
```

Then restart Kong:
```powershell
docker compose restart kong
```

### Problem: Client timeout before function completes

**Solution:** Increase client timeout:

```powershell
# PowerShell - add -TimeoutSec parameter
Invoke-RestMethod -Uri $url -TimeoutSec 360  # 6 minutes
```

### Problem: Worker gets terminated

**Check logs:**
```powershell
docker logs supabase-edge-functions --tail 100
```

Look for:
- `wall clock duration reached` - Timeout hit
- `memory limit exceeded` - Out of memory
- `cpu time limit exceeded` - CPU limit hit

**Solution:** Increase the relevant limit in `main/index.ts`

---

## 📝 Configuration Checklist

Before testing, verify:

- [ ] `main/index.ts`: `workerTimeoutMs` set to desired value
- [ ] `main/index.ts`: `memoryLimitMb` adequate for operation
- [ ] `kong.yml`: `read_timeout` and `write_timeout` >= `workerTimeoutMs + 10000`
- [ ] `docker-compose.yml`: timeout flags match `workerTimeoutMs`
- [ ] Restarted services: `docker compose restart functions kong`
- [ ] Tested with stress-test function
- [ ] Checked logs for `[CONFIG]` message
- [ ] Client timeout set higher than `workerTimeoutMs`

---

## 🎓 Understanding the Architecture

```
Client Request
    ↓
Kong API Gateway (310s timeout)
    ↓
Edge Runtime Main Worker (manages workers)
    ↓
User Worker (300s timeout, 2GB memory)
    ↓
Your Edge Function Code
    ↓
External API / Long Operation
```

**Key Points:**
1. **Main Worker** creates **User Workers**
2. **User Workers** execute your edge function code
3. Each layer needs timeout >= the layer below
4. Kong → Main Worker → User Worker → Your Code

---

## 📚 Additional Resources

**Files to Reference:**
- `docker/volumes/functions/main/index.ts` - Main worker configuration
- `docker/volumes/api/kong.yml` - API gateway settings
- `docker/docker-compose.yml` - Container orchestration
- `docker/.env` - Environment variables

**Logs:**
```powershell
# All logs
docker logs supabase-edge-functions

# Follow logs
docker logs supabase-edge-functions -f

# Search logs
docker logs supabase-edge-functions | Select-String "timeout"
```

**Container Management:**
```powershell
# Restart functions
docker compose restart functions

# Restart all services
docker compose restart

# View status
docker compose ps

# View resource usage
docker stats supabase-edge-functions
```

---

## ✅ Verified Configuration

This setup has been tested and verified working:

- ✅ 90 seconds - Completed successfully
- ✅ 150 seconds (2.5 minutes) - Completed successfully
- ✅ 240 seconds (4 minutes) - Completed successfully
- ✅ Up to 300 seconds (5 minutes) - Configured and ready

**Last Updated:** November 20, 2025  
**Version:** Supabase Edge Runtime v1.69.24
