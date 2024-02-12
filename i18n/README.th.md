<p align="center">
<img src="https://user-images.githubusercontent.com/8291514/213727234-cda046d6-28c6-491a-b284-b86c5cede25d.png#gh-light-mode-only">
<img src="https://user-images.githubusercontent.com/8291514/213727225-56186826-bee8-43b5-9b15-86e839d89393.png#gh-dark-mode-only">
</p>

---

# Supabase

[Supabase](https://supabase.com) คือโปรเจกต์โอเพนซอร์สทางเลือกของ Firebase. เราพัฒนาฟีเจอร์ที่เทียบเท่ากับ Firebase ด้วยเครื่องมือโอเพนซอร์สระดับองค์กร

- [x] โฮสต์ฐานข้อมูล Postgres (Postgres Database)
- [x] การสมัครสมาชิกแบบ Realtime
- [x] การยืนยันตัวตนและการควบคุมการเข้าถึง
- [x] การสร้าง API แบบอัตโนมัติ
- [x] หน้าสรุปข้อมูลแดชบอร์ด (Dashboard)
- [x] ที่เก็บข้อมูล (Storage)
- [x] ฟังก์ชัน

![Supabase Dashboard](https://raw.githubusercontent.com/supabase/supabase/master/apps/www/public/images/github/supabase-dashboard.png)

## เอกสารข้อมูล

เข้าไปที่ [supabase.com/docs](https://supabase.com/docs) สำหรับเอกสารข้อมูล (Documentation) ฉบับเต็ม

## ชุมชนและการสนับสนุน

- [ฟอรั่มชุมชน](https://github.com/supabase/supabase/discussions). สำหรับ: ความช่วยเหลือในการใช้งาน Supabase หรือการพูดคุยแลกเปลี่ยนข้อมูลเกี่ยวกับ Databases Best Practices
- [GitHub Issues](https://github.com/supabase/supabase/issues). สำหรับ: Bugs และ Erros ที่พบในการใช้งาน Supabase
- [การช่วยเหลือทางอีเมล](https://supabase.com/docs/support#business-support). สำหรับ: ปัญหาที่พบสำหรับ Database หรือ Infrastructure ของคุณ

## Status

- [x] Alpha: เรากำลังทดสอบ Supabase ในวงผู้ใช้ที่จำกัด
- [x] Public Alpha: ทุกคนสามารถลงชื่อเข้าใช้ได้ที่ [supabase.com/dashboard](https://supabase.com/dashboard) แต่อย่าพึ่งไว้ใจมากนะ ระบบยังไม่สมบูรณ์
- [x] Public Beta: เสถียรมากพอสำหรับการใช้งานแบบทั่วไป (ไม่ใช่องค์กร)
- [ ] Public: พร้อมสำหรับการใช้งาน

ขณะนี้เรากำลังอยู่ในช่วง Public Beta คุณสามารถกด Watch releases เพื่อรับการแจ้งเตือนเกี่ยวกับอัพเดตครั้งสำคัญ (Major updates)

<kbd><img src="https://raw.githubusercontent.com/supabase/supabase/d5f7f413ab356dc1a92075cb3cee4e40a957d5b1/web/static/watch-repo.gif" alt="Watch this repo"/></kbd>

---

## Supabase ทำงานอย่างไร

Supabase สร้างขึ้นมาจากการรวมกันของเครื่องมือโอเพนซอร์ส เราพัฒนาฟีเจอร์ที่เทียบเท่ากับ Firebase ด้วยเครื่องมือโอเพนซอร์สระดับองค์กร ถ้ามีเครื่องมือที่มีกลุ่มผู้ใช้และลิขสิทธิ์แบบ MIT, Apache 2 หรือลิขสิทธิ์ที่เทียบเท่ากัน เราจะใช้มันและร่วมพัฒนาเครื่องมือนั้น ถ้าเราต้องการเครื่องมือเพื่อมาพัฒนาผลิตภัณฑ์ แต่ยังไม่มีเครื่องมือนั้น เราจะสร้างมันและเปิดเป็นโครงการโอเพนซอร์สด้วยตัวของเราเอง Supabase ไม่ใช่ตัวแทนของ Firebase อย่างสมบูรณ์ แต่เป้าหมายของเราคือการมอบเครื่องมือที่เทียบเท่ากับ Firebase ให้กับผู้พัฒนา โดยใช้เครื่องมือโอเพนซอร์ส

**สถาปัตยกรรม**

Supabase เป็น [hosted platform](https://supabase.com/dashboard). คุณสามารถลงทะเบียนและเริ่มใช้งาน Supabase ได้เลยโดยไม่ต้องติดตั้งอะไรเพิ่มเติม นอกเหนือไปจากนั้นเรากำลังพัฒนาระบบเพื่อการพัฒนาเว็บบน local (local development experience) ที่เป็นจุดมุ่งหมายของเราในตอนนี้ รวมถึงความมั่นคงของระบบ

![สถาปัตยกรรม](https://github.com/supabase/supabase/blob/master/apps/docs/public/img/supabase-architecture.svg)

- [PostgreSQL](https://www.postgresql.org/) เป็นระบบฐานข้อมูลแบบ object-relational ที่ถูกพัฒนาอย่างต่อเนื่องมากว่า 30 ปี และเป็นที่ยอมรับในเรื่องของเสถียรภาพ ความมั่นคง และประสิทธิภาพ
- [Realtime](https://github.com/supabase/realtime) เป็นเซิร์ฟเวอร์ที่พัฒนาขึ้นด้วย Elixir ที่ทำหน้าที่ตรวจจับเมื่อมีการเปลี่ยนแปลงของข้อมูล (ทั้งการ insert, update และ delete) ใน Postgres ด้วย websockets. Supabase คอยตรวจจับเมื่อ Postgres มีการทำซ้ำ (replication) ทำการแปลงข้อมูลเป็น JSON และกระจายข้อมูลผ่าน websockets
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

<!--- Remove this list if you're traslating to another language, it's hard to keep updated across multiple files-->
<!--- Keep only the link to the list of translation files-->

## เอกสารแปลในภาษาต่าง ๆ

- [List of translations](/i18n/languages.md) <!--- Keep only this -->

---

## การสนับสนุน

[![สนับสนุนเราได้ที่นี่](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)
