upstream kong_upstream {
    server kong:8000;
    keepalive 2;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;

    server_name ${PROXY_DOMAIN};
    server_tokens off;

    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Port $server_port;

    ssl_certificate /etc/letsencrypt/live/${PROXY_DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${PROXY_DOMAIN}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${PROXY_DOMAIN}/chain.pem;

    ssl_dhparam /etc/letsencrypt/dhparams/dhparam.pem;

    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Prevent 502 errors from large Supabase auth cookies
    large_client_header_buffers 4 16k;
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        auth_basic "supabase";
        auth_basic_user_file /etc/nginx/user_conf.d/dashboard-passwd;

        proxy_pass http://studio:3000;
    }

    location /auth {
        proxy_pass http://kong_upstream;
    }

    location /rest {
        proxy_pass http://kong_upstream;
    }

    location /graphql {
        proxy_pass http://kong_upstream;
    }

    location /realtime/v1/ {
        proxy_pass http://kong_upstream;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $http_host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_read_timeout 3600s;
    }

    location /storage/v1/ {
        proxy_pass http://kong_upstream;

        proxy_buffering off;
        proxy_request_buffering off;

        chunked_transfer_encoding off;

        client_max_body_size 0;
    }

    location /functions {
        proxy_pass http://kong_upstream;
    }

    location /mcp {
        proxy_pass http://kong_upstream;
    }
}
