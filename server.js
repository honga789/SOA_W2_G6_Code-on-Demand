import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public.html'));
});

app.get('/dynamic-validator.js', (req, res) => {
  const code = `
    // Dynamic password rule: >= 12 ký tự & có ký tự đặc biệt
    (function () {
      window.passwordValidator = function(pw) {
        const ok = typeof pw === 'string'
          && pw.length >= 12
          && /[^A-Za-z0-9]/.test(pw); // có ký tự đặc biệt
        if (!ok) {
          console.log('[DynamicValidator] Không hợp lệ. Yêu cầu: >=12 ký tự & có ký tự đặc biệt.');
          alert("[DynamicValidator] Không hợp lệ. Yêu cầu: >=12 ký tự & có ký tự đặc biệt.")
        } else {
          console.log('[DynamicValidator] Hợp lệ theo luật động.');
          alert("[DynamicValidator] Hợp lệ theo luật động.")
        }
        return ok;
      };
      console.log('[DynamicValidator] Đã nạp quy tắc mật khẩu mới.');
    })();
  `;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(code);
});

/**
 * Registry: liệt kê plugin có thể nạp
 *  - id: mã định danh
 *  - url: đường dẫn ES module để import()
 *  - enabled: có bật không
 *  - checksum (tùy chọn, demo để trống)
 */
app.get('/plugins/registry.json', (req, res) => {
  res.json({
    version: 1,
    plugins: [
      {
        id: 'toggle-password',
        url: `http://localhost:${PORT}/plugins/toggle-password.js`,
        enabled: true,
        checksum: null
      }
    ]
  });
});

/**
 * Plugin: toggle-password
 * - ES module export { meta, setup }
 * - setup(context): thêm nút ẩn/hiện mật khẩu bên cạnh input#password
 * - Chỉ dùng API host cấp qua context (ui.mount, dom.query)
 */
app.get('/plugins/toggle-password.js', (req, res) => {
  const code = `
    export const meta = {
      name: 'toggle-password',
      version: '1.0.0',
      permissions: ['ui', 'dom']
    };

    export function setup(context) {
      const pwInput = context.dom.query('#password');
      if (!pwInput) return;

      // Tạo nút toggle
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Hiện';
      btn.style.marginTop = '10px';
      btn.style.width = '100%';
      btn.style.padding = '8px';

      let visible = false;
      btn.addEventListener('click', () => {
        visible = !visible;
        pwInput.type = visible ? 'text' : 'password';
        btn.textContent = visible ? 'Ẩn' : 'Hiện';
      });

      // Mount vào khu vực plugin-root (host quản lý)
      context.ui.mount(btn);
      console.log('[toggle-password] loaded');
    }
  `;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.send(code);
});

app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});
