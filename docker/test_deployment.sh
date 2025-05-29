#!/bin/bash

# Script kiểm thử triển khai nhiều dự án Supabase trên Docker
# Chạy từ thư mục docker

set -e

echo "=== UNIT TEST: TRIỂN KHAI NHIỀU DỰ ÁN SUPABASE ==="
echo "Kiểm tra việc triển khai 2 dự án: project_sang và project_vy"
echo

# Đảm bảo chúng ta đang ở trong thư mục docker
if [[ $(basename $(pwd)) != "docker" ]]; then
    echo "Lỗi: Script này phải được chạy từ thư mục docker"
    exit 1
fi

# Đảm bảo script deploy_supabase.sh có quyền thực thi
chmod +x ./deploy_supabase.sh

# Dọn dẹp các stack test trước đó nếu có
echo "Dọn dẹp các stack test trước đó nếu có..."
if [ -d "./stacks/project_sang" ]; then
    echo "Xóa stack project_sang..."
    rm -rf ./stacks/project_sang
fi

if [ -d "./stacks/project_vy" ]; then
    echo "Xóa stack project_vy..."
    rm -rf ./stacks/project_vy
fi

# Tạo thư mục stacks nếu chưa tồn tại
mkdir -p ./stacks

# Step 1: Triển khai project_sang
echo
echo "=== STEP 1: TRIỂN KHAI PROJECT_SANG ==="
./deploy_supabase.sh project_sang
if [ $? -ne 0 ]; then
    echo "Lỗi: Triển khai project_sang thất bại!"
    exit 1
fi
echo "✅ Triển khai project_sang thành công!"

# Step 2: Kiểm tra cấu trúc thư mục và files của project_sang
echo
echo "=== STEP 2: KIỂM TRA CẤU TRÚC STACK PROJECT_SANG ==="
if [ ! -f "./stacks/project_sang/docker-compose.yml" ]; then
    echo "Lỗi: Không tìm thấy file docker-compose.yml trong project_sang!"
    exit 1
fi

if [ ! -f "./stacks/project_sang/.env" ]; then
    echo "Lỗi: Không tìm thấy file .env trong project_sang!"
    exit 1
fi

if [ ! -x "./stacks/project_sang/start.sh" ]; then
    echo "Lỗi: File start.sh không có quyền thực thi trong project_sang!"
    exit 1
fi

if [ ! -x "./stacks/project_sang/stop.sh" ]; then
    echo "Lỗi: File stop.sh không có quyền thực thi trong project_sang!"
    exit 1
fi

if [ ! -x "./stacks/project_sang/reset.sh" ]; then
    echo "Lỗi: File reset.sh không có quyền thực thi trong project_sang!"
    exit 1
fi

echo "✅ Cấu trúc stack project_sang hợp lệ!"

# Step 3: Triển khai project_vy
echo
echo "=== STEP 3: TRIỂN KHAI PROJECT_VY ==="
./deploy_supabase.sh project_vy
if [ $? -ne 0 ]; then
    echo "Lỗi: Triển khai project_vy thất bại!"
    exit 1
fi
echo "✅ Triển khai project_vy thành công!"

# Step 4: Kiểm tra cấu trúc thư mục và files của project_vy
echo
echo "=== STEP 4: KIỂM TRA CẤU TRÚC STACK PROJECT_VY ==="
if [ ! -f "./stacks/project_vy/docker-compose.yml" ]; then
    echo "Lỗi: Không tìm thấy file docker-compose.yml trong project_vy!"
    exit 1
fi

if [ ! -f "./stacks/project_vy/.env" ]; then
    echo "Lỗi: Không tìm thấy file .env trong project_vy!"
    exit 1
fi

if [ ! -x "./stacks/project_vy/start.sh" ]; then
    echo "Lỗi: File start.sh không có quyền thực thi trong project_vy!"
    exit 1
fi

if [ ! -x "./stacks/project_vy/stop.sh" ]; then
    echo "Lỗi: File stop.sh không có quyền thực thi trong project_vy!"
    exit 1
fi

if [ ! -x "./stacks/project_vy/reset.sh" ]; then
    echo "Lỗi: File reset.sh không có quyền thực thi trong project_vy!"
    exit 1
fi

echo "✅ Cấu trúc stack project_vy hợp lệ!"

# Step 5: Kiểm tra port không xung đột
echo
echo "=== STEP 5: KIỂM TRA PORT KHÔNG XUNG ĐỘT ==="

# Lấy port từ file .env
SANG_KONG_HTTP_PORT=$(grep "KONG_HTTP_PORT=" ./stacks/project_sang/.env | cut -d'=' -f2)
SANG_STUDIO_PORT=$(grep "STUDIO_PORT=" ./stacks/project_sang/.env | cut -d'=' -f2)
SANG_POSTGRES_PORT=$(grep "POSTGRES_PORT=" ./stacks/project_sang/.env | cut -d'=' -f2)

VY_KONG_HTTP_PORT=$(grep "KONG_HTTP_PORT=" ./stacks/project_vy/.env | cut -d'=' -f2)
VY_STUDIO_PORT=$(grep "STUDIO_PORT=" ./stacks/project_vy/.env | cut -d'=' -f2)
VY_POSTGRES_PORT=$(grep "POSTGRES_PORT=" ./stacks/project_vy/.env | cut -d'=' -f2)

echo "PROJECT_SANG ports: Kong HTTP=${SANG_KONG_HTTP_PORT}, Studio=${SANG_STUDIO_PORT}, Postgres=${SANG_POSTGRES_PORT}"
echo "PROJECT_VY ports: Kong HTTP=${VY_KONG_HTTP_PORT}, Studio=${VY_STUDIO_PORT}, Postgres=${VY_POSTGRES_PORT}"

if [ "$SANG_KONG_HTTP_PORT" -eq "$VY_KONG_HTTP_PORT" ]; then
    echo "Lỗi: Kong HTTP port xung đột giữa 2 dự án!"
    exit 1
fi

if [ "$SANG_STUDIO_PORT" -eq "$VY_STUDIO_PORT" ]; then
    echo "Lỗi: Studio port xung đột giữa 2 dự án!"
    exit 1
fi

if [ "$SANG_POSTGRES_PORT" -eq "$VY_POSTGRES_PORT" ]; then
    echo "Lỗi: Postgres port xung đột giữa 2 dự án!"
    exit 1
fi

echo "✅ Các port đã được cấu hình đúng, không xung đột!"

# Step 6: Kiểm tra tự động tạo các giá trị bảo mật
echo
echo "=== STEP 6: KIỂM TRA TỰ ĐỘNG TẠO CÁC GIÁ TRỊ BẢO MẬT ==="

# Kiểm tra các secret đã được tạo và không trùng nhau
SANG_PASSWORD=$(grep "POSTGRES_PASSWORD=" ./stacks/project_sang/.env | cut -d'=' -f2)
VY_PASSWORD=$(grep "POSTGRES_PASSWORD=" ./stacks/project_vy/.env | cut -d'=' -f2)

if [ -z "$SANG_PASSWORD" ]; then
    echo "Lỗi: Không tìm thấy POSTGRES_PASSWORD trong project_sang!"
    exit 1
fi

if [ -z "$VY_PASSWORD" ]; then
    echo "Lỗi: Không tìm thấy POSTGRES_PASSWORD trong project_vy!"
    exit 1
fi

if [ "$SANG_PASSWORD" == "$VY_PASSWORD" ]; then
    echo "Lỗi: POSTGRES_PASSWORD trùng nhau giữa 2 dự án!"
    exit 1
fi

echo "✅ Các giá trị bảo mật được tạo riêng cho mỗi dự án!"

# Step 7: Kiểm tra tên container để đảm bảo không xung đột
echo
echo "=== STEP 7: KIỂM TRA TÊN CONTAINER ==="

# Kiểm tra tên container trong file docker-compose.yml
SANG_CONTAINERS=$(grep "container_name:" ./stacks/project_sang/docker-compose.yml | wc -l)
VY_CONTAINERS=$(grep "container_name:" ./stacks/project_vy/docker-compose.yml | wc -l)

if [ "$SANG_CONTAINERS" -eq 0 ]; then
    echo "Lỗi: Không tìm thấy định nghĩa container trong project_sang!"
    exit 1
fi

if [ "$VY_CONTAINERS" -eq 0 ]; then
    echo "Lỗi: Không tìm thấy định nghĩa container trong project_vy!"
    exit 1
fi

if [ "$SANG_CONTAINERS" -ne "$VY_CONTAINERS" ]; then
    echo "Cảnh báo: Số lượng container khác nhau giữa 2 dự án!"
else
    echo "✓ Số lượng container giống nhau giữa 2 dự án!"
fi

# Kiểm tra xem tên container có chứa tên dự án
SANG_PREFIX_COUNT=$(grep -c "container_name: project_sang-" ./stacks/project_sang/docker-compose.yml)
VY_PREFIX_COUNT=$(grep -c "container_name: project_vy-" ./stacks/project_vy/docker-compose.yml)

if [ "$SANG_PREFIX_COUNT" -eq 0 ]; then
    echo "Lỗi: Không tìm thấy container với prefix project_sang trong project_sang!"
    grep "container_name:" ./stacks/project_sang/docker-compose.yml
    exit 1
fi

if [ "$VY_PREFIX_COUNT" -eq 0 ]; then
    echo "Lỗi: Không tìm thấy container với prefix project_vy trong project_vy!"
    grep "container_name:" ./stacks/project_vy/docker-compose.yml
    exit 1
fi

echo "✅ Tên container đã được cấu hình đúng để tránh xung đột!"

echo
echo "=== KẾT QUẢ UNIT TEST ==="
echo "✅ Tất cả các kiểm tra đều THÀNH CÔNG!"
echo "✅ Hai dự án project_sang và project_vy đã được triển khai thành công và không xung đột!"
echo
echo "Thông tin truy cập project_sang:"
echo "- Studio URL: http://localhost:${SANG_STUDIO_PORT}"
echo "- API URL: http://localhost:${SANG_KONG_HTTP_PORT}"
echo "- Database: localhost:${SANG_POSTGRES_PORT}"
echo
echo "Thông tin truy cập project_vy:"
echo "- Studio URL: http://localhost:${VY_STUDIO_PORT}"
echo "- API URL: http://localhost:${VY_KONG_HTTP_PORT}"
echo "- Database: localhost:${VY_POSTGRES_PORT}"
echo
echo "Để khởi động các stack:"
echo "cd ./stacks/project_sang && ./start.sh"
echo "cd ./stacks/project_vy && ./start.sh"