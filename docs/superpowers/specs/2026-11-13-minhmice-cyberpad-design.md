# Minhmice Cyberpad — đặc tả thiết kế

## Mục tiêu

Tạo cấu hình cá nhân cho macro keyboard USB `1189:8842`, sử dụng với OMP. Hai phím ở phía trái chọn hai model bằng cách đưa nguyên chuỗi lệnh vào ô nhập OMP, không tự nhấn Enter. Hai núm bên phải điều khiển media. Lưu cấu hình, cách khôi phục và kế hoạch trong repository `minhmice-cyberpad`.

## Hành vi

- Phím Gemini: hiển thị `/switch 9router/ag/gemini-3.8-flash-high` trong ô nhập OMP.
- Phím Claude: hiển thị `/switch 9router/cc/claude-sonnet-5-5` trong ô nhập OMP.
- Bấm Enter thủ công để gửi; không tự chuyển model, không chọn gần đúng.
- Khi đã có lệnh chọn model do Cyberpad đặt trong ô nhập, bấm phím model khác thay lệnh đó. Không ghi đè nội dung người dùng đang soạn khác; thông báo thay vì xóa nội dung.
- Núm 1: giảm âm lượng / mute / tăng âm lượng. Núm 2: bài trước / play-pause / bài sau.
- Giữ nguyên các phím, layer và đèn còn lại, trừ khi người dùng yêu cầu khác.

## Kiến trúc và giới hạn

Firmware hiện tại của dòng `1189:8842` được các công cụ hỗ trợ tối đa 18 bước phím cho một macro. Hai chuỗi trên dài hơn, nên thiết kế đã chọn lưu hai tổ hợp phím ngắn trong chip; extension OMP mở rộng tổ hợp thành chuỗi đầy đủ trong composer. Không cần daemon, AHK hay Python chạy nền, nhưng **chuỗi đầy đủ nằm trong extension trên máy, không nằm trong chip**; trên máy không tải extension, hai phím không tạo ra chuỗi. Đây là khác biệt so với yêu cầu nạp nguyên chuỗi vào chip. Không thay firmware hay vào bootloader.

Tổ hợp dự kiến `Ctrl+Alt+Shift+1` và `Ctrl+Alt+Shift+2`; chỉ dùng nếu kiểm tra thực tế chứng minh terminal và OMP phân biệt được chúng và không xung đột. Nếu không, xác định tổ hợp thay thế trước khi ghi. Kiểm chứng `/switch` và hai model trong phiên OMP thực tế; không giả định cú pháp hay khả dụng chỉ từ danh sách model.

## An toàn và khôi phục

Trước khi ghi, nhận diện đúng thiết bị và bố trí phím/núm, đọc và sao lưu cấu hình hiện tại nếu công cụ cho phép; đối chiếu vị trí vật lý. Chỉ ghi các binding được yêu cầu, không reset thiết bị. Đọc lại và so sánh sau khi ghi. Nếu không xác minh được backup, vị trí, giao thức hoặc bảo toàn các binding khác, dừng trước khi ghi. File backup/profile có thể chứa macro nhạy cảm: kiểm tra trước khi commit hoặc push.

## Kiểm thử và bàn giao

Kiểm thử extension trong OMP TUI thực: cả hai phím tạo đúng chuỗi, chuyển qua lại không gửi Enter, không mất bản nháp; kiểm tra xung đột phím và trạng thái không hỗ trợ. Kiểm chứng hai model khi người dùng chủ động gửi lệnh. Kiểm tra từng hướng và nút nhấn của hai núm; xác nhận các binding không thay đổi. Lưu hướng dẫn setup, phục hồi, cấu hình và kế hoạch trong repository. Không cam kết định dạng JSON hoặc YAML cụ thể cho đến khi xác nhận công cụ đọc/ghi giữ nguyên binding hỗ trợ định dạng đó.
