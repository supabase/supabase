# Supabase Docker Multi-Stack Deployment

Đây là hướng dẫn triển khai nhiều stack Supabase trên cùng một máy chủ Ubuntu hoặc macOS thông qua Docker mà không gây xung đột với nhau.

## Giải pháp triển khai nhiều stack Supabase

Script triển khai `deploy_supabase.sh` cho phép bạn:
- Tạo nhiều stack Supabase trên cùng một máy chủ
- Tự động tạo các mật khẩu, token và khóa bảo mật
- Gán các port khác nhau cho mỗi stack để tránh xung đột
- Tạo các tên container khác nhau để dễ quản lý
- Hỗ trợ xác thực bằng Nginx với Basic Auth cho Supabase Studio Dashboard

## Yêu cầu hệ thống

- Ubuntu/Debian hoặc macOS (script tương thích với cả hai môi trường)
- Docker và Docker Compose đã cài đặt
- Đã clone repository Supabase

## Cách sử dụng

### 1. Triển khai stack mới

```bash
cd docker
./deploy_supabase.sh <tên_stack> [port_offset]
```

Ví dụ:
```bash
# Triển khai với tự động tính toán port offset
./deploy_supabase.sh project1

# Triển khai với port offset chỉ định
./deploy_supabase.sh project2 2000

# Triển khai với Nginx Basic Auth (mặc định)
USE_NGINX_AUTH=true ./deploy_supabase.sh project3

# Triển khai với Kong Basic Auth (chế độ xác thực cũ)
USE_NGINX_AUTH=false ./deploy_supabase.sh project4
```

Script sẽ:
1. Tạo thư mục `stacks/<tên_stack>` với tất cả các tệp cấu hình cần thiết
2. Tạo các mật khẩu và token ngẫu nhiên an toàn
3. Tự động tính toán và gán các port không xung đột
4. Điều chỉnh cấu hình để stack chạy độc lập
5. Cấu hình phương thức xác thực (Nginx hoặc Kong) cho Supabase Studio Dashboard
6. Tạo các script tiện ích (start.sh, stop.sh, reset.sh)

### 2. Khởi động stack

```bash
cd docker/stacks/<tên_stack>
./start.sh
```

Nếu bạn sử dụng xác thực Nginx, script sẽ tự động:
- Khởi động stack Supabase
- Khởi động Nginx với cấu hình Basic Auth
- Hiển thị thông tin đăng nhập

### 3. Cập nhật file hosts (khi sử dụng Nginx)

Khi sử dụng Nginx Basic Auth, bạn cần thêm các tên miền vào file hosts:

```bash
cd docker/stacks/<tên_stack>
./update_hosts.sh
```

Hoặc thủ công thêm vào file `/etc/hosts`:
```
127.0.0.1 studio.<tên_stack>.local api.<tên_stack>.local
```

### 4. Truy cập stack

Sau khi khởi động thành công, bạn có thể truy cập:

**Khi sử dụng Kong (phương thức xác thực cũ):**
- **Studio UI**: http://localhost:<studio_port>
- **API Endpoint**: http://localhost:<kong_http_port>
- **Database**: localhost:<postgres_port>

**Khi sử dụng Nginx (phương thức xác thực mới - mặc định):**
- **Studio UI**: http://studio.<tên_stack>.local
- **API Endpoint**: http://api.<tên_stack>.local
- **Database**: localhost:<postgres_port>

Thông tin đăng nhập sẽ được hiển thị sau khi triển khai và trong script start.sh.

### 5. Dừng và reset stack

Để dừng stack:
```bash
cd docker/stacks/<tên_stack>
./stop.sh
```

Để reset dữ liệu stack:
```bash
cd docker/stacks/<tên_stack>
./reset.sh
```

Các script này tự động xử lý cả Supabase stack và Nginx (nếu được cấu hình).

### 6. Thêm Nginx Basic Auth vào stack hiện có

Nếu bạn đã có một stack Supabase và muốn thêm Nginx Basic Auth:

```bash
cd docker
./setup_nginx_auth.sh <tên_stack>
```

Script sẽ:
1. Đọc thông tin đăng nhập từ file `.env` của stack
2. Thiết lập Nginx với Basic Auth sử dụng thông tin đăng nhập đó
3. Tạo các script khởi động và dừng mới

### 7. Xóa stack và giải phóng bộ nhớ

Để xóa hoàn toàn một stack và giải phóng tài nguyên:
```bash
cd docker
./remove_stack.sh <tên_stack>
```

Script này sẽ:
1. Dừng các container đang chạy của stack (bao gồm cả Nginx nếu có)
2. Xóa tất cả các container liên quan đến stack
3. Xóa tất cả các volume dữ liệu liên quan
4. Xóa thư mục stack
5. Hiển thị thông tin về tài nguyên đã được giải phóng

## Cấu trúc thư mục

```
docker/
  ├── deploy_supabase.sh      # Script triển khai chính
  ├── setup_nginx_auth.sh     # Script thêm Nginx Basic Auth vào stack hiện có
  ├── remove_stack.sh         # Script để xóa stack và giải phóng bộ nhớ
  ├── docker-compose.yml      # File cấu hình Docker Compose gốc
  ├── docker-compose.s3.yml   # File cấu hình tùy chọn cho S3
  ├── reset.sh                # Script reset gốc
  ├── test_deployment.sh      # Script kiểm tra triển khai
  ├── dev/                    # Thư mục chứa cấu hình dev
  ├── volumes/                # Thư mục chứa dữ liệu và cấu hình
  └── stacks/                 # Thư mục chứa các stack đã triển khai
      ├── stack1/             # Stack thứ nhất
      │   ├── docker-compose.yml
      │   ├── docker-compose.nginx.yml  # Nếu sử dụng Nginx
      │   ├── .env
      │   ├── start.sh
      │   ├── stop.sh
      │   ├── reset.sh
      │   ├── update_hosts.sh  # Nếu sử dụng Nginx
      │   ├── nginx/           # Nếu sử dụng Nginx
      │   │   ├── nginx.conf
      │   │   └── .htpasswd
      │   └── volumes/
      ├── stack2/             # Stack thứ hai
      │   └── ...
      └── ...
```

## Phân bổ port

Mỗi stack mới sẽ được cấp một dải port khác nhau (cách nhau 1000 port):

| Dịch vụ      | Stack 1 | Stack 2 | Stack 3 |
|--------------|---------|---------|---------|
| Kong HTTP    | 8000    | 9000    | 10000   |
| Kong HTTPS   | 8443    | 9443    | 10443   |
| Postgres     | 5432    | 6432    | 7432    |
| Studio       | 3000    | 4000    | 5000    |
| Pooler       | 6543    | 7543    | 8543    |
| Analytics    | 4000    | 5000    | 6000    |

## Giải pháp xác thực cho Dashboard Studio

Hệ thống hỗ trợ hai phương thức xác thực cho Supabase Studio Dashboard:

### 1. Nginx Basic Auth (Khuyến nghị)

- **Ưu điểm**:
  - Đáng tin cậy hơn, không gặp vấn đề xác thực không hoạt động
  - Sử dụng domain riêng để dễ dàng nhận biết (studio.stack-name.local)
  - Có thể mở rộng thêm các tính năng bảo mật (HTTPS, rate limiting, v.v.)

- **Cách sử dụng**:
  - Mặc định khi triển khai stack mới (USE_NGINX_AUTH=true)
  - Có thể thêm vào stack hiện có với script `setup_nginx_auth.sh`
  
- **Cấu hình**: Tất cả thông tin xác thực được đồng bộ giữa file `.env` và file `.htpasswd`

### 2. Kong Basic Auth (Cũ)

- **Cách sử dụng**: 
  ```bash
  USE_NGINX_AUTH=false ./deploy_supabase.sh <tên_stack>
  ```

## Lưu ý quan trọng

- Tất cả mật khẩu và khóa bảo mật được tự động tạo và lưu trong tệp `.env` trong thư mục stack
- Chọn phương thức xác thực Nginx (mặc định) hoặc Kong thông qua biến môi trường `USE_NGINX_AUTH`
- Các thông tin đăng nhập (username/password) được đồng bộ giữa các cấu hình
- Mỗi stack có dữ liệu riêng biệt và không chia sẻ với nhau
- Sao lưu thông tin đăng nhập từ màn hình kết quả triển khai
- Các stack có thể chạy đồng thời mà không gây xung đột
- Khi không cần một stack nữa, hãy sử dụng `remove_stack.sh` để giải phóng tài nguyên hệ thống

## Xử lý sự cố

### Vấn đề xác thực không hoạt động

Nếu bạn gặp vấn đề xác thực không hoạt động với Kong:

1. Chuyển sang sử dụng Nginx Basic Auth:
   ```bash
   cd docker
   ./setup_nginx_auth.sh <tên_stack>
   ```

2. Khởi động stack với Nginx:
   ```bash
   cd docker/stacks/<tên_stack>
   ./start_with_nginx.sh
   ```

### Không thể truy cập domain .local

Nếu không thể truy cập studio.<tên_stack>.local:

1. Đảm bảo đã thêm vào file hosts:
   ```bash
   sudo ./update_hosts.sh
   ```

2. Xóa cache DNS của trình duyệt hoặc sử dụng chế độ ẩn danh
