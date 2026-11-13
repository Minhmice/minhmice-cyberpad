# minhmice-cyberpad 🎛️

Bản firmware và extension OMP tùy biến độc bản dành riêng cho **USB Macro Keyboard (VID 1189, PID 8842)**.

## Điểm nhấn
- **Nạp 100% vào chip phần cứng (Onboard Flash)**: Không cần phần mềm chạy ngầm, không AutoHotkey, không tốn tài nguyên hệ thống.
- **Bung nguyên chuỗi 40 ký tự**: 2 phím ngoài cùng bên trái kích hoạt extension OMP để bung nguyên văn lệnh `/switch 9router/...` vào khung soạn thảo.
- **Cơ chế kiểm soát an toàn (Manual Gate)**: Không tự tiện nhấn Enter hay tự động gửi lệnh. Người dùng xem lại lệnh trên terminal rồi tự tay nhấn **Enter**.
- **Điều khiển Media trên Knob**: 2 núm xoay bên phải điều khiển âm lượng, mute, chuyển bài hát.

---

## Bố cục phím & núm (Physical Layout)

```text
[ Phím 1: Gemini ]   [ Phím 2: Claude ]   [ Quick File ]     [ Cmd Palette ]      (( Núm 1: Vol/Mute ))
[ Format Doc     ]   [ Go to Def      ]   [ Rename F2  ]     [ Toggle Term ]
[ Toggle Comment ]   [ Copy Line Down ]   [ Save C+S   ]     [ Undo C+Z    ]      (( Núm 2: Prev/Next ))
```

### Chi tiết gán chức năng:
- **Phím ngoài cùng trên cùng bên trái (Key 1)**: Bung lệnh `/switch 9router/ag/gemini-3.8-flash-high`
- **Phím kế bên (Key 2)**: Bung lệnh `/switch 9router/cc/claude-sonnet-5-5`
- **Núm 1 (Góc trên bên phải)**:
  - Vặn ngược chiều kim đồng hồ: `Volume Down`
  - Nhấn nút: `Mute / Unmute`
  - Vặn theo chiều kim đồng hồ: `Volume Up`
- **Núm 2 (Góc dưới bên phải)**:
  - Vặn ngược chiều kim đồng hồ: `Previous Track`
  - Nhấn nút: `Play / Pause`
  - Vặn theo chiều kim đồng hồ: `Next Track`

---

## Hướng dẫn cài đặt & sử dụng

### 1. Cài Extension vào OMP
Chạy PowerShell script:
```powershell
.\scripts\install-extension.ps1
```
Script sẽ tự động copy `omp-extension/minhmice-cyberpad.ts` vào thư mục extension của OMP (`~/.omp/agent/extensions/`).

### 2. Nạp cấu hình vào Chip Macro Pad

#### Cách 1: Nạp 1-Click Offline qua WebHID (Nhanh nhất & Độc lập mạng)
Chạy file `open-configurator.bat`:
1. Cửa sổ Edge/Chrome sẽ tự động mở `http://localhost:8088`.
2. Bấm **Connect keypad** → chọn thiết bị `1189:8842`.
3. Bấm **Import** → chọn file `firmware/webhid-profile.json`.
4. Bấm **Write to keypad** để nạp thẳng vào flash chip.

*(Hoặc truy cập trực tiếp online tại [jvspier.github.io/macropad-rebind](https://jvspier.github.io/macropad-rebind/))*

#### Cách 2: Nạp bằng CLI
Yêu cầu cài đặt `cargo install ch57x-keyboard-tool`:
```powershell
.\scripts\flash-pad.ps1
```
Script sẽ tự động nhận diện thiết bị và upload file `firmware/layout.yaml` vào bộ nhớ chip.

---

## Kiến trúc kỹ thuật
- **Firmware Hardware Trigger**: Chip lưu tổ hợp ngắn `Ctrl+Alt+Shift+1` và `Ctrl+Alt+Shift+2` (1 step < giới hạn 18 bước của MCU).
- **OMP UI Runtime Bridge**: Extension `minhmice-cyberpad.ts` lắng nghe shortcut và sử dụng `ctx.ui.setEditorText()` để cập nhật trực tiếp chuỗi 40 ký tự vào buffer prompt mà không làm mất bản nháp khác của người dùng.
