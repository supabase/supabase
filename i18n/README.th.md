<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) เป็นโอเพนซอร์สทางเลือกของ Firebase เรากำลังสร้างฟีเจอร์ของ Firebase โดยใช้เครื่องมือโอเพนซอร์สระดับองค์กร

**คุณสมบัติหลัก:**

- [x] **ฐานข้อมูล Postgres ที่มีการจัดการ:** [เอกสารประกอบ](https://supabase.com/docs/guides/database)
- [x] **การรับรองความถูกต้องและการอนุญาต:** [เอกสารประกอบ](https://supabase.com/docs/guides/auth)
- [x] **API ที่สร้างขึ้นโดยอัตโนมัติ:**
    - [x] REST: [เอกสารประกอบ](https://supabase.com/docs/guides/api)
    - [x] GraphQL: [เอกสารประกอบ](https://supabase.com/docs/guides/graphql)
    - [x] การสมัครสมาชิกแบบเรียลไทม์: [เอกสารประกอบ](https://supabase.com/docs/guides/realtime)
- [x] **ฟังก์ชัน:**
    - [x] ฟังก์ชันฐานข้อมูล: [เอกสารประกอบ](https://supabase.com/docs/guides/database/functions)
    - [x] Edge Functions (ฟังก์ชันบนขอบเครือข่าย): [เอกสารประกอบ](https://supabase.com/docs/guides/functions)
- [x] **ที่เก็บไฟล์:** [เอกสารประกอบ](https://supabase.com/docs/guides/storage)
- [x] **เครื่องมือสำหรับการทำงานกับ AI, เวกเตอร์ และ embeddings:** [เอกสารประกอบ](https://supabase.com/docs/guides/ai)
- [x] **แดชบอร์ด**

![แดชบอร์ด Supabase](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

สมัครรับ "releases" ของ repositorie นี้เพื่อรับการแจ้งเตือนเกี่ยวกับการอัปเดตที่สำคัญ สิ่งนี้จะช่วยให้คุณทราบถึงการเปลี่ยนแปลงและการปรับปรุงล่าสุด

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="ติดตาม repositorie"/></kbd>

## เอกสารประกอบ

เอกสารประกอบฉบับเต็มมีอยู่ที่ [supabase.com/docs](https://supabase.com/docs) คุณจะพบคำแนะนำและเอกสารอ้างอิงที่จำเป็นทั้งหมดได้ที่นั่น

หากคุณต้องการมีส่วนร่วมในการพัฒนาโครงการ โปรดดูส่วน [เริ่มต้นใช้งาน](./../DEVELOPERS.md)

## ชุมชนและการสนับสนุน

*   **ฟอรัมชุมชน:** [https://github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions) เหมาะอย่างยิ่งสำหรับการขอความช่วยเหลือในการพัฒนาและหารือเกี่ยวกับแนวทางปฏิบัติที่ดีที่สุดในการทำงานกับฐานข้อมูล
*   **GitHub Issues:** [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues) ใช้สำหรับรายงานข้อบกพร่องและข้อผิดพลาดที่คุณพบขณะใช้ Supabase
*   **การสนับสนุนทางอีเมล:** [https://supabase.com/docs/support#business-support](https://supabase.com/docs/support#business-support) ตัวเลือกที่ดีที่สุดสำหรับการแก้ไขปัญหาเกี่ยวกับฐานข้อมูลหรือโครงสร้างพื้นฐานของคุณ
*   **Discord:** [https://discord.supabase.com](https://discord.supabase.com) เป็นสถานที่ที่ยอดเยี่ยมสำหรับการแบ่งปันแอปพลิเคชันของคุณและพบปะกับชุมชน

## มันทำงานอย่างไร

Supabase รวมเครื่องมือโอเพนซอร์สหลายอย่างเข้าด้วยกัน เรากำลังสร้างฟังก์ชันที่คล้ายกับ Firebase โดยใช้ผลิตภัณฑ์ระดับองค์กรที่ได้รับการพิสูจน์แล้ว หากเครื่องมือหรือชุมชนมีอยู่และมีใบอนุญาต MIT, Apache 2 หรือใบอนุญาตแบบเปิดที่คล้ายกัน เราจะใช้และสนับสนุนเครื่องมือนั้น หากไม่มีเครื่องมือดังกล่าว เราจะสร้างขึ้นเองและเปิดซอร์สโค้ด Supabase ไม่ใช่สำเนาที่แน่นอนของ Firebase เป้าหมายของเราคือการมอบความสะดวกสบายให้กับนักพัฒนาซอฟต์แวร์เทียบเท่ากับ Firebase แต่ใช้เครื่องมือโอเพนซอร์ส

**สถาปัตยกรรม**

Supabase เป็น [แพลตฟอร์มที่โฮสต์](https://supabase.com/dashboard) คุณสามารถลงทะเบียนและเริ่มใช้ Supabase ได้ทันทีโดยไม่ต้องติดตั้งอะไรเลย คุณยังสามารถ [ปรับใช้โครงสร้างพื้นฐานของคุณเอง](https://supabase.com/docs/guides/hosting/overview) และ [พัฒนาในเครื่อง](https://supabase.com/docs/guides/local-development)

![สถาปัตยกรรม](./../apps/docs/public/img/supabase-architecture.svg)

*   **PostgreSQL:** ระบบฐานข้อมูลเชิงวัตถุ-สัมพันธ์ที่มีประวัติการพัฒนามากกว่า 30 ปี เป็นที่รู้จักในด้านความน่าเชื่อถือ ฟังก์ชันการทำงาน และประสิทธิภาพ
*   **Realtime:** เซิร์ฟเวอร์บน Elixir ที่ให้คุณฟังการเปลี่ยนแปลงใน PostgreSQL (การแทรก การอัปเดต และการลบ) ผ่านเว็บซ็อกเก็ต Realtime ใช้ฟังก์ชันการจำลองแบบในตัวของ Postgres แปลงการเปลี่ยนแปลงเป็น JSON และส่งไปยังไคลเอนต์ที่ได้รับอนุญาต
*   **PostgREST:** เว็บเซิร์ฟเวอร์ที่เปลี่ยนฐานข้อมูล PostgreSQL ของคุณให้เป็น RESTful API
*   **GoTrue:** API ที่ใช้ JWT สำหรับการจัดการผู้ใช้และการออกโทเค็น JWT
*   **Storage:** มีอินเทอร์เฟซ RESTful สำหรับการจัดการไฟล์ที่เก็บไว้ใน S3 โดยใช้ Postgres เพื่อจัดการสิทธิ์
*   **pg_graphql:** ส่วนขยาย PostgreSQL ที่มี GraphQL API
*   **postgres-meta:** RESTful API สำหรับจัดการ Postgres ของคุณ ช่วยให้คุณสามารถรับตาราง เพิ่มบทบาท เรียกใช้แบบสอบถาม ฯลฯ
*   **Kong:** เกตเวย์ API บนคลาวด์

#### ไลบรารีไคลเอ็นต์

เราใช้แนวทางแบบแยกส่วนกับไลบรารีไคลเอ็นต์ แต่ละไลบรารีย่อยได้รับการออกแบบมาเพื่อทำงานกับระบบภายนอกเดียว นี่เป็นหนึ่งในวิธีที่เราสนับสนุนเครื่องมือที่มีอยู่

(ตารางพร้อมไลบรารีไคลเอ็นต์ เหมือนกับในต้นฉบับ แต่มีชื่อภาษาไทยและคำอธิบายตามความจำเป็น)

| ภาษา                       | ไคลเอ็นต์ Supabase                                                     | [PostgREST](https://www.postgresql.org/)                                                                         | [GoTrue](https://github.com/supabase/gotrue)                                                                                | [Realtime](https://github.com/supabase/realtime)                                                                              | [Storage](https://github.com/supabase/storage-api)                                                                                 | Functions                                                                               |
| :-------------------------- | :------------------------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------- |
| **⚡️ทางการ⚡️**      |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| JavaScript (TypeScript)     | [supabase-js](https://github.com/supabase/supabase-js)               | [postgrest-js](https://github.com/supabase/postgrest-js)                             | [gotrue-js](https://github.com/supabase/gotrue-js)                                     | [realtime-js](https://github.com/supabase/realtime-js)                                 | [storage-js](https://github.com/supabase/storage-js)                                   | [functions-js](https://github.com/supabase/functions-js)                             |
| Flutter                     | [supabase-flutter](https://github.com/supabase/supabase-flutter)     | [postgrest-dart](https://github.com/supabase/postgrest-dart)                         | [gotrue-dart](https://github.com/supabase/gotrue-dart)                                 | [realtime-dart](https://github.com/supabase/realtime-dart)                             | [storage-dart](https://github.com/supabase/storage-dart)                               | [functions-dart](https://github.com/supabase/functions-dart)                         |
| Swift                      | [supabase-swift](https://github.com/supabase/supabase-swift)          | [postgrest-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/PostgREST) | [auth-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Auth)     | [realtime-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Realtime) | [storage-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Storage) | [functions-swift](https://github.com/supabase/supabase-swift/tree/main/Sources/Functions) |
| Python                      | [supabase-py](https://github.com/supabase/supabase-py)               | [postgrest-py](https://github.com/supabase/postgrest-py)                             | [gotrue-py](https://github.com/supabase/gotrue-py)                                     | [realtime-py](https://github.com/supabase/realtime-py)                                 | [storage-py](https://github.com/supabase/storage-py)                                   | [functions-py](https://github.com/supabase/functions-py)                             |
| **💚สนับสนุนโดยชุมชน💚** |                                                                     |                                                                                   |                                                                                      |                                                                                     |                                                                                        |                                                                                      |
| C#                          | [supabase-csharp](https://github.com/supabase-community/supabase-csharp) | [postgrest-csharp](https://github.com/supabase-community/postgrest-csharp)           | [gotrue-csharp](https://github.com/supabase-community/gotrue-csharp)                 | [realtime-csharp](https://github.com/supabase-community/realtime-csharp)             | [storage-csharp](https://github.com/supabase-community/storage-csharp)                 | [functions-csharp](https://github.com/supabase-community/functions-csharp)           |
| Go                          | -                                                                   | [postgrest-go](https://github.com/supabase-community/postgrest-go)                     | [gotrue-go](https://github.com/supabase-community/gotrue-go)                           | -                                                                                   | [storage-go](https://github.com/supabase-community/storage-go)                       | [functions-go](https://github.com/supabase-community/functions-go)                   |
| Java                        | -                                                                   | -                                                                                   | [gotrue-java](https://github.com/supabase-community/gotrue-java)                       | -                                                                                   | [storage-java](https://github.com/supabase-community/storage-java)                   | -                                                                                   |
| Kotlin                      | [supabase-kt](https://github.com/supabase-community/supabase-kt)       | [postgrest-kt](https://github.com/supabase-community/supabase-kt/tree/master/Postgrest) | [auth-kt](https://github.com/supabase-community/supabase-kt/tree/master/Auth)         | [realtime-kt](https://github.com/supabase-community/supabase-kt/tree/master/Realtime)   | [storage-kt](https://github.com/supabase-community/supabase-kt/tree/master/Storage)   | [functions-kt](https://github.com/supabase-community/supabase-kt/tree/master/Functions) |
| Ruby                      | [supabase-rb](https://github.com/supabase-community/supabase-rb)      |      [postgrest-rb](https://github.com/supabase-community/postgrest-rb)                                                                             |    -                                                                                  |        -                                                                            |     -                                                                                 |          -                                                                          |
| Rust                      |      -                                                                 |       [postgrest-rs](https://github.com/supabase-community/postgrest-rs)                                                                            |      -                                                                                 |       -                                                                             |       -                                                                                |         -                                                                           |
| Godot Engine (GDScript)      |   [supabase-gdscript](https://github.com/supabase-community/godot-engine.supabase)                                                                  |        [postgrest-gdscript](https://github.com/supabase-community/postgrest-gdscript)                                                                            |        [gotrue-gdscript](https://github.com/supabase-community/gotrue-gdscript)                                                                                |    [realtime-gdscript](https://github.com/supabase-community/realtime-gdscript)                                                                                  |         [storage-gdscript](https://github.com/supabase-community/storage-gdscript)                                                                                 |  [functions-gdscript](https://github.com/supabase-community/functions-gdscript)                                                                                       |

## ป้าย (Badges)

คุณสามารถใช้ป้ายเหล่านี้เพื่อแสดงว่าแอปพลิเคชันของคุณสร้างด้วย Supabase:

**สว่าง:**

![สร้างด้วย Supabase](./../apps/www/public/badge-made-with-supabase.svg)

```md
[![สร้างด้วย Supabase](https://supabase.com/badge-made-with-supabase.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase.svg" alt="สร้างด้วย Supabase" />
</a>
```

**มืด:**

![สร้างด้วย Supabase (เวอร์ชันมืด)](./../apps/www/public/badge-made-with-supabase-dark.svg)

```md
[![สร้างด้วย Supabase](https://supabase.com/badge-made-with-supabase-dark.svg)](https://supabase.com)
```

```html
<a href="https://supabase.com">
  <img width="168" height="30" src="https://supabase.com/badge-made-with-supabase-dark.svg" alt="สร้างด้วย Supabase" />
</a>
```

## การแปล

[รายการการแปล](./languages.md)
