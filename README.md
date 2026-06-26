# 🏢 RentalApp - Equipment Rental Management System

แพลตฟอร์มบริหารจัดการการเช่าสินค้า ที่ออกแบบมาเพื่อรองรับการทำรายการเช่า การจัดการสต๊อกสินค้า และการคำนวณระยะเวลาการเช่าอย่างแม่นยำ พร้อมระบบป้องกันข้อมูลผิดพลาดจากการทำรายการพร้อมกัน (Concurrency)

## 🛠️ Tech Stack
* **Frontend:** React
* **Backend:** Node.js 
* **Database:** PostgreSQL (`rent_db`)

## 🧪 QA & Testing Artifacts
โปรเจกต์นี้ไม่ได้มีแค่การพัฒนา แต่ยังผ่านกระบวนการทดสอบซอฟต์แวร์ (Software Testing) อย่างเป็นระบบ เพื่อให้มั่นใจในคุณภาพและ Data Integrity ของฐานข้อมูล

### 1. Manual Test Cases (Test Design & Execution)
มีการออกแบบ Test Case เพื่อครอบคลุมการทำงานหลัก (Happy Path), การตรวจสอบความถูกต้องของข้อมูล (Negative/Validation), และกรณีการใช้งานที่ซับซ้อน (Edge Cases)

* 🔗 **[ดูเอกสาร Test Case ฉบับเต็มได้ที่นี่ (Google Sheets)]** *(https://docs.google.com/spreadsheets/d/1FwKxyuA_PvCbafsbN_n3bVKhVTvN0wdrACsJjF40L_g/edit?usp=sharing)*

**ไฮไลต์การทดสอบ:**
* **Date Validation:** ทดสอบลอจิกการคำนวณวันเช่า ป้องกันการเลือกวันสิ้นสุดก่อนวันเริ่มต้น
* **Concurrency Control:** จำลองสถานการณ์ Race Condition เมื่อมีผู้ใช้แย่งกันทำรายการเช่าสินค้าชิ้นสุดท้ายพร้อมกัน เพื่อตรวจสอบการทำงานของ Database Transaction

### 2. Highlight Bug Reports (Root Cause Analysis)
ตัวอย่างการรายงานข้อผิดพลาด (Defect Reporting) ที่พบระหว่างการทดสอบ พร้อมวิเคราะห์สาเหตุเชิงลึกถึงระดับ Database เพื่อให้ทีม Dev นำไปแก้ไขต่อได้ง่ายขึ้น

<details>
<summary><b>🐞 BUG-RENT-001: ระบบอนุญาตให้ผู้ใช้เลือกวันสิ้นสุดการเช่าก่อนวันเริ่มเช่าได้</b></summary>

* **Severity:** Medium | **Priority:** High
* **Steps to Reproduce:**
  1. เลือกสินค้าและเข้าสู่หน้าเลือกวันเช่า
  2. กำหนด Start Date = `10/07/2026`
  3. กำหนด End Date = `05/07/2026` (เลือกวันที่ย้อนหลัง)
  4. กดปุ่ม "Confirm Rent"
* **Actual Result:** ระบบไม่แสดง Error Message และสามารถกดส่งข้อมูลไปบันทึกได้ ทำให้จำนวนวันเช่าติดลบ
* **QA Notes (Root Cause):** ขาดการทำ Data Validation ทั้งในส่วน Frontend (React state/input validation) และ Backend (Node.js) ก่อน Insert ข้อมูลลงตารางใน `rent_db`
</details>

<details>
<summary><b>🐞 BUG-RENT-002: เกิด Race Condition เมื่อผู้ใช้ 2 คนกดเช่าสินค้าชิ้นเดียวกันพร้อมกัน</b></summary>

* **Severity:** High | **Priority:** High
* **Steps to Reproduce:**
  1. สินค้าคงเหลือ = 1
  2. User A และ User B กดปุ่ม "Confirm Rent" ในเสี้ยววินาทีเดียวกัน (Concurrent Requests)
* **Actual Result:** ผู้ใช้ทั้ง 2 คนทำรายการสำเร็จ เมื่อตรวจสอบใน `rent_db` พบว่าค่า Stock ของสินค้ากลายเป็น `-1` (Data Integrity พัง)
* **QA Notes (Root Cause):** Backend อ่านค่า Stock พร้อมกันก่อนอัปเดต แนะนำให้จัดการ Concurrency Control ใน PostgreSQL เช่น การใช้ Row-level locking (`SELECT ... FOR UPDATE`) ใน Database Transaction
</details>
