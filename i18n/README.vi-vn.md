<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) là một giải pháp thay thế nguồn mở cho Firebase. Chúng tôi đang xây dựng các tính năng của Firebase bằng cách sử dụng các công cụ nguồn mở cấp doanh nghiệp.

**Các tính năng chính:**

- [x] **Cơ sở dữ liệu Postgres được quản lý:** [Tài liệu](https://supabase.com/docs/guides/database)
- [x] **Xác thực và ủy quyền:** [Tài liệu](https://supabase.com/docs/guides/auth)
- [x] **API được tạo tự động:**
    - [x] REST: [Tài liệu](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [Tài liệu](https://supabase.com/docs/guides/graphql)
    - [x] Đăng ký thời gian thực: [Tài liệu](https://supabase.com/docs/guides/realtime)
- [x] **Chức năng:**
    - [x] Chức năng cơ sở dữ liệu: [Tài liệu](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (chức năng ở biên mạng): [Tài liệu](https://supabase.com/docs/guides/functions)
- [x] **Lưu trữ tệp:** [Tài liệu](https://supabase.com/docs/guides/storage)
- [x] **Công cụ để làm việc với AI, vector và embedding:** [Tài liệu](https://supabase.com/docs/guides/ai)
- [x] **Bảng điều khiển**

![Bảng điều khiển Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

Đăng ký "releases" của kho lưu trữ này để nhận thông báo về các bản cập nhật quan trọng. Điều này sẽ cho phép bạn cập nhật những thay đổi và cải tiến mới nhất.

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Theo dõi kho lưu trữ"/></kbd>

## Tài liệu

Tài liệu đầy đủ có tại [supabase.com/docs](https://supabase.com/docs). Bạn sẽ tìm thấy tất cả các hướng dẫn và tài liệu tham khảo cần thiết ở đó.

Nếu bạn muốn đóng góp vào sự phát triển của dự án, hãy xem phần [Bắt đầu](./../DEVELOPERS.md).

## Cộng đồng và Hỗ trợ

*   **Diễn đàn Cộng đồng:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions). Lý tưởng để nhận trợ giúp về phát triển và thảo luận về các phương pháp hay nhất khi làm việc với cơ sở dữ liệu.
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues). Sử dụng để báo cáo lỗi và các vấn đề bạn gặp phải khi sử dụng Supabase.
*   **Hỗ trợ qua email:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support). Tùy chọn tốt nhất để giải quyết các vấn đề với cơ sở dữ liệu hoặc cơ sở hạ tầng của bạn.
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com). Một nơi tuyệt vời để chia sẻ các ứng dụng của bạn và giao lưu với cộng đồng.

## Cách thức hoạt động

Supabase kết hợp một số công cụ nguồn mở. Chúng tôi đang xây dựng các tính năng tương tự như Firebase bằng cách sử dụng các sản phẩm cấp doanh nghiệp đã được kiểm chứng. Nếu công cụ hoặc cộng đồng tồn tại và có giấy phép MIT, Apache 2 hoặc giấy phép mở tương tự, chúng tôi sẽ sử dụng và hỗ trợ công cụ đó. Nếu không có công cụ như vậy, chúng tôi sẽ tự xây dựng và mở mã nguồn. Supabase không phải là bản sao chính xác của Firebase. Mục tiêu của chúng tôi là cung cấp cho các nhà phát triển sự tiện lợi tương đương với Firebase nhưng sử dụng các công cụ nguồn mở.

**Kiến trúc**

Supabase là một [nền tảng được quản lý](https://supabase.com/dashboard). Bạn có thể đăng ký và bắt đầu sử dụng Supabase ngay lập tức mà không cần cài đặt bất cứ thứ gì. Bạn cũng có thể [triển khai cơ sở hạ tầng của riêng mình](https://supabase.com/docs/guides/hosting/overview) và [phát triển cục bộ](https://supabase.com/docs/guides/local-development).

![Kiến trúc](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** Một hệ thống cơ sở dữ liệu quan hệ đối tượng với hơn 30 năm lịch sử phát triển tích cực. Nó được biết đến với độ tin cậy, chức năng và hiệu suất.
*   **Realtime:** Một máy chủ trên Elixir cho phép bạn lắng nghe các thay đổi trong PostgreSQL (chèn, cập nhật và xóa) thông qua các ổ cắm web. Realtime sử dụng chức năng sao chép tích hợp của Postgres, chuyển đổi các thay đổi thành JSON và chuyển chúng đến các máy khách được ủy quyền.
*   **PostgREST:** Một máy chủ web biến cơ sở dữ liệu PostgreSQL của bạn thành một API RESTful.
*   **GoTrue:** Một API dựa trên JWT để quản lý người dùng và phát hành mã thông báo JWT.
*   **Storage:** Cung cấp giao diện RESTful để quản lý các tệp được lưu trữ trong S3, sử dụng Postgres để quản lý quyền.
*   **pg_graphql:** Một phần mở rộng PostgreSQL cung cấp API GraphQL.
*   **postgres-meta:** Một API RESTful để quản lý Postgres của bạn, cho phép bạn lấy bảng, thêm vai trò, thực hiện truy vấn, v.v.
*   **Kong:** Một cổng API đám mây.

#### Thư viện máy khách

Chúng tôi sử dụng một phương pháp tiếp cận mô-đun cho các thư viện máy khách. Mỗi thư viện con được thiết kế để hoạt động với một hệ thống bên ngoài duy nhất. Đây là một trong những cách chúng tôi hỗ trợ các công cụ hiện có.

(Bảng với các thư viện máy khách, giống như trong bản gốc, nhưng với tên tiếng Việt và giải thích, khi cần thiết).

| Ngôn ngữ                       | Máy khách Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️Chính thức⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚Được hỗ trợ bởi cộng đồng💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## Huy hiệu (Badges)

Bạn có thể sử dụng các huy hiệu này để hiển thị rằng ứng dụng của bạn được tạo bằng Supabase:

**Sáng:**

![Được tạo bằng Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![Được tạo bằng Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="Được tạo bằng Supabase" />
</a>
```

**Tối:**

![Được tạo bằng Supabase (phiên bản tối)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![Được tạo bằng Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="Được tạo bằng Supabase" />
</a>
```

## Bản dịch

[Danh sách bản dịch](./languages.md)

