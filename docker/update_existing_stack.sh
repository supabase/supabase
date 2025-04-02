#!/bin/bash

# Script để cập nhật các stack hiện có với các tính năng mới
# Usage: ./update_existing_stack.sh <stack_name> [domain_or_ip]
# Example: ./update_existing_stack.sh project1 20.255.61.202

set -e

# Kiểm tra tham số dòng lệnh
if [ $# -lt 1 ]; then
    echo "Usage: $0 <stack_name> [domain_or_ip]"
    echo "Example: $0 project1 20.255.61.202"
    echo "The domain_or_ip is optional. If provided, it will be used for external access."
    exit 1
fi

STACK_NAME=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIR="${SCRIPT_DIR}/stacks/${STACK_NAME}"

# Kiểm tra xem stack có tồn tại không
if [ ! -d "$STACK_DIR" ]; then
    echo "Error: Stack directory does not exist: $STACK_DIR"
    echo "Make sure you're running this script from the correct directory and the stack name is correct."
    exit 1
fi

# Kiểm tra xem .env có tồn tại không
if [ ! -f "$STACK_DIR/.env" ]; then
    echo "Error: .env file not found in stack directory: $STACK_DIR/.env"
    exit 1
fi

# Đọc thông tin cấu hình hiện tại từ .env
source "$STACK_DIR/.env"
STUDIO_PORT=${STUDIO_PORT:-3000}
KONG_HTTP_PORT=${KONG_HTTP_PORT:-8000}
POSTGRES_PORT=${POSTGRES_PORT:-5432}

# Kiểm tra nếu có tham số domain_or_ip được truyền vào
if [ $# -ge 2 ]; then
    EXTERNAL_DOMAIN=$2
    echo "Using provided domain/IP for external access: $EXTERNAL_DOMAIN"
    USE_EXTERNAL_URL=true
else
    USE_EXTERNAL_URL=false
    EXTERNAL_DOMAIN="localhost"
fi

# Tạo backup của các file quan trọng trước khi sửa đổi
echo "Creating backups of important files..."
BACKUP_TIME=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${STACK_DIR}/backup_${BACKUP_TIME}"
mkdir -p "$BACKUP_DIR"

# Backup .env file
cp "$STACK_DIR/.env" "$BACKUP_DIR/.env.bak"
echo "Backed up .env file to ${BACKUP_DIR}/.env.bak"

# Backup docker-compose.yml
if [ -f "$STACK_DIR/docker-compose.yml" ]; then
    cp "$STACK_DIR/docker-compose.yml" "$BACKUP_DIR/docker-compose.yml.bak"
    echo "Backed up docker-compose.yml to ${BACKUP_DIR}/docker-compose.yml.bak"
fi

# Backup start.sh, stop.sh, reset.sh
for script in start.sh stop.sh reset.sh; do
    if [ -f "$STACK_DIR/$script" ]; then
        cp "$STACK_DIR/$script" "$BACKUP_DIR/$script.bak"
        echo "Backed up $script to ${BACKUP_DIR}/$script.bak"
    fi
done

echo "Backups completed."

# Cập nhật file .env với cấu hình mới cho truy cập bên ngoài
echo "Updating .env file with external access configuration..."

# Tạo file .env tạm thời
ENV_TEMP=$(mktemp)

# Cập nhật URLs trong file .env
if [ "$USE_EXTERNAL_URL" = true ]; then
    cat "$STACK_DIR/.env" | \
        sed "s|^SITE_URL=.*|SITE_URL=http://${EXTERNAL_DOMAIN}:${STUDIO_PORT}|" | \
        sed "s|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=http://${EXTERNAL_DOMAIN}:${KONG_HTTP_PORT}|" | \
        sed "s|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=http://${EXTERNAL_DOMAIN}:${KONG_HTTP_PORT}|" > "$ENV_TEMP"
    
    echo "Updated URLs in .env file for external access via $EXTERNAL_DOMAIN"
else
    # Không có thay đổi URLs nếu không cung cấp domain/IP
    cat "$STACK_DIR/.env" > "$ENV_TEMP"
fi

# Thêm các biến cấu hình mới nếu chưa tồn tại
if ! grep -q "^DASHBOARD_SECURE=" "$ENV_TEMP"; then
    echo "# Kích hoạt bảo vệ mật khẩu cho dashboard" >> "$ENV_TEMP"
    echo "DASHBOARD_SECURE=true" >> "$ENV_TEMP"
    echo "Added DASHBOARD_SECURE=true to .env"
fi

# Thay thế file .env gốc với file tạm
mv "$ENV_TEMP" "$STACK_DIR/.env"
echo ".env file has been updated."

# Kiểm tra nếu stack hiện tại đang sử dụng Nginx
if [ -f "$STACK_DIR/docker-compose.nginx.yml" ]; then
    USE_NGINX=true
    echo "Detected existing Nginx configuration."
else
    USE_NGINX=false
    echo "No Nginx configuration detected."
    
    # Hỏi người dùng có muốn thêm Nginx hay không
    read -p "Do you want to add Nginx Basic Auth for Studio Dashboard? (y/N) " ADD_NGINX
    if [[ "$ADD_NGINX" =~ ^[Yy]$ ]]; then
        USE_NGINX=true
        echo "Will set up Nginx Basic Auth."
        
        # Sử dụng setup_nginx_auth.sh nếu nó tồn tại
        if [ -f "$SCRIPT_DIR/setup_nginx_auth.sh" ]; then
            echo "Using setup_nginx_auth.sh to configure Nginx..."
            bash "$SCRIPT_DIR/setup_nginx_auth.sh" "$STACK_NAME"
        else
            # Tạo cấu hình Nginx từ đầu nếu setup_nginx_auth.sh không tồn tại
            echo "Setting up Nginx manually..."
            
            # Tạo thư mục cho nginx config
            NGINX_DIR="${STACK_DIR}/nginx"
            mkdir -p "$NGINX_DIR"
            
            # Sử dụng thông tin đăng nhập từ biến môi trường
            NGINX_USERNAME=${DASHBOARD_USERNAME:-supabase}
            NGINX_PASSWORD=${DASHBOARD_PASSWORD:-supabase}
            
            echo "Using credentials for Nginx Basic Auth:"
            echo "Username: ${NGINX_USERNAME}"
            echo "Password: [hidden]"
            
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
            chmod +x "${STACK_DIR}/start_with_nginx.sh"
            
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
            chmod +x "${STACK_DIR}/stop_with_nginx.sh"
        fi
    fi
fi

# Cập nhật start.sh và stop.sh nếu cần
if [ "$USE_NGINX" = true ]; then
    # Kiểm tra nếu start.sh không chứa lệnh khởi động Nginx
    if [ -f "$STACK_DIR/start.sh" ] && ! grep -q "docker compose -f docker-compose.nginx.yml" "$STACK_DIR/start.sh"; then
        echo "Updating start.sh to include Nginx..."
        mv "$STACK_DIR/start.sh" "$STACK_DIR/start.sh.old"
        cat > "$STACK_DIR/start.sh" << EOL
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
EOL

        # Thêm thông tin truy cập dựa trên cấu hình URL
        if [ "$USE_EXTERNAL_URL" = true ]; then
            cat >> "$STACK_DIR/start.sh" << EOL
echo "Studio URL (local): http://studio.${STACK_NAME}.local"
echo "Studio URL (external): http://${EXTERNAL_DOMAIN}:${STUDIO_PORT}"
echo "API URL (local): http://api.${STACK_NAME}.local"
echo "API URL (external): http://${EXTERNAL_DOMAIN}:${KONG_HTTP_PORT}"
EOL
        else
            cat >> "$STACK_DIR/start.sh" << EOL
echo "Studio URL: http://studio.${STACK_NAME}.local"
echo "API URL: http://api.${STACK_NAME}.local"
EOL
        fi

        cat >> "$STACK_DIR/start.sh" << EOL
echo "Database: localhost:${POSTGRES_PORT}"
echo
echo "Dashboard login credentials:"
echo "Username: ${DASHBOARD_USERNAME}"
echo "Password: ${DASHBOARD_PASSWORD}"
echo
echo "Note: You may need to add the following lines to your /etc/hosts file:"
echo "127.0.0.1 studio.${STACK_NAME}.local api.${STACK_NAME}.local"
EOL
        chmod +x "$STACK_DIR/start.sh"
        echo "Updated start.sh script."
    fi

    # Kiểm tra nếu stop.sh không chứa lệnh dừng Nginx
    if [ -f "$STACK_DIR/stop.sh" ] && ! grep -q "docker compose -f docker-compose.nginx.yml" "$STACK_DIR/stop.sh"; then
        echo "Updating stop.sh to include Nginx..."
        mv "$STACK_DIR/stop.sh" "$STACK_DIR/stop.sh.old"
        cat > "$STACK_DIR/stop.sh" << EOL
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
        chmod +x "$STACK_DIR/stop.sh"
        echo "Updated stop.sh script."
    fi

    # Tạo script update_hosts.sh nếu chưa có
    if [ ! -f "$STACK_DIR/update_hosts.sh" ]; then
        echo "Creating update_hosts.sh script..."
        cat > "$STACK_DIR/update_hosts.sh" << EOL
#!/bin/bash
echo "This script will add entries to your /etc/hosts file for the ${STACK_NAME} stack."
echo "You will be prompted for your password as this requires sudo access."

sudo sh -c "echo '# ${STACK_NAME} Supabase stack hosts' >> /etc/hosts"
sudo sh -c "echo '127.0.0.1 studio.${STACK_NAME}.local api.${STACK_NAME}.local' >> /etc/hosts"

echo "Hosts added successfully."
EOL
        chmod +x "$STACK_DIR/update_hosts.sh"
        echo "Created update_hosts.sh script."
    fi
fi

# Cập nhật reset.sh để xử lý Nginx
if [ "$USE_NGINX" = true ] && [ -f "$STACK_DIR/reset.sh" ] && ! grep -q "docker compose -f docker-compose.nginx.yml" "$STACK_DIR/reset.sh"; then
    echo "Updating reset.sh to handle Nginx..."
    mv "$STACK_DIR/reset.sh" "$STACK_DIR/reset.sh.old"
    cat > "$STACK_DIR/reset.sh" << EOL
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
    chmod +x "$STACK_DIR/reset.sh"
    echo "Updated reset.sh script."
fi

# Cập nhật Kong để vô hiệu hóa basic auth nếu đang sử dụng Nginx
if [ "$USE_NGINX" = true ]; then
    KONG_CONFIG_FILE="$STACK_DIR/volumes/api/kong.yml"
    if [ -f "$KONG_CONFIG_FILE" ] && grep -q "name: basic-auth" "$KONG_CONFIG_FILE" && ! grep -q "#.*name: basic-auth" "$KONG_CONFIG_FILE"; then
        echo "Disabling Kong basic auth since we're using Nginx..."
        cp "$KONG_CONFIG_FILE" "$BACKUP_DIR/kong.yml.bak"
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' '/name: basic-auth/,+2 s/^/#/' "$KONG_CONFIG_FILE"
        else
            # Linux/Unix
            sed -i '/name: basic-auth/,+2 s/^/#/' "$KONG_CONFIG_FILE"
        fi
        
        echo "Kong basic auth has been disabled in $KONG_CONFIG_FILE"
    fi
fi

echo "Update completed for stack: ${STACK_NAME}"
echo
if [ "$USE_NGINX" = true ]; then
    echo "This stack is now configured to use Nginx for Basic Auth authentication."
    echo
    echo "To start your updated Supabase stack with Nginx authentication, run:"
    echo "  cd ${STACK_DIR} && ./start.sh"
    echo
    echo "Before starting, you may want to update your hosts file by running:"
    echo "  ${STACK_DIR}/update_hosts.sh"
    echo
    echo "Note: If your stack is currently running, you need to restart it to apply changes:"
    echo "  cd ${STACK_DIR} && ./stop.sh && ./start.sh"
    echo
    if [ "$USE_EXTERNAL_URL" = true ]; then
        echo "Access information after starting:"
        echo "Studio URL (local): http://studio.${STACK_NAME}.local"
        echo "Studio URL (external): http://${EXTERNAL_DOMAIN}:${STUDIO_PORT}"
        echo "API URL (local): http://api.${STACK_NAME}.local" 
        echo "API URL (external): http://${EXTERNAL_DOMAIN}:${KONG_HTTP_PORT}"
    else
        echo "Access information after starting:"
        echo "Studio URL: http://studio.${STACK_NAME}.local"
        echo "API URL: http://api.${STACK_NAME}.local"
    fi
else
    echo "This stack is configured to use Kong for Basic Auth authentication."
    echo
    echo "To start your updated Supabase stack, run:"
    echo "  cd ${STACK_DIR} && ./start.sh"
    echo
    echo "Note: If your stack is currently running, you need to restart it to apply changes:"
    echo "  cd ${STACK_DIR} && ./stop.sh && ./start.sh"
    echo
    if [ "$USE_EXTERNAL_URL" = true ]; then
        echo "Access information after starting:"
        echo "Studio URL: http://${EXTERNAL_DOMAIN}:${STUDIO_PORT}"
        echo "API URL: http://${EXTERNAL_DOMAIN}:${KONG_HTTP_PORT}"
    else
        echo "Access information after starting:"
        echo "Studio URL: http://localhost:${STUDIO_PORT}"
        echo "API URL: http://localhost:${KONG_HTTP_PORT}"
    fi
fi

echo "Database: localhost:${POSTGRES_PORT}"
echo
echo "Dashboard login credentials:"
echo "Username: ${DASHBOARD_USERNAME}"
echo "Password: ${DASHBOARD_PASSWORD}"
echo
echo "All settings are saved in ${STACK_DIR}/.env"