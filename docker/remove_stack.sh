#!/bin/bash

# Script để xóa stack Supabase và giải phóng bộ nhớ
# Usage: ./remove_stack.sh <stack_name>
# Example: ./remove_stack.sh project1

set -e

# Kiểm tra tham số dòng lệnh
if [ $# -lt 1 ]; then
    echo "Usage: $0 <stack_name>"
    echo "Example: $0 project1"
    exit 1
fi

STACK_NAME=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STACK_DIR="${SCRIPT_DIR}/stacks/${STACK_NAME}"

# Kiểm tra xem stack có tồn tại không
if [ ! -d "$STACK_DIR" ]; then
    echo "Error: Stack '$STACK_NAME' does not exist in ${SCRIPT_DIR}/stacks/"
    echo "Available stacks:"
    for d in "${SCRIPT_DIR}"/stacks/*/; do
        if [ -d "$d" ]; then
            echo "- $(basename "$d")"
        fi
    done
    exit 1
fi

echo "WARNING: This will permanently remove the stack '$STACK_NAME' and all its data."
echo "This action cannot be undone!"
read -p "Are you sure you want to proceed? (y/N) " -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 1
fi

# Kiểm tra nếu stack đang chạy thì dừng lại trước
if [ -f "$STACK_DIR/docker-compose.yml" ]; then
    echo "Stopping the stack if it's running..."
    (cd "$STACK_DIR" && docker compose down --volumes --remove-orphans) || true
fi

# Xóa các container và volume liên quan đến stack
echo "Removing all containers and volumes associated with '$STACK_NAME'..."

# Hiển thị các container, volumes sẽ bị xóa
echo "The following resources will be removed:"
docker ps -a | grep "${STACK_NAME}-" || true
docker volume ls | grep "${STACK_NAME}" || true

# Xóa các container
containers=$(docker ps -a --format "{{.ID}}" --filter "name=${STACK_NAME}-")
if [ ! -z "$containers" ]; then
    docker rm -f $containers || true
    echo "Containers removed."
else
    echo "No containers to remove."
fi

# Xóa các volume
volumes=$(docker volume ls --format "{{.Name}}" | grep "${STACK_NAME}")
if [ ! -z "$volumes" ]; then
    echo $volumes | xargs -r docker volume rm || true
    echo "Volumes removed."
else
    echo "No volumes to remove."
fi

# Xóa thư mục stack
echo "Removing stack directory..."
rm -rf "$STACK_DIR"

echo "Stack '$STACK_NAME' has been completely removed and resources freed."

# Hiển thị thông tin về bộ nhớ đã giải phóng
echo
echo "System resources after cleanup:"
echo "Docker disk usage:"
docker system df
echo
echo "Available disk space:"
df -h | grep -E "(Filesystem|/$)"