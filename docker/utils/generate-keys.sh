#!/bin/sh
#
# Portions of this code are derived from Inder Singh's setup.sh shell script.
# Copyright 2025 Inder Singh. Licensed under Apache License 2.0.
# Original source: https://github.com/singh-inder/supabase-automated-self-host/blob/main/setup.sh
#

set -e

gen_hex() {
    openssl rand -hex "$1"
}

gen_base64() {
    openssl rand -base64 "$1"
}

base64_url_encode() {
    openssl enc -base64 -A | tr '+/' '-_' | tr -d '='
}

gen_token() {
    payload=$1
    payload_base64=$(printf %s "$payload" | base64_url_encode)
    header_base64=$(printf %s "$header" | base64_url_encode)
    signed_content="${header_base64}.${payload_base64}"
    signature=$(printf %s "$signed_content" | openssl dgst -binary -sha256 -hmac "$jwt_secret" | base64_url_encode)
    printf '%s' "${signed_content}.${signature}"
}

if ! command -v openssl >/dev/null 2>&1; then
    echo "Error: openssl is required but not found."
    exit 1
fi

jwt_secret="$(gen_base64 30)"

# Used in get_token()
header='{"alg":"HS256","typ":"JWT"}'
iat=$(date +%s)
exp=$((iat + 5 * 3600 * 24 * 365)) # 5 years

# Normalizes JSON formatting so that the token matches https://www.jwt.io/ results
anon_payload="{\"role\":\"anon\",\"iss\":\"supabase\",\"iat\":$iat,\"exp\":$exp}"
service_role_payload="{\"role\":\"service_role\",\"iss\":\"supabase\",\"iat\":$iat,\"exp\":$exp}"

#echo "anon_payload=$anon_payload"
#echo "service_role_payload=$service_role_payload"

anon_key=$(gen_token "$anon_payload")
service_role_key=$(gen_token "$service_role_payload")

secret_key_base=$(gen_base64 48)
vault_enc_key=$(gen_hex 16)
pg_meta_crypto_key=$(gen_base64 24)

logflare_public_access_token=$(gen_base64 24)
logflare_private_access_token=$(gen_base64 24)

s3_protocol_access_key_id=$(gen_hex 16)
s3_protocol_access_key_secret=$(gen_hex 32)

minio_root_password=$(gen_hex 16)

echo ""
echo "JWT_SECRET=${jwt_secret}"
echo ""
#echo "Issued at: $iat"
#echo "Expire: $exp"
echo "ANON_KEY=${anon_key}"
echo "SERVICE_ROLE_KEY=${service_role_key}"
echo ""
echo "SECRET_KEY_BASE=${secret_key_base}"
echo "VAULT_ENC_KEY=${vault_enc_key}"
echo "PG_META_CRYPTO_KEY=${pg_meta_crypto_key}"
echo "LOGFLARE_PUBLIC_ACCESS_TOKEN=${logflare_public_access_token}"
echo "LOGFLARE_PRIVATE_ACCESS_TOKEN=${logflare_private_access_token}"
echo "S3_PROTOCOL_ACCESS_KEY_ID=${s3_protocol_access_key_id}"
echo "S3_PROTOCOL_ACCESS_KEY_SECRET=${s3_protocol_access_key_secret}"
echo "MINIO_ROOT_PASSWORD=${minio_root_password}"
echo ""

postgres_password=$(gen_hex 16)
dashboard_password=$(gen_hex 16)

echo "POSTGRES_PASSWORD=${postgres_password}"
echo "DASHBOARD_PASSWORD=${dashboard_password}"
echo ""

if ! test -t 0; then
    echo "Running non-interactively. Skipping .env update."
    exit 0
fi

printf "Update .env file? (y/N) "
read -r REPLY
case "$REPLY" in
    [Yy])
        ;;
    *)
        echo "Not updating .env"
        exit 0
        ;;
esac

echo "Updating .env..."

sed \
    -i.old \
    -e "s|^JWT_SECRET=.*$|JWT_SECRET=${jwt_secret}|" \
    -e "s|^ANON_KEY=.*$|ANON_KEY=${anon_key}|" \
    -e "s|^SERVICE_ROLE_KEY=.*$|SERVICE_ROLE_KEY=${service_role_key}|" \
    -e "s|^SECRET_KEY_BASE=.*$|SECRET_KEY_BASE=${secret_key_base}|" \
    -e "s|^VAULT_ENC_KEY=.*$|VAULT_ENC_KEY=${vault_enc_key}|" \
    -e "s|^PG_META_CRYPTO_KEY=.*$|PG_META_CRYPTO_KEY=${pg_meta_crypto_key}|" \
    -e "s|^LOGFLARE_PUBLIC_ACCESS_TOKEN=.*$|LOGFLARE_PUBLIC_ACCESS_TOKEN=${logflare_public_access_token}|" \
    -e "s|^LOGFLARE_PRIVATE_ACCESS_TOKEN=.*$|LOGFLARE_PRIVATE_ACCESS_TOKEN=${logflare_private_access_token}|" \
    -e "s|^S3_PROTOCOL_ACCESS_KEY_ID=.*$|S3_PROTOCOL_ACCESS_KEY_ID=${s3_protocol_access_key_id}|" \
    -e "s|^S3_PROTOCOL_ACCESS_KEY_SECRET=.*$|S3_PROTOCOL_ACCESS_KEY_SECRET=${s3_protocol_access_key_secret}|" \
    -e "s|^MINIO_ROOT_PASSWORD=.*$|MINIO_ROOT_PASSWORD=${minio_root_password}|" \
    -e "s|^POSTGRES_PASSWORD=.*$|POSTGRES_PASSWORD=${postgres_password}|" \
    -e "s|^DASHBOARD_PASSWORD=.*$|DASHBOARD_PASSWORD=${dashboard_password}|" \
    .env
