<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.com) là một giải pháp mã nguồn mở thay thế cho Firebase. Chúng tôi sử dụng công cụ mã nguồn mở cấp doanh nghiệp để xây dựng các chức năng mà Firebase có.

- [x] Cơ sở dữ liệu Postgres tự chủ
- [x] Cập nhật dữ liệu thời gian thực
- [x] Xác thực và phân quyền
- [x] Tự động tạo API
- [x] Bảng điều khiển
- [x] Kho lưu trữ
- [ ] Functions (sắp có)

## Tài liệu

Để có tài liệu đầy đủ, hãy truy cập [supabase.io/docs](https://supabase.com/docs)

## Hỗ trợ & Cộng đồng

- [Diễn đàn cộng đồng](https://github.com/supabase/supabase/discussions). Tốt nhất cho: hỗ trợ xây dựng và thảo luận về các phương pháp hay nhất về cơ sở dữ liệu.
- [Vấn đề trên GitHub](https://github.com/supabase/supabase/issues). Tốt nhất cho: các lỗi và "bugs" mà bạn gặp phải khi sử dụng Supabase.
- [Hỗ trợ email](https://supabase.com/docs/support#business-support). Tốt nhất cho: các vấn đề với cơ sở dữ liệu hoặc cơ sở hạ tầng của bạn.
- [Discord](https://discord.supabase.com). Tốt nhất cho: chia sẻ ứng dụng của bạn hoặc dành thời gian với cộng đồng.

## Trạng thái

- [x] Alpha: Chúng tôi đang thử nghiệm Supabase với một nhóm người dùng kín
- [x] Public Alpha: Bất kỳ ai cũng có thể đăng ký tại [app.supabase.io](https://app.supabase.io). Nhưng hãy bình tĩnh với chúng tôi, sẽ có một vài lỗi nhỏ.
- [x] Public Beta: Đủ ổn định cho hầu hết các trường hợp sử dụng không phải trong môi trường doanh nghiệp (production)
- [ ] Public: Sẵn sàng cho môi trường doanh nghiệp (production)

Chúng tôi hiện đang ở giai đoạn Public Beta. Xem mục "releases" của repo này để nhận thông báo về các bản cập nhật lớn.

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Xem repo này"/></kbd>

---

## Cách Supabase hoạt động

Supabase là sự kết hợp của các công cụ mã nguồn mở. Các tính năng của Supabase được xây dựng dựa trên các sản phẩm đạt chuẩn doanh nghiệp và mã nguồn mở. Nếu các công cụ và cộng đồng hỗ trợ công cụ đó tồn tại, cùng với giấy phép MIT, Apache 2 hoặc giấy phép mở tương đương, chúng tôi sẽ sử dụng và hỗ trợ công cụ đó. Nếu công cụ không tồn tại, chúng tôi sẽ tự xây dựng và mở mã nguồn của nó. Supabase không phải là phiên bản 1 : 1 của Firebase. Mục đích của chúng tôi là cung cấp cho các nhà phát triển trải nghiệm tuyệt vời giống như sử dụng Firebase bằng cách sử dụng các công cụ nguồn mở.

**Kiến trúc hiện tại**

Supabase là một [nền tảng lưu trữ cơ sở dữ liệu] (https://app.supabase.io). Bạn có thể đăng ký và bắt đầu sử dụng Supabase mà không cần cài đặt bất kỳ thứ gì. Chúng tôi vẫn đang phát triển tính năng chạy Supabase trong môi trường ảo hoá trên chính máy tính cá nhân của bạn - đây hiện là trọng tâm cốt lõi của chúng tôi, cùng với sự ổn định của nền tảng.

![Kiến trúc](https://supabase.com/docs/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL] (https://www.postgresql.org/) là một hệ thống cơ sở dữ liệu quan hệ đối tượng với hơn 30 năm phát triển tích cực đã mang lại cho nó một danh tiếng mạnh mẽ về độ tin cậy, tính năng mạnh mẽ và hiệu suất.
- [Realtime] (https://github.com/supabase/realtime) là một máy chủ Elixir cho phép bạn lắng nghe các lệnh chèn, cập nhật và xóa PostgreSQL bằng cách sử dụng websockets. Supabase lắng nghe chức năng sao chép có sẵn của Postgres, chuyển đổi luồng byte sao chép thành JSON, sau đó phát JSON qua các cổng web.
- [PostgREST] (http://postgrest.org/) là một máy chủ web biến cơ sở dữ liệu PostgreSQL của bạn trực tiếp thành một REST API
- [Storage] (https://github.com/supabase/storage-api) cung cấp giao diện RESTful để quản lý các tệp được lưu trữ trong S3, sử dụng Postgres để quản lý quyền.
- [postgres-meta] (https://github.com/supabase/postgres-meta) là một API RESTful để quản lý Postgres của bạn, cho phép bạn tìm nạp bảng, thêm vai trò và chạy truy vấn, v.v.
- [GoTrue] (https://github.com/netlify/gotrue) là một API dựa trên SWT để quản lý người dùng và phát hành mã thông báo SWT.
- [Kong] (https://github.com/Kong/kong) là một cổng API gốc đám mây.

#### Thư viện hỗ trợ

Các thư viện hỗ trợ của chúng tôi là các mô-đun. Mỗi thư viện con là một triển khai độc lập cho một hệ thống bên ngoài. Đây là một trong những cách mà chúng tôi hỗ trợ các công cụ hiện có.

- **`supabase-{lang}`**: Kết hợp các thư viện và thêm một số tính năng.
  - `postgrest-{lang}`: Thư viện hỗ trợ để làm việc với [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: Thư viện hỗ trợ để làm việc với [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: Thư viện hỗ trợ để làm việc với [GoTrue](https://github.com/netlify/gotrue)

| Kho lưu trữ           | Chính thức                                       | Cộng đồng                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb) \| `Go`                                                                                             |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) \| [`Go`](https://github.com/supabase/postgrest-go) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                        |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                              |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## Các bản dịch

- [Danh sách các bản dịch](/i18n/languages.md) <!--- Keep only this -->

---

## Các nhà tài trợ

[![Nhà tài trợ mới](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
