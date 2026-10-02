#!/bin/bash
set -euo pipefail
set -x
ulimit -n

if [ -n "${RLIMIT_NOFILE:-}" ]; then
    echo "Setting RLIMIT_NOFILE to ${RLIMIT_NOFILE}"
    ulimit -Sn "$RLIMIT_NOFILE"
fi

export ERL_CRASH_DUMP=/tmp/erl_crash.dump

upload_crash_dump_to_s3() {
    EXIT_CODE=${?:-0}
    bucket=$ERL_CRASH_DUMP_S3_BUCKET
    s3Host=$ERL_CRASH_DUMP_S3_HOST
    s3Port=$ERL_CRASH_DUMP_S3_PORT

    if [ "${AWS_CONTAINER_CREDENTIALS_RELATIVE_URI-}" ]; then
        response=$(curl -s "http://169.254.170.2${AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}")
        s3Key=$(echo "$response" | grep -o '"AccessKeyId": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
        s3Secret=$(echo "$response" | grep -o '"SecretAccessKey": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
    else
        s3Key=$ERL_CRASH_DUMP_S3_KEY
        s3Secret=$ERL_CRASH_DUMP_S3_SECRET
    fi

    filePath=${ERL_CRASH_DUMP_FOLDER:-tmp}/$(date +%s)_${ERL_CRASH_DUMP_FILE_NAME:-erl_crash.dump}

    if [ -f "${ERL_CRASH_DUMP_FOLDER:-tmp}/${ERL_CRASH_DUMP_FILE_NAME:-erl_crash.dump}" ]; then
        mv "${ERL_CRASH_DUMP_FOLDER:-tmp}/${ERL_CRASH_DUMP_FILE_NAME:-erl_crash.dump}" "$filePath"

        resource="/${bucket}/realtime/crash_dumps${filePath}"

        contentType="application/octet-stream"
        dateValue=$(date -R)
        stringToSign="PUT\n\n${contentType}\n${dateValue}\n${resource}"

        signature=$(echo -en "${stringToSign}" | openssl sha1 -hmac "${s3Secret}" -binary | base64)

        if [ "${ERL_CRASH_DUMP_S3_SSL:-}" = true ]; then
            protocol="https"
        else
            protocol="http"
        fi

        curl -v -X PUT -T "${filePath}" \
            -H "Host: ${s3Host}" \
            -H "Date: ${dateValue}" \
            -H "Content-Type: ${contentType}" \
            -H "Authorization: AWS ${s3Key}:${signature}" \
            "${protocol}://${s3Host}:${s3Port}${resource}"
    fi

    exit "$EXIT_CODE"
}

generate_certs() {
    aws secretsmanager get-secret-value --secret-id "${CLUSTER_SECRET_ID}" --region "${CLUSTER_SECRET_REGION}" | jq -r '.SecretString' > cert_secrets
    jq -r '.key' cert_secrets | base64 -d > ca.key
    jq -r '.cert' cert_secrets | base64 -d > ca.cert
    openssl req -new -nodes -out server.csr -keyout server.key -subj "/C=US/ST=Delaware/L=New Castle/O=Supabase Inc/CN=$(hostname -f)"
    openssl x509 -req -in server.csr -days 90 -CA ca.cert -CAkey ca.key -out server.cert
    rm -f ca.key
    CWD=$(pwd)
    export GEN_RPC_CACERTFILE="$CWD/ca.cert"
    export GEN_RPC_KEYFILE="$CWD/server.key"
    export GEN_RPC_CERTFILE="$CWD/server.cert"
    chmod a+r "$GEN_RPC_CACERTFILE"
    chmod a+r "$GEN_RPC_KEYFILE"
    chmod a+r "$GEN_RPC_CERTFILE"
    cat > inet_tls.conf <<EOF
[
  {server, [
    {certfile, "${GEN_RPC_CERTFILE}"},
    {keyfile, "${GEN_RPC_KEYFILE}"},
    {secure_renegotiate, true}
  ]},
  {client, [
    {cacertfile, "${GEN_RPC_CACERTFILE}"},
    {verify, verify_none},
    {secure_renegotiate, true}
  ]}
].
EOF
    export ERL_AFLAGS="${ERL_AFLAGS} -proto_dist inet_tls -ssl_dist_optfile ${CWD}/inet_tls.conf"
}

if [ "${ENABLE_ERL_CRASH_DUMP:-false}" = true ]; then
    trap upload_crash_dump_to_s3 INT TERM EXIT
fi

if [[ -n "${GENERATE_CLUSTER_CERTS:-}" ]] ; then
    generate_certs
fi

echo "Running migrations"
/app/bin/migrate

if [ "${SEED_SELF_HOST-}" = true ]; then
    echo "Seeding selfhosted Realtime"
    /app/bin/realtime eval 'Realtime.Release.seeds(Realtime.Repo)'
fi

echo "Starting Realtime"
ulimit -n
exec "$@"
