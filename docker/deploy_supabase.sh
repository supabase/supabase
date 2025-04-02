#!/bin/bash

# Script để triển khai nhiều stack Supabase trên cùng một VM mà không xung đột
# Usage: ./deploy_supabase.sh <stack_name> [port_offset]
# Example: ./deploy_supabase.sh project1 2000 

set -e

# Kiểm tra tham số dòng lệnh
if [ $# -lt 1 ]; then
    echo "Usage: $0 <stack_name> [port_offset]"
    echo "Example: $0 project1 2000"
    echo "The port_offset is optional. If not provided, it will be calculated automatically."
    exit 1
fi

STACK_NAME=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="${SCRIPT_DIR}"
TARGET_DIR="${SCRIPT_DIR}/stacks/${STACK_NAME}"

# Kiểm tra nếu có tham số port offset được truyền vào
if [ $# -ge 2 ] && [[ $2 =~ ^[0-9]+$ ]]; then
    PORT_OFFSET=$2
    echo "Using provided port offset: $PORT_OFFSET"
else
    # Tính toán ports cho stack mới (mỗi stack tăng 1000 port)
    # Lấy danh sách các stack đã tồn tại để tính toán port offset
    PORT_OFFSET=0
    for d in "${SCRIPT_DIR}"/stacks/*/; do
        if [ -d "$d" ] && [ -f "${d}/docker-compose.yml" ]; then
            PORT_OFFSET=$((PORT_OFFSET + 1))
        fi
    done
    PORT_OFFSET=$((PORT_OFFSET * 1000))
    echo "Calculated port offset: $PORT_OFFSET"
fi

# Kiểm tra sử dụng Nginx hay Kong
USE_NGINX_AUTH=${USE_NGINX_AUTH:-true}
echo "Using Nginx for authentication: $USE_NGINX_AUTH"

# Tạo các password và token ngẫu nhiên
generate_random_string() {
    local length=$1
    # Sử dụng openssl thay vì cat /dev/urandom để tương thích tốt hơn với macOS
    openssl rand -base64 $((length*2)) | tr -dc 'a-zA-Z0-9' | head -c $length
}

generate_jwt() {
    # Tạo một JWT secret với ít nhất 32 ký tự
    generate_random_string 32
}

# Tạo các giá trị cần thiết
POSTGRES_PASSWORD=$(generate_random_string 30)
JWT_SECRET=$(generate_jwt)

# Sử dụng giá trị iat cố định và tính toán exp chính xác 5 năm sau
IAT_TIMESTAMP=1743440400
EXPIRY_TIMESTAMP=$((IAT_TIMESTAMP + 157680000)) # 5 năm tính bằng giây (60*60*24*365*5)

# Generate properly signed JWT tokens
generate_jwt_token() {
    local role=$1
    local secret=$2
    
    # Create header and payload (as JSON) với iat cố định
    local header='{"alg":"HS256","typ":"JWT"}'
    local payload="{\"role\":\"$role\",\"iss\":\"supabase\",\"iat\":${IAT_TIMESTAMP},\"exp\":${EXPIRY_TIMESTAMP}}"
    
    # Base64url encode header và payload (tương thích với macOS)
    local base64_header=$(printf "%s" "$header" | openssl base64 -A | tr '+/' '-_' | tr -d '=')
    local base64_payload=$(printf "%s" "$payload" | openssl base64 -A | tr '+/' '-_' | tr -d '=')
    
    # Tạo chữ ký
    local signature=$(printf "%s.%s" "$base64_header" "$base64_payload" | openssl dgst -binary -sha256 -hmac "$secret" | openssl base64 -A | tr '+/' '-_' | tr -d '=')
    
    # Trả về JWT hoàn chỉnh
    echo "$base64_header.$base64_payload.$signature"
}

ANON_KEY=$(generate_jwt_token "anon" "$JWT_SECRET")
SERVICE_ROLE_KEY=$(generate_jwt_token "service_role" "$JWT_SECRET")

DASHBOARD_USERNAME="supabase"
DASHBOARD_PASSWORD=$(generate_random_string 16)
SECRET_KEY_BASE=$(generate_random_string 64)
VAULT_ENC_KEY=$(generate_random_string 32)
LOGFLARE_API_KEY=$(generate_random_string 32)
POOLER_TENANT_ID=$(generate_random_string 16)

echo "Preparing to deploy Supabase stack: ${STACK_NAME}"
echo "Creating directory structure..."

# Tạo thư mục cho stack mới
mkdir -p "${SCRIPT_DIR}/stacks"
if [ -d "$TARGET_DIR" ]; then
    echo "Directory $TARGET_DIR already exists. Do you want to overwrite it? (y/N)"
    read -p "> " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "Aborting."
        exit 1
    fi
    rm -rf "$TARGET_DIR"
fi

mkdir -p "$TARGET_DIR"
mkdir -p "$TARGET_DIR/volumes/db/data"
mkdir -p "$TARGET_DIR/volumes/storage"
mkdir -p "$TARGET_DIR/volumes/functions"
mkdir -p "$TARGET_DIR/dev"

# Base ports
BASE_KONG_HTTP_PORT=8000
BASE_KONG_HTTPS_PORT=8443
BASE_POSTGRES_PORT=5432
BASE_STUDIO_PORT=3000
BASE_POOLER_PORT=6543
BASE_ANALYTICS_PORT=4000

# Calculate ports for new stack
KONG_HTTP_PORT=$((BASE_KONG_HTTP_PORT + PORT_OFFSET))
KONG_HTTPS_PORT=$((BASE_KONG_HTTPS_PORT + PORT_OFFSET))
POSTGRES_PORT=$((BASE_POSTGRES_PORT + PORT_OFFSET))
STUDIO_PORT=$((BASE_STUDIO_PORT + PORT_OFFSET))
POOLER_PORT=$((BASE_POOLER_PORT + PORT_OFFSET))
ANALYTICS_PORT=$((BASE_ANALYTICS_PORT + PORT_OFFSET))

echo "This stack will use the following ports:"
echo "Kong HTTP: ${KONG_HTTP_PORT}"
echo "Kong HTTPS: ${KONG_HTTPS_PORT}"
echo "Postgres: ${POSTGRES_PORT}"
echo "Studio: ${STUDIO_PORT}"
echo "Pooler: ${POOLER_PORT}"
echo "Analytics: ${ANALYTICS_PORT}"

# Sao chép và sửa đổi các file cấu hình cần thiết
echo "Copying and modifying configuration files..."

# Copy các thư mục cần thiết
cp -r "$DOCKER_DIR/volumes/api" "$TARGET_DIR/volumes/"
cp -r "$DOCKER_DIR/volumes/db/init" "$TARGET_DIR/volumes/db/"
cp -r "$DOCKER_DIR/volumes/db/_supabase.sql" "$TARGET_DIR/volumes/db/"
cp -r "$DOCKER_DIR/volumes/db/jwt.sql" "$TARGET_DIR/volumes/db/"
cp -r "$DOCKER_DIR/volumes/db/logs.sql" "$TARGET_DIR/volumes/db/"
cp -r "$DOCKER_DIR/volumes/db/pooler.sql" "$TARGET_DIR/volumes/db/"
cp -r "$DOCKER_DIR/volumes/db/realtime.sql" "$TARGET_DIR/volumes/db/"
cp -r "$DOCKER_DIR/volumes/db/roles.sql" "$TARGET_DIR/volumes/db/"
cp -r "$DOCKER_DIR/volumes/db/webhooks.sql" "$TARGET_DIR/volumes/db/"
cp -r "$DOCKER_DIR/volumes/logs" "$TARGET_DIR/volumes/"
cp -r "$DOCKER_DIR/volumes/pooler" "$TARGET_DIR/volumes/"
cp -r "$DOCKER_DIR/dev/data.sql" "$TARGET_DIR/dev/"
cp "$DOCKER_DIR/docker-compose.yml" "$TARGET_DIR/"
cp "$DOCKER_DIR/docker-compose.s3.yml" "$TARGET_DIR/"
cp "$DOCKER_DIR/dev/docker-compose.dev.yml" "$TARGET_DIR/dev/"

# Tạo file .env với các giá trị ngẫu nhiên đã tạo
cat > "$TARGET_DIR/.env" << EOL
############
# Secrets - Auto-generated by deploy script
############

POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
ANON_KEY=${ANON_KEY}
SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
DASHBOARD_USERNAME=${DASHBOARD_USERNAME}
DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}
SECRET_KEY_BASE=${SECRET_KEY_BASE}
VAULT_ENC_KEY=${VAULT_ENC_KEY}

############
# Database
############

POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=${POSTGRES_PORT}

############
# Supavisor -- Database pooler
############
POOLER_PROXY_PORT_TRANSACTION=${POOLER_PORT}
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_TENANT_ID=${POOLER_TENANT_ID}

############
# API Proxy - Configuration for the Kong Reverse proxy.
############

KONG_HTTP_PORT=${KONG_HTTP_PORT}
KONG_HTTPS_PORT=${KONG_HTTPS_PORT}

############
# API - Configuration for PostgREST.
############

PGRST_DB_SCHEMAS=public,storage,graphql_public

############
# Auth - Configuration for the GoTrue authentication server.
############

## General
SITE_URL=http://localhost:${STUDIO_PORT}
ADDITIONAL_REDIRECT_URLS=
JWT_EXPIRY=3600
DISABLE_SIGNUP=false
API_EXTERNAL_URL=http://localhost:${KONG_HTTP_PORT}

## Mailer Config
MAILER_URLPATHS_CONFIRMATION="/auth/v1/verify"
MAILER_URLPATHS_INVITE="/auth/v1/verify"
MAILER_URLPATHS_RECOVERY="/auth/v1/verify"
MAILER_URLPATHS_EMAIL_CHANGE="/auth/v1/verify"

## Email auth
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=fake_sender
ENABLE_ANONYMOUS_USERS=false

## Phone auth
ENABLE_PHONE_SIGNUP=true
ENABLE_PHONE_AUTOCONFIRM=true

############
# Studio - Configuration for the Dashboard
############

STUDIO_DEFAULT_ORGANIZATION=Default Organization
STUDIO_DEFAULT_PROJECT=${STACK_NAME}
STUDIO_PORT=${STUDIO_PORT}
# replace if you intend to use Studio outside of localhost
SUPABASE_PUBLIC_URL=http://localhost:${KONG_HTTP_PORT}

# Kích hoạt bảo vệ mật khẩu cho dashboard - Sẽ sử dụng Nginx thay vì Kong nên có thể tắt
DASHBOARD_SECURE=${USE_NGINX_AUTH}

# Enable webp support
IMGPROXY_ENABLE_WEBP_DETECTION=true

# Add your OpenAI API key to enable SQL Editor Assistant
OPENAI_API_KEY=

############
# Functions - Configuration for Functions
############
# NOTE: VERIFY_JWT applies to all functions. Per-function VERIFY_JWT is not supported yet.
FUNCTIONS_VERIFY_JWT=false

############
# Logs - Configuration for Logflare
############

LOGFLARE_LOGGER_BACKEND_API_KEY=${LOGFLARE_API_KEY}
LOGFLARE_API_KEY=${LOGFLARE_API_KEY}
DOCKER_SOCKET_LOCATION=/var/run/docker.sock
EOL

# Sửa đổi docker-compose.yml để thêm tên stack và thay đổi tên container
# Sử dụng phiên bản sed tương thích với macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/name: supabase/name: ${STACK_NAME}/g" "$TARGET_DIR/docker-compose.yml"
    sed -i '' "s/container_name: supabase-/container_name: ${STACK_NAME}-/g" "$TARGET_DIR/docker-compose.yml"
    sed -i '' "s/container_name: realtime-dev.supabase-realtime/container_name: realtime-dev.${STACK_NAME}-realtime/g" "$TARGET_DIR/docker-compose.yml"
else
    # Linux/Unix
    sed -i "s/name: supabase/name: ${STACK_NAME}/g" "$TARGET_DIR/docker-compose.yml"
    sed -i "s/container_name: supabase-/container_name: ${STACK_NAME}-/g" "$TARGET_DIR/docker-compose.yml"
    sed -i "s/container_name: realtime-dev.supabase-realtime/container_name: realtime-dev.${STACK_NAME}-realtime/g" "$TARGET_DIR/docker-compose.yml"
fi

# Nếu sử dụng Nginx, cập nhật kong.yml để tắt basic auth
if [ "$USE_NGINX_AUTH" = true ]; then
    KONG_CONFIG_FILE="$TARGET_DIR/volumes/api/kong.yml"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' '/name: basic-auth/,+2 s/^/#/' "$KONG_CONFIG_FILE"
    else
        # Linux/Unix
        sed -i '/name: basic-auth/,+2 s/^/#/' "$KONG_CONFIG_FILE"
    fi
    echo "Disabled Kong basic auth (will use Nginx instead)"
else
    # Vẫn sử dụng Kong Basic Auth, cập nhật thông tin đăng nhập
    KONG_CONFIG_FILE="$TARGET_DIR/volumes/api/kong.yml"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - sử dụng sed tương thích với macOS
        sed -i '' "s/\$DASHBOARD_USERNAME/${DASHBOARD_USERNAME}/g" "$KONG_CONFIG_FILE"
        sed -i '' "s/\$DASHBOARD_PASSWORD/${DASHBOARD_PASSWORD}/g" "$KONG_CONFIG_FILE"
    else
        # Linux/Unix
        sed -i "s/\$DASHBOARD_USERNAME/${DASHBOARD_USERNAME}/g" "$KONG_CONFIG_FILE"
        sed -i "s/\$DASHBOARD_PASSWORD/${DASHBOARD_PASSWORD}/g" "$KONG_CONFIG_FILE"
    fi
    echo "Updated Kong basic auth credentials"
fi

# Thêm port cho Studio và chỉnh sửa file docker-compose.yml
echo "Adjusting port configurations in docker-compose.yml..."

# Tạo file docker-compose mới với các thay đổi cần thiết
TEMPFILE=$(mktemp)

# Tìm và thay thế cấu hình Studio
awk -v port="$STUDIO_PORT" -v stack="$STACK_NAME" '
BEGIN { in_studio = 0; found_env = 0; }

/\s+studio:/ { in_studio = 1; }

/\s+environment:/ {
  if (in_studio) { found_env = 1; }
}

{
  if (in_studio && /image: supabase\/studio:/) {
    print $0;
    print "    ports:";
    print "      - " port ":3000";
    if (!found_env) {
      print "    environment:";
      print "      - STUDIO_DEFAULT_PROJECT=" stack;
    }
    next;
  }
  else if (in_studio && found_env && /\s+environment:/) {
    print $0;
    print "      - STUDIO_DEFAULT_PROJECT=" stack;
    next;
  }
  else if (/4000:4000/) {
    gsub("4000:4000", "'$ANALYTICS_PORT':4000");
    print $0;
    next;
  }
  else if (/\s+[^-]/) {
    if (in_studio && found_env) {
      found_env = 0;
    }
    if ($0 !~ /\s+studio:/) {
      in_studio = 0;
    }
  }
  print $0;
}
' "$TARGET_DIR/docker-compose.yml" > "$TEMPFILE"

# Thay thế file gốc với file đã sửa
mv "$TEMPFILE" "$TARGET_DIR/docker-compose.yml"

# Thiết lập Nginx nếu được yêu cầu
if [ "$USE_NGINX_AUTH" = true ]; then
    # Thiết lập Nginx
    echo "Setting up Nginx with Basic Auth..."
    
    # Tạo thư mục cho nginx config
    NGINX_DIR="${TARGET_DIR}/nginx"
    mkdir -p "$NGINX_DIR"
    
    # Sử dụng thông tin đăng nhập từ biến môi trường để đồng bộ với .env
    # Giữ nguyên DASHBOARD_USERNAME và DASHBOARD_PASSWORD đã được thiết lập ở trên
    echo "Using credentials for Nginx Basic Auth:"
    echo "Username: ${DASHBOARD_USERNAME}"
    echo "Password: [hidden]"
    
    # Tạo file htpasswd cho Basic Auth
    if command -v htpasswd &> /dev/null; then
        # Sử dụng htpasswd nếu có sẵn
        htpasswd -bc "${NGINX_DIR}/.htpasswd" "$DASHBOARD_USERNAME" "$DASHBOARD_PASSWORD"
    else
        # Nếu không có htpasswd, tạo password hash bằng openssl
        PASSWORD_HASH=$(openssl passwd -apr1 "$DASHBOARD_PASSWORD")
        echo "${DASHBOARD_USERNAME}:${PASSWORD_HASH}" > "${NGINX_DIR}/.htpasswd"
    fi
    
    # Tạo config cho Nginx
    cat > "${NGINX_DIR}/nginx.conf" << EOL
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                      '\$status \$body_bytes_sent "\$http_referer" '
                      '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;
    
    # Supabase Studio Configuration
    server {
        listen 80;
        server_name studio.${STACK_NAME}.local;
        
        location / {
            auth_basic "Restricted Access";
            auth_basic_user_file /etc/nginx/.htpasswd;
            
            proxy_pass http://host.docker.internal:${STUDIO_PORT};
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }

    # Supabase API Configuration (no authentication required)
    server {
        listen 80;
        server_name api.${STACK_NAME}.local;
        
        location / {
            proxy_pass http://host.docker.internal:${KONG_HTTP_PORT};
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOL

    # Tạo docker-compose.nginx.yml
    cat > "${TARGET_DIR}/docker-compose.nginx.yml" << EOL
version: '3'

services:
  nginx:
    image: nginx:latest
    container_name: ${STACK_NAME}-nginx
    ports:
      - 80:80
      - 443:443
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/.htpasswd:/etc/nginx/.htpasswd:ro
    restart: always
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - ${STACK_NAME}

networks:
  ${STACK_NAME}:
    external: true
EOL

    # Tạo script start_with_nginx.sh
    cat > "${TARGET_DIR}/start.sh" << EOL
#!/bin/bash

cd "\$(dirname "\$0")"

# Khởi động Supabase stack
echo "Starting Supabase stack..."
docker compose up -d

# Chờ một chút để đảm bảo network đã được tạo
sleep 5

# Khởi động Nginx
echo "Starting Nginx reverse proxy with Basic Auth..."
docker compose -f docker-compose.nginx.yml up -d

echo "${STACK_NAME} stack started with Nginx authentication!"
echo
echo "Access information:"
echo "Studio URL: http://studio.${STACK_NAME}.local"
echo "API URL: http://api.${STACK_NAME}.local"
echo "Database: localhost:${POSTGRES_PORT}"
echo
echo "Dashboard login credentials:"
echo "Username: ${DASHBOARD_USERNAME}"
echo "Password: ${DASHBOARD_PASSWORD}"
echo
echo "Note: You may need to add the following lines to your /etc/hosts file:"
echo "127.0.0.1 studio.${STACK_NAME}.local api.${STACK_NAME}.local"
EOL

    # Tạo script stop.sh
    cat > "${TARGET_DIR}/stop.sh" << EOL
#!/bin/bash

cd "\$(dirname "\$0")"

# Dừng Nginx
echo "Stopping Nginx reverse proxy..."
docker compose -f docker-compose.nginx.yml down

# Dừng Supabase stack
echo "Stopping Supabase stack..."
docker compose down

echo "${STACK_NAME} stack and Nginx stopped!"
EOL
else
    # Tạo script khởi động và tắt cho stack này khi không sử dụng Nginx
    cat > "$TARGET_DIR/start.sh" << EOL
#!/bin/bash
cd "\$(dirname "\$0")"
docker compose up -d
echo "${STACK_NAME} stack started on:"
echo "Studio: http://localhost:${STUDIO_PORT}"
echo "API: http://localhost:${KONG_HTTP_PORT}"
echo "Database: localhost:${POSTGRES_PORT}"
echo
echo "Dashboard login credentials:"
echo "Username: ${DASHBOARD_USERNAME}"
echo "Password: ${DASHBOARD_PASSWORD}"
EOL

    cat > "$TARGET_DIR/stop.sh" << EOL
#!/bin/bash
cd "\$(dirname "\$0")"
docker compose down
echo "${STACK_NAME} stack stopped"
EOL
fi

# Tạo script reset cho stack (giống nhau dù có dùng Nginx hay không)
cat > "$TARGET_DIR/reset.sh" << EOL
#!/bin/bash
cd "\$(dirname "\$0")"
echo "WARNING: This will remove all containers and container data. This action cannot be undone!"
read -p "Are you sure you want to reset ${STACK_NAME} stack? (y/N) " -n 1 -r
echo
if [[ ! \$REPLY =~ ^[Yy]$ ]]
then
    echo "Operation cancelled."
    exit 1
fi

# Dừng Nginx nếu đang chạy
if [ -f "docker-compose.nginx.yml" ]; then
    echo "Stopping Nginx reverse proxy..."
    docker compose -f docker-compose.nginx.yml down
fi

echo "Stopping and removing all containers..."
docker compose -f docker-compose.yml -f ./dev/docker-compose.dev.yml down -v --remove-orphans

echo "Cleaning up bind-mounted directories..."
rm -rf ./volumes/db/data

echo "${STACK_NAME} stack has been reset!"
EOL

# Thiết lập quyền thực thi cho các script và các tệp quan trọng
chmod +x "$TARGET_DIR/start.sh"
chmod +x "$TARGET_DIR/stop.sh"
chmod +x "$TARGET_DIR/reset.sh"
chmod 644 "$TARGET_DIR/docker-compose.yml"
chmod 644 "$TARGET_DIR/docker-compose.s3.yml"
chmod 644 "$TARGET_DIR/.env"
chmod 644 "$TARGET_DIR/dev/docker-compose.dev.yml"

if [ "$USE_NGINX_AUTH" = true ]; then
    chmod 644 "$TARGET_DIR/docker-compose.nginx.yml"
    chmod 644 "$TARGET_DIR/nginx/nginx.conf"
    chmod 644 "$TARGET_DIR/nginx/.htpasswd"
    
    # Tạo thêm một script để cập nhật thông tin hosts
    cat > "$TARGET_DIR/update_hosts.sh" << EOL
#!/bin/bash
echo "This script will add entries to your /etc/hosts file for the ${STACK_NAME} stack."
echo "You will be prompted for your password as this requires sudo access."

sudo sh -c "echo '# ${STACK_NAME} Supabase stack hosts' >> /etc/hosts"
sudo sh -c "echo '127.0.0.1 studio.${STACK_NAME}.local api.${STACK_NAME}.local' >> /etc/hosts"

echo "Hosts added successfully."
EOL
    chmod +x "$TARGET_DIR/update_hosts.sh"
fi

# Đảm bảo quyền đọc cho mọi người đối với tất cả các tệp dữ liệu
find "$TARGET_DIR/volumes" -type f -exec chmod 644 {} \;
# Đảm bảo quyền thực thi cho tất cả thư mục
find "$TARGET_DIR" -type d -exec chmod 755 {} \;

echo "Stack ${STACK_NAME} has been prepared successfully!"
if [ "$USE_NGINX_AUTH" = true ]; then
    echo "This stack is configured to use Nginx for Basic Auth authentication."
    echo
    echo "To start your Supabase stack with Nginx authentication, run:"
    echo "  cd ${TARGET_DIR} && ./start.sh"
    echo
    echo "Before starting, you may want to update your hosts file by running:"
    echo "  ${TARGET_DIR}/update_hosts.sh"
    echo
    echo "Access information after starting:"
    echo "Studio URL: http://studio.${STACK_NAME}.local"
    echo "API URL: http://api.${STACK_NAME}.local"
else
    echo "This stack is configured to use Kong for Basic Auth authentication."
    echo
    echo "To start your Supabase stack, run:"
    echo "  cd ${TARGET_DIR} && ./start.sh"
    echo
    echo "Access information after starting:"
    echo "Studio URL: http://localhost:${STUDIO_PORT}"
    echo "API URL: http://localhost:${KONG_HTTP_PORT}"
fi

echo "Database: localhost:${POSTGRES_PORT}"
echo
echo "Dashboard login credentials:"
echo "Username: ${DASHBOARD_USERNAME}"
echo "Password: ${DASHBOARD_PASSWORD}"
echo
echo "All settings are saved in ${TARGET_DIR}/.env"