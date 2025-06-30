# UnifiedLogs Service Flow - Complete Field Mapping

## Overview

This document maps all 35+ extracted fields across the PostgREST service flow blocks, with smart groupings and collapsible details for enhanced user experience.

## Field Mapping by Service Flow Block

### 🚀 RequestStartedBlock (Simple Timeline Marker)

**Purpose**: Clean timeline entry point
**Primary Display**:

- `timestamp` → Formatted timestamp
  **Notes**: Keep minimal - no additional fields, just a clean timeline marker

---

### 🌐 NetworkBlock (Client & Request Info)

**Purpose**: All client, network, and authentication information

#### Primary Display (Always Visible):

- `request.host` → Host (filterable)
- `request.method` → Method (filterable)
- `request.path` → Path (filterable, truncated if long)
- `user_agent` → Client (parsed with icons: 🖥️ Chrome on macOS)

#### Collapsible "Auth Details":

- `apikey.role` → API Key Role (`anon`, `service_role`, `<invalid>`, `<unrecognized>`)
- `apikey.prefix` → API Key Prefix (e.g., "sb\_...")
- `apikey.error` → API Key Error (if invalid)
- `jwt.apikey_role` → JWT API Key Role
- `jwt.apikey_expires_at` → API Key Expires
- `authorization.role` → Auth Role (`authenticated`, `anon`)
- `auth_user` → Auth User (if authenticated)
- `user_id` → User UUID (from JWT sub claim)
- `user_email` → User Email (from JWT)
- `jwt.auth_role` → Auth Token Role
- `jwt.auth_expires_at` → Auth Token Expires

#### Collapsible "Location Details":

- `client.country` → Country (DE)
- `client.city` → City (Kirchheim unter Teck)
- `client.continent` → Continent (EU)
- `client.region` → Region (Baden-Wurttemberg)
- `client.timezone` → Timezone (Europe/Berlin)

#### Collapsible "Technical Details":

- `network.protocol` → Protocol (HTTP/3)
- `cf_datacenter` → Datacenter (MUC)
- `cf_ray` → Cloudflare Ray ID
- `headers.x_client_info` → SDK (supabase-js-node/2.49.4)
- `headers.x_forwarded_proto` → Forwarded Proto (https)
- `headers.x_real_ip` → Real IP (87.155.168.75)
- `client_ip` → IP address

---

### ⚡ PostgRESTBlock (API Processing Layer)

**Purpose**: PostgREST API processing information

#### Primary Display (Always Visible):

- `response.status_code` → Status (filterable, with color coding)
- `response.origin_time` → Response Time (12ms)

#### Collapsible "Response Details":

- `response.content_type` → Content Type
- `response.cache_status` → Cache Status (HIT/MISS/etc.)

---

### 🗄️ PostgresBlock (Database Layer)

**Purpose**: Database execution information

#### Primary Display (Always Visible):

- Execution status (show if skipped due to error, or execution info)

#### Collapsible "Execution Details" (if not skipped):

- All postgres fields (currently mostly placeholders)
- Future: SQL queries, execution times, etc.

---

### ✅ ResponseCompletedBlock (Simple Timeline Marker)

**Purpose**: Clean timeline completion point
**Primary Display**:

- `response.status_code` → Final status code
- Total response time (if available)
  **Notes**: Keep minimal - no additional fields, just completion marker

---

## SQL Field Extraction Patterns

### API Authentication Fields:

```sql
-- API Key Role
CASE
    WHEN apikey_payload.algorithm = 'HS256' AND
         apikey_payload.issuer = 'supabase' AND
         apikey_payload.role IN ('anon', 'service_role') AND
         apikey_payload.subject IS NULL
    THEN apikey_payload.role
    WHEN sb_apikey.invalid = true THEN '<invalid>'
    WHEN apikey_payload IS NOT NULL THEN '<unrecognized>'
    ELSE NULL
END as api_key_role

-- API Key Prefix
sb_apikey_data.prefix as api_key_prefix

-- API Key Error
sb_apikey_data.error as api_key_error
```

### User Authorization Fields:

```sql
-- Authorization Role
authorization_payload.role as auth_role

-- User Information
authorization_payload.sub as user_id
authorization_payload.email as user_email

-- Auth User (existing field)
COALESCE(sb.auth_user, null) as auth_user
```

### Network/Location Fields:

```sql
-- Cloudflare Info
el_response_headers.cf_ray
el_request_headers.cf_ipcountry as cf_country
el_request_headers.cf_datacenter

-- Client Info
el_request_headers.user_agent
el_request.client_ip as ip_address

-- Location Details (from client enrichment)
client.city
client.continent
client.region
client.timezone
```

### Technical Network Fields:

```sql
-- Protocol and Headers
network.protocol
headers.x_client_info
headers.x_forwarded_proto
headers.x_real_ip

-- Response Details
response.content_type
response.cache_status
```

## Implementation Notes

### Filtering Capabilities:

- **Primary display fields** should be filterable (host, method, path, status)
- **Collapsible sections** are for detailed inspection, not filtering

### UI/UX Considerations:

- **Collapsible sections** prevent information overload
- **Smart grouping** by logical function (Auth, Location, Technical)
- **Color coding** for status fields
- **Icon parsing** for user agents and clients
- **Truncation** for long paths with expand option

### Performance:

- **Lazy loading** of collapsible content where possible
- **Memoization** of expensive parsing (user agent, etc.)
- **Efficient SQL** with proper JOINs and field selection

## Future Enhancements

### PostgresBlock Expansion:

- SQL query details
- Execution plans
- Performance metrics
- Connection pool info

### Real-time Updates:

- Live status updates
- Progressive enhancement of data
- WebSocket integration for live flows

### Analytics Integration:

- Performance trending
- Error pattern detection
- User behavior analysis

EXAMPLE LOG

[
{
"load_balancer_experimental_routing": null,
"load_balancer_geo_aware": null,
"load_balancer_geo_aware_info": [],
"load_balancer_redirect_identifier": null,
"logflare_worker": [
{
"worker_id": "USSCHQ"
}
],
"request": [
{
"cf": [
{
"asOrganization": "Whiz Communications Pte Ltd",
"asn": 135600,
"botManagement": [
{
"corporateProxy": false,
"detectionIds": [],
"ja3Hash": "70cb5ca646080902703ffda87036a5ea",
"ja4": "t13d5912h1_a33745022dd6_dbd39dd1d406",
"ja4Signals": [
{
"browser_ratio_1h": 0.023358112201095,
"cache_ratio_1h": 0.096206642687321,
"h2h3_ratio_1h": 0.0087053598836064,
"heuristic_ratio_1h": 0.046240977942944,
"ips_quantile_1h": 0.99975997209549,
"ips_rank_1h": 193,
"paths_rank_1h": 90,
"reqs_quantile_1h": 0.99991172552109,
"reqs_rank_1h": 71,
"uas_rank_1h": 164
}
],
"jsDetection": [
{
"passed": false
}
],
"score": 5,
"staticResource": false,
"verifiedBot": false
}
],
"city": "Ulu Bedok",
"clientAcceptEncoding": "br, gzip, deflate",
"clientTcpRtt": 7,
"clientTrustScore": 5,
"colo": "SIN",
"continent": "AS",
"country": "SG",
"edgeRequestKeepAliveStatus": 1,
"httpProtocol": "HTTP/1.1",
"isEUCountry": null,
"latitude": "1.33333",
"longitude": "103.93333",
"metroCode": null,
"postalCode": "460080",
"region": null,
"regionCode": null,
"requestPriority": null,
"timezone": "Asia/Singapore",
"tlsCipher": "AEAD-AES256-GCM-SHA384",
"tlsClientAuth": [
{
"certFingerprintSHA1": null,
"certFingerprintSHA256": null,
"certIssuerDN": null,
"certIssuerDNLegacy": null,
"certIssuerDNRFC2253": null,
"certIssuerSKI": null,
"certIssuerSerial": null,
"certNotAfter": null,
"certNotBefore": null,
"certPresented": "0",
"certRevoked": "0",
"certSKI": null,
"certSerial": null,
"certVerified": "NONE"
}
],
"tlsClientCiphersSha1": "JZtiTn8H/ntxORk+XXvU2EvNoz8=",
"tlsClientExtensionsSha1": "GWeb1cCR2UBICwtIDbeP9YjL/PU=",
"tlsClientExtensionsSha1Le": "LddRTv85Gcz7xx7AQg+t+GZR5bs=",
"tlsClientHelloLength": "668",
"tlsClientRandom": "g/ytW8C1gyqgqwQz0w0PeeUPLsGyLtgtBtlNinD0wtk=",
"tlsExportedAuthenticator": [
{
"clientFinished": "8643ae9d5304bbda435d53f7202f8e8bdeb624e5c5313dc7ecdcfec2074c5c9bd4a7edfa6c11e322bbc585a11e267d13",
"clientHandshake": "d51edbcba4ba21500ffdfe597182231d69e7f8bafabb6c22c6494cd54a5d94e4ac0a615e5c308b76e69a0fb1b1492f8d",
"serverFinished": "a35393a1a9b56715c48971f12a4fee7387f1a11d1c7162263efcc93faae2009c44689c037a0162f0aeda84fcde299214",
"serverHandshake": "c7d0cd7a47f04471af8aa688b681f6762a41114ded8fb723f60707e07a20be85a4189e1da1c8cbe1be02ab1870ef7c8c"
}
],
"tlsVersion": "TLSv1.3",
"verifiedBotCategory": null
}
],
"headers": [
{
"accept": "*/*",
"apikey": null,
"cf_connecting_ip": "203.17.180.248",
"cf_ipcountry": "SG",
"cf_ray": "955c1e9f3b3e87e7",
"content_length": null,
"content_type": null,
"date": null,
"host": "nvuctzbxnaodprxqefiv.supabase.red",
"prefer": null,
"range": null,
"referer": null,
"user_agent": "node",
"x_client_info": "supabase-js/2.21.0",
"x_forwarded_host": null,
"x_forwarded_proto": "https",
"x_jwt_aud": null,
"x_real_ip": "203.17.180.248"
}
],
"host": "nvuctzbxnaodprxqefiv.supabase.red",
"method": "GET",
"path": "/rest/v1/todos",
"port": null,
"protocol": "https:",
"sb": [
{
"apikey": [],
"auth_user": "ca05724b-55de-4d6c-86e7-7f42ed7ef628",
"jwt": [
{
"apikey": [
{
"invalid": null,
"payload": [
{
"algorithm": "HS256",
"expires_at": 2047062544,
"issuer": "supabase",
"key_id": null,
"role": "service_role",
"signature_prefix": "NwrKjN",
"subject": null
}
]
}
],
"authorization": [
{
"invalid": null,
"payload": [
{
"algorithm": "HS256",
"expires_at": 1750938371,
"issuer": "https://nvuctzbxnaodprxqefiv.supabase.red/auth/v1",
"key_id": "aMCtsP5re7oodhgB",
"role": "authenticated",
"session_id": "0091f145-a399-473a-83fb-821356da86f6",
"signature_prefix": "ck1XRp",
"subject": "ca05724b-55de-4d6c-86e7-7f42ed7ef628"
}
]
}
]
}
]
}
],
"search": "?select=_&order=id.desc",
"url": "https://nvuctzbxnaodprxqefiv.supabase.red/rest/v1/todos?select=_&order=id.desc"
}
],
"response": [
{
"headers": [
{
"cf_cache_status": "DYNAMIC",
"cf_ray": "955c1e9f51ab87e7-SIN",
"content_length": null,
"content_location": "/todos?order=id.desc&select=%2A",
"content_range": "0-6/*",
"content_type": "application/json; charset=utf-8",
"date": "Thu, 26 Jun 2025 10:46:13 GMT",
"sb_gateway_mode": null,
"sb_gateway_version": "1",
"transfer_encoding": "chunked",
"x_kong_proxy_latency": null,
"x_kong_upstream_latency": null,
"x_sb_error_code": null
}
],
"origin_time": 17,
"status_code": 200
}
]
}
]
