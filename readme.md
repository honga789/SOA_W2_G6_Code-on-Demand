# Code-on-Demand (REST) — Q&A + Demo Validator/Plugin

## Mục lục

* [Câu 1 — Có vi phạm stateless không?](#câu-1--có-vi-phạm-stateless-không)
* [Câu 2 — Khi nào hữu ích & khi nào nguy hiểm?](#câu-2--khi-nào-hữu-ích--khi-nào-nguy-hiểm)
* [Câu 3 — API trả về JS validator động](#câu-3--api-trả-về-js-validator-động)
* [Câu 4 — Thiết kế hệ thống plugin nạp từ server](#câu-4--thiết-kế-hệ-thống-plugin-nạp-từ-server)

---

## Câu 1 — Có vi phạm stateless không?

**Không.** Tải JavaScript từ server **không** vi phạm nguyên tắc *stateless* của REST.

* *Stateless* = **mỗi request tự chứa đủ thông tin** để server xử lý; server **không lưu phiên trạng thái của client** giữa các request.
* *Code-on-Demand* chỉ là **server gửi một “biểu diễn” (representation) là mã JS** để client thực thi. **Gửi code ≠ lưu trạng thái** phía server.
* Sau khi tải JS, các request tiếp theo vẫn phải tự-đủ thông tin như bình thường.

---

## Câu 2 — Khi nào hữu ích & khi nào nguy hiểm?

### Hữu ích

* **Mở rộng tính năng mà không cần phát hành lại client** (client tải “đoạn mã” từ server để có khả năng mới) → đúng với ràng buộc *Code-on-Demand* (tùy chọn) trong REST; giúp **client đơn giản hơn**.
* **Cải thiện UX** với kiểm tra nhẹ phía client (vd: **validate form trước khi gửi**), trong khi **kiểm tra bảo mật thật vẫn ở server**.
* **Tối ưu hiệu năng** bằng cách **tải code khi cần** (*dynamic import / lazy-loading*) → giảm thời gian tải ban đầu.

### Nguy hiểm

* **XSS**: nếu ứng dụng **trả về/nhúng script do dữ liệu không tin cậy điều khiển**, kẻ tấn công có thể chiếm cookie/token và thao túng trang.

---

## Câu 3 — API trả về JS validator động

**Mục tiêu:** Server cung cấp **endpoint** trả về JS (IIFE) gắn `window.passwordValidator(pw)` theo luật **mới**:

* Chuỗi, **dài ≥ 12**, **ít nhất 1 ký tự đặc biệt** (`/[^A-Za-z0-9]/`).

**Endpoint:** `GET /dynamic-validator.js`

**Hành vi phía client (tích hợp trong `public.html`):**

* Mặc định có `validatePasswordLocal(pw)` (luật cũ: **≥ 8 ký tự**).
* Khi bấm **“Tải quy tắc kiểm tra mới”**, client thêm `<script src="/dynamic-validator.js">`.
* Nút “Đăng ký” dùng **validator động nếu có**, ngược lại fallback sang local:

**Kết quả:** Sau khi nạp luật mới, chỉ mật khẩu thỏa **≥ 12** và **có ký tự đặc biệt** mới hợp lệ; ngược lại báo lỗi.

---

## Câu 4 — Thiết kế hệ thống plugin nạp từ server

**Mục tiêu:** Cho phép client **nạp plugin động (ES module)** từ server để mở rộng UI/hành vi **mà không cần phát hành lại client**.

### Kiến trúc tổng quan

* **Registry endpoint:** `GET /plugins/registry.json` trả về danh sách plugin:

  * Trường: `id`, `url`, `enabled`, `checksum` (demo có thể để trống).

* **Định dạng plugin (ES module):** Mỗi plugin **export default** một hàm nhận `context`:

```js
export default function(context) {
    // context: { ui, dom, ... }
    .....
}
```

* **Host API phía client** (cung cấp cho plugin qua `setup(context)`):

    * `ui.mount(el)`: Gắn một element vào vùng `#plugin-root`.
    * `dom.q(sel)`: Truy vấn DOM an toàn.

### Luồng hoạt động

1. Người dùng bấm **“Nạp plugin từ server”**.
2. Client `fetch /plugins/registry.json`, lọc plugin `enabled`.
3. Với mỗi plugin: **`import()` động** từ `url`.
4. Gọi `setup({ ui, dom })` để plugin **tự gắn vào UI/hành vi**.

---
