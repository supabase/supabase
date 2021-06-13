<p align="center">
<img width="300" src="https://raw.githubusercontent.com/supabase/supabase/master/web/static/supabase-light-rounded-corner-background.svg"/>
</p>

---

# Supabase

[Supabase](https://supabase.io) คือโปรเจกต์โอเพนซอร์สทางเลือกของ Firebase. เราพัฒนาฟีเจอร์ที่เทียบเท่ากับ Firebase ด้วยเครื่องมือโอเพนซอร์สระดับองค์กร

- [x] โฮสต์ฐานข้อมูล Postgres (Postgres Database)
- [x] การสมัครสมาชิกแบบ Realtime
- [x] การยืนยันตัวตนและการควบคุมการเข้าถึง
- [x] การสร้าง API แบบอัตโนมัติ
- [x] หน้าสรุปข้อมูลแดชบอร์ด (Dashboard)
- [x] ที่เก็บข้อมูล (Storage)
- [ ] ฟังก์ชัน (กำลังจะมาในอนาคต)

## Documentation

เข้าไปที่ [supabase.io/docs](https://supabase.io/docs) สำหรับเอกสารข้อมูล (Documentation) ฉบับเต็ม

## Community & Support

- [Community Forum](https://github.com/supabase/supabase/discussions). สำหรับ: ความช่วยเหลือในการใช้งาน Supabase หรือการพูดคุยแลกเปลี่ยนข้อมูลเกี่ยวกับ Databases Best Practices
- [GitHub Issues](https://github.com/supabase/supabase/issues). สำหรับ: Bugs และ Erros ที่พบในการใช้งาน Supabase
- [Email Support](https://supabase.io/docs/support#business-support). สำหรับ: ปัญหาที่พบสำหรับ Database หรือ Infrastructure ของคุณ

## Status

- [x] Alpha: เรากำลังทดสอบ Supabase ในวงผู้ใช้ที่จำกัด
- [x] Public Alpha: ทุกคนสามารถลงชื่อเข้าใช้ได้ที่ [app.supabase.io](https://app.supabase.io) แต่อย่าพึ่งไว้ใจมากนะ ระบบยังไม่สมบูรณ์
- [x] Public Beta: เสถียรมากพอสำหรับการใช้งานแบบทั่วไป (ไม่ใช่องค์กร)
- [ ] Public: พร้อมสำหรับการใช้งาน

ขณะนี้เรากำลังอยู่ในช่วง Public Beta คุณสามารถกด Watch releases เพื่อรับการแจ้งเตือนเกี่ยวกับอัพเดตครั้งสำคัญ (Major updates)

<kbd><img src="https://gitcdn.link/repo/supabase/supabase/master/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Supabase ทำงานอย่างไร

Supabase สร้างขึ้นมาจากการรวมกันของเครื่องมือโอเพนซอร์ส เราพัฒนาฟีเจอร์ที่เทียบเท่ากับ Firebase ด้วยเครื่องมือโอเพนซอร์สระดับองค์กร ถ้ามีเครื่องมือที่มีกลุ่มผู้ใช้และลิขสิทธิ์แบบ MIT, Apache 2 หรือลิขสิทธิ์ที่เทียบเท่ากัน เราจะใช้มันและร่วมพัฒนาเครื่องมือนั้น ถ้าเราต้องการเครื่องมือเพื่อมาพัฒนาผลิตภัณฑ์ แต่ยังไม่มีเครื่องมือนั้น เราจะสร้างมันและเปิดเป็นโครงการโอเพนซอร์สด้วยตัวของเราเอง Supabase ไม่ใช่ตัวแทนของ Firebase อย่างสมบูรณ์ แต่เป้าหมายของเราคือการมอบเครื่องมือที่เทียบเท่ากับ Firebase ให้กับผู้พัฒนา โดยใช้เครื่องมือโอเพนซอร์ส

**สถาปัตยกรรม**

Supabase เป็น [hosted platform](https://app.supabase.io). คุณสามารถลงทะเบียนและเริ่มใช้งาน Supabase ได้เลยโดยไม่ต้องติดตั้งอะไรเพิ่มเติม นอกเหนือไปจากนั้นเรากำลังพัฒนาระบบเพื่อการพัฒนาเว็บบน local (local development experience) ที่เป็นจุดมุ่งหมายของเราในตอนนี้ รวมถึงความมั่นคงของระบบ

![สถาปัตยกรรม](https://supabase.io/assets/images/supabase-architecture-9050a7317e9ec7efb7807f5194122e48.png)

- [PostgreSQL](https://www.postgresql.org/) เป็นระบบฐานข้อมูลแบบ object-relational ที่ถูกพัฒนาอย่างต่อเนื่องมากว่า 30 ปี และเป็นที่ยอมรับในเรื่องของเสถียรภาพ ความมั่นคง และประสิทธิภาพ
- [Realtime](https://github.com/supabase/realtime) เป็นเซิร์ฟเวอร์ที่พัฒนาขึ้นด้วย Elixir ที่ทำหน้าที่ตรวจจับเมื่อมีการเปลี่ยนแปลงของข้อมูล (inserts, updates, and deletes operation) ใน Postgres ด้วย websockets. Supabase คอยตรวจจับเมื่อ Postgres มีการทำซ้ำ (replication) ทำการแปลงข้อมูลเป็น JSON และกระจายข้อมูลผ่าน websockets
- [PostgREST](http://postgrest.org/) เป็น web server ที่ทำหน้าที่ในการแปลงฐานข้อมูล Postgres ให้กลายเป็น RESTful API โดยตรง
- [Storage](https://github.com/supabase/storage-api) ทำหน้าที่ในการเป็น RESTful interface สำหรับการจัดการไฟล์ที่ถูกเก็บใน S3 และใช้ Postgres ในการจัดการ permissions
- [postgres-meta](https://github.com/supabase/postgres-meta) เป็น RESTful API สำหรับจัดการ Postgres ของคุณ ทำให้คุณสามารถเรียกดูตาราง (Database tables), เพิ่ม Roles และเรียกดูข้อมูล (run queries) ได้
- [GoTrue](https://github.com/netlify/gotrue) เป็น API ที่สร้างขึ้นจาก SWT สำหรับการจัดการผู้ใช้ และสร้าง SWT tokens
- [Kong](https://github.com/Kong/kong) เป็น cloud-native API gateway

#### ไคลเอนต์ไลบรารี่

ไคลเอนต์ไลบรารี่ของเราเป็นแบบ modular นั่นแปลว่าไลบรารี่ย่อยทุกตัวสามารถใช้ได้ในตัวของมันเอง นี่เป็นหนึ่งทางที่เราจะสนับสนุนเครื่องมือที่มีอยู่

- **`supabase-{lang}`**: รวบรวมไลบรารี่ต่าง ๆ เข้าด้วยกัน
  - `postgrest-{lang}`: ไคลเอนต์ไลบรารี่ในการทำงานกับ [PostgREST](https://github.com/postgrest/postgrest)
  - `realtime-{lang}`: ไคลเอนต์ไลบรารี่ในการทำงานกับ [Realtime](https://github.com/supabase/realtime)
  - `gotrue-{lang}`: ไคลเอนต์ไลบรารี่ในการทำงานกับ [GoTrue](https://github.com/netlify/gotrue)

| Repo                  | Official                                         | Community                                                                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`supabase-{lang}`** | [`JS`](https://github.com/supabase/supabase-js)  | [`C#`](https://github.com/supabase/supabase-csharp) \| [`Dart`](https://github.com/supabase/supabase-dart) \| [`Python`](https://github.com/supabase/supabase-py) \| `Rust` \| [`Ruby`](https://github.com/supabase/supabase-rb) \| `Go`                                                                                             |
| `postgrest-{lang}`    | [`JS`](https://github.com/supabase/postgrest-js) | [`C#`](https://github.com/supabase/postgrest-csharp) \| [`Dart`](https://github.com/supabase/postgrest-dart) \| [`Python`](https://github.com/supabase/postgrest-py) \| [`Rust`](https://github.com/supabase/postgrest-rs) \| [`Ruby`](https://github.com/supabase/postgrest-rb) \| [`Go`](https://github.com/supabase/postgrest-go) |
| `realtime-{lang}`     | [`JS`](https://github.com/supabase/realtime-js)  | [`C#`](https://github.com/supabase/realtime-csharp) \| [`Dart`](https://github.com/supabase/realtime-dart) \| [`Python`](https://github.com/supabase/realtime-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                        |
| `gotrue-{lang}`       | [`JS`](https://github.com/supabase/gotrue-js)    | [`C#`](https://github.com/supabase/gotrue-csharp) \| [`Dart`](https://github.com/supabase/gotrue-dart) \| [`Python`](https://github.com/supabase/gotrue-py) \| `Rust` \| `Ruby` \| `Go`                                                                                                                                              |

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## เอกสารแปลในภาษาต่าง ๆ

- [List of translations](/i18n/languages.md) <!--- Keep only this -->

---

## Sponsors

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
