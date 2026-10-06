# Dự án: Trạm cứu trợ số (ReliefGrid) - demo giao diện
- Spec đầy đủ ở docs/SPEC.md, luôn đọc trước khi code.
- Stack: React + Vite + TypeScript + Tailwind + react-router + zustand + lucide-react. Không backend, mock data trong src/data.
- Logic cốt lõi: S = max(0, D - R - T). S = 0 thì khóa quyên góp.
- Chỉ làm đúng phạm vi được giao, không tự thêm trang khác.
- Làm xong phải chạy npm run build, không để lỗi TypeScript.