#!/bin/bash

# Script để thiết lập Nginx reverse proxy với Basic Auth cho Supabase Studio Dashboard
# Được thiết kế để chạy tự động khi khởi tạo stack Docker và tự đồng bộ khi stack bị dừng hoặc xóa

set -e

# Kiểm tra xem đã truyền đủ tham số hay chưa
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <stack_name>"
    exit 1
fi

STACK_NAME=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIR="${SCRIPT_DIR}/stacks/${STACK_NAME}"

# Kiểm tra xem stack có tồn tại không
if [ ! -d "$STACK_DIR" ]; then
    echo "Error: Stack directory does not exist: $STACK_DIR"
    exit 1
fi

# Đọc thông tin port từ file .env
if [ ! -f "$STACK_DIR/.env" ]; then
    echo "Error: .env file not found in stack directory: $STACK_DIR/.env"
    exit 1
fi

# Lấy thông tin từ file .env
echo "Reading configuration from $STACK_DIR/.env"
source "$STACK_DIR/.env"
STUDIO_PORT=${STUDIO_PORT:-3000}
KONG_HTTP_PORT=${KONG_HTTP_PORT:-8000}

# Sử dụng thông tin đăng nhập từ file .env của stack
NGINX_USERNAME=${DASHBOARD_USERNAME:-supabase}
NGINX_PASSWORD=${DASHBOARD_PASSWORD:-supabase}

echo "Using credentials from .env file:"
echo "Username: $NGINX_USERNAME"
echo "Password: [hidden]"

# Tạo thư mục cho nginx config
NGINX_DIR="${STACK_DIR}/nginx"
mkdir -p "$NGINX_DIR"

# Tạo file htpasswd cho Basic Auth
if command -v htpasswd &> /dev/null; then
    # Sử dụng htpasswd nếu có sẵn
    htpasswd -bc "${NGINX_DIR}/.htpasswd" "$NGINX_USERNAME" "$NGINX_PASSWORD"
else
    # Nếu không có htpasswd, tạo password hash bằng openssl
    PASSWORD_HASH=$(openssl passwd -apr1 "$NGINX_PASSWORD")
    echo "${NGINX_USERNAME}:${PASSWORD_HASH}" > "${NGINX_DIR}/.htpasswd"
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
cat > "${STACK_DIR}/docker-compose.nginx.yml" << EOL
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

# Thêm thông tin hosts
echo "Updating /etc/hosts file (requires sudo)..."
echo "Please add the following lines to your /etc/hosts file:"
echo "127.0.0.1 studio.${STACK_NAME}.local api.${STACK_NAME}.local"

# Tạo script start_with_nginx.sh
cat > "${STACK_DIR}/start_with_nginx.sh" << EOL
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
echo "Username: ${NGINX_USERNAME}"
echo "Password: ${NGINX_PASSWORD}"
echo
echo "Note: You may need to add the following lines to your /etc/hosts file:"
echo "127.0.0.1 studio.${STACK_NAME}.local api.${STACK_NAME}.local"
EOL

# Tạo script stop_with_nginx.sh
cat > "${STACK_DIR}/stop_with_nginx.sh" << EOL
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

# Thiết lập quyền thực thi
chmod +x "${STACK_DIR}/start_with_nginx.sh"
chmod +x "${STACK_DIR}/stop_with_nginx.sh"

echo "Nginx reverse proxy with Basic Auth has been set up for ${STACK_NAME} stack!"
echo "To start the stack with Nginx authentication, run: ${STACK_DIR}/start_with_nginx.sh"
echo
echo "Dashboard login credentials:"
echo "Username: ${NGINX_USERNAME}"
echo "Password: ${NGINX_PASSWORD}"
echo
echo "Please add the following lines to your /etc/hosts file:"
echo "127.0.0.1 studio.${STACK_NAME}.local api.${STACK_NAME}.local"