# Supabase Docker Multi-Stack Deployment

Đây là hướng dẫn triển khai nhiều stack Supabase trên cùng một máy chủ Ubuntu thông qua Docker mà không gây xung đột với nhau.

## Giải pháp triển khai nhiều stack Supabase

Script triển khai `deploy_supabase.sh` cho phép bạn:
- Tạo nhiều stack Supabase trên cùng một máy chủ
- Tự động tạo các mật khẩu, token và khóa bảo mật
- Gán các port khác nhau cho mỗi stack để tránh xung đột
- Tạo các tên container khác nhau để dễ quản lý

## Yêu cầu hệ thống

- Ubuntu (hoặc bất kỳ hệ điều hành Linux nào hỗ trợ Bash)
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
```

Script sẽ:
1. Tạo thư mục `stacks/<tên_stack>` với tất cả các tệp cấu hình cần thiết
2. Tạo các mật khẩu và token ngẫu nhiên an toàn
3. Tự động tính toán và gán các port không xung đột
4. Điều chỉnh cấu hình để stack chạy độc lập
5. Tạo các script tiện ích (start.sh, stop.sh, reset.sh)

### 2. Khởi động stack

```bash
cd docker/stacks/<tên_stack>
./start.sh
```

### 3. Truy cập stack

Sau khi khởi động thành công, bạn có thể truy cập:

- **Studio UI**: http://localhost:<studio_port> (hiển thị sau khi triển khai)
- **API Endpoint**: http://localhost:<kong_http_port> (hiển thị sau khi triển khai)
- **Database**: localhost:<postgres_port> (hiển thị sau khi triển khai)

### 4. Dừng và reset stack

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

### 5. Xóa stack và giải phóng bộ nhớ

Để xóa hoàn toàn một stack và giải phóng tài nguyên:
```bash
cd docker
./remove_stack.sh <tên_stack>
```

Script này sẽ:
1. Dừng các container đang chạy của stack
2. Xóa tất cả các container liên quan đến stack
3. Xóa tất cả các volume dữ liệu liên quan
4. Xóa thư mục stack
5. Hiển thị thông tin về tài nguyên đã được giải phóng

## Cấu trúc thư mục

```
docker/
  ├── deploy_supabase.sh      # Script triển khai chính
  ├── remove_stack.sh         # Script để xóa stack và giải phóng bộ nhớ
  ├── docker-compose.yml      # File cấu hình Docker Compose gốc
  ├── docker-compose.s3.yml   # File cấu hình tùy chọn cho S3
  ├── reset.sh                # Script reset gốc
  ├── dev/                    # Thư mục chứa cấu hình dev
  ├── volumes/                # Thư mục chứa dữ liệu và cấu hình
  └── stacks/                 # Thư mục chứa các stack đã triển khai
      ├── stack1/             # Stack thứ nhất
      │   ├── docker-compose.yml
      │   ├── .env
      │   ├── start.sh
      │   ├── stop.sh
      │   ├── reset.sh
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

## Lưu ý quan trọng

- Tất cả mật khẩu và khóa bảo mật được tự động tạo và lưu trong tệp `.env` trong thư mục stack
- Mỗi stack có dữ liệu riêng biệt và không chia sẻ với nhau
- Sao lưu thông tin đăng nhập từ màn hình kết quả triển khai
- Các stack có thể chạy đồng thời mà không gây xung đột
- Khi không cần một stack nữa, hãy sử dụng `remove_stack.sh` để giải phóng tài nguyên hệ thống
