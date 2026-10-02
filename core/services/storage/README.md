# Supabase Storage Engine [![Coverage Status](https://coveralls.io/repos/github/supabase/storage/badge.svg?branch=master)](https://coveralls.io/github/supabase/storage?branch=master) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/supabase/storage)

A scalable, lightweight object storage service.

> Read [this post](https://supabase.io/blog/2021/03/30/supabase-storage) on why we decided to build a new object storage service.

- Multi-protocol support (HTTP, TUS, S3, Iceberg)
- Uses Postgres as its datastore for storing metadata
- Authorization rules are written as Postgres Row Level Security policies
- Integrates with S3 Compatible Storages
- Extremely lightweight and performant

**Supported Protocols**

- [x] HTTP/REST
- [x] TUS Resumable Upload
- [x] S3 Compatible API
- [x] Iceberg REST Catalog

![Architecture](./static/architecture.png?raw=true "Architecture")

## Documentation

- [OpenAPI Spec](https://supabase.github.io/storage)
- [Storage Guides](https://supabase.io/docs/guides/storage)
- [Client library](https://supabase.io/docs/reference/javascript/storage-createbucket)

## Development

- Copy `.env.sample` to `.env` file.
- Copy `.env.test.sample` to `.env.test`.

```bash
cp .env.sample .env && cp .env.test.sample .env.test
```

**Your root directory should now have both `.env` and `.env.test` files.**

- Then run the following:

```bash
# this sets up a postgres database and postgrest locally via docker
npm run infra:restart
# Start the storage server
npm run dev
```

The server should now be running at http://localhost:5000/

The following request should insert and return the list of buckets.

```bash
# insert a bucket named avatars
curl --location --request POST 'http://localhost:5000/bucket' \
--header 'Authorization: Bearer TEST_JWT_REDACTED' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "avatars"
}'

# get buckets
curl --location --request GET 'http://localhost:5000/bucket' \
--header 'Authorization: Bearer TEST_JWT_REDACTED'
```

### Testing

To perform your tests you can run the following command: `npm test`

### Code Quality

- Check: `npm run lint`
- Automatic fix if possible: `npm run lint:fix`
