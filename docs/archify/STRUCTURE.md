# 📂 Cấu trúc thư mục codebase

Dưới đây là cây thư mục của `src/` trong ReliefGrid, viết lại để người mới dễ nắm bắt.

```
src/
├── main.tsx              # Entry point, render React app với RouterProvider
├── router.tsx            # Định nghĩa 10 route, lazy-load trang, guard admin
├── index.css             # CSS global
├── vite-env.d.ts
│
├── types/
│   └── models.ts         # Tất cả kiểu TypeScript: Station, DonationOrder, Product,
│                         # Carrier, StationNeed, Role, OrderStatus, Filters, v.v.
│
├── lib/                  # Thu viện logic nghiệp vụ
│   ├── needLogic.ts      # Công thức S = max(0, D − R − T), trạng thái need, progress bar
│   ├── suggest.ts        # Min-cost flow chia hàng dư sang trạm khác
│   ├── format.ts         # Định dạng tiền VND, ngày, masks số điện thoại, nhãn trạng thái
│   ├── geo.ts            # Xử lý bản đồ, chiếu tọa độ tỉnh
│   └── __tests__/        # Unit test cho needLogic, suggest, format
│
├── data/                 # Dữ liệu mock (không backend)
│   ├── stations.ts       # 9 trạm cứu trợ demo (D/R/T, địa chỉ, tọa độ)
│   ├── items.ts          # 8 loại hàng cứu trợ (nước, mì, thuốc, chăn, sữa, đèn pin, v.v.)
│   ├── extras.ts         # 8 sản phẩm NPP, 3 đơn vị vận chuyển, 4 đơn mẫu
│   ├── provinces.ts      # Ánh xá tên tỉnh cũ ↔ mới theo NQ 202/2025/QH15
│   ├── vnProvinces63.ts  # Ranh giới 63 tỉnh (trước sáp nhập)
│   └── vnProvinces34.ts  # Ranh giới 34 tỉnh (sau sáp nhập)
│
├── store/                # Zustand state management
│   ├── useAppStore.ts    # Store duy nhất: auth, trạm, đơn, sản phẩm, UI, chat, wizard
│   └── __tests__/        # Test cho store (tạo đơn, đồng bộ offline, duyệt tài khoản)
│
├── config/
│   └── dev.ts            # Hash mã admin nội bộ (demo)
│
├── components/           # Components tái sử dụng
│   ├── layout/
│   │   ├── Layout.tsx    # Khung chung: Header + main + Footer + Toasts
│   │   └── Chrome.tsx    # Header (nav, toggle offline/data saver), Footer, Toasts
│   ├── ui/
│   │   ├── Badges.tsx    # VerifiedBadge, UrgencyBadge
│   │   ├── ItemIcon.tsx  # Biểu tượng mặt hàng
│   │   ├── MaskedPhone.tsx # Mask số điện thoại (090****567)
│   │   └── ProgressBar3.tsx # Thanh tiến độ 3 đoạn (R / T / rest)
│   ├── home/
│   │   ├── VietnamMap.tsx       # Bản đồ VN SVG, toggle 63/34 tỉnh
│   │   ├── StationMap.tsx       # Hiển thị trạm lên bản đồ
│   │   ├── StationCard.tsx      # Card trạm trên trang chủ
│   │   ├── FullMapModal.tsx     # Modal xem bản đồ lớn
│   │   └── ProvinceReliefModal.tsx # Dialog chi tiết trạm khi bấm pin
│   └── station/
│       ├── NeedItem.tsx         # Hiển thị nhu cầu 1 món hàng của trạm
│       ├── StationCard.tsx      # Card trạm chi tiết
│       └── SurplusSuggest.ts    # Gợi ý trạm khác khi nhập vượt S
│
└── pages/                # Trang ứng dụng (lazy-loaded qua router)
    ├── HomePage.tsx              # Trang chủ: bản đồ, bộ lọc, nhu cầu khẩn cấp
    ├── StationDetailPage.tsx     # Chi tiết trạm, quyên góp cho trạm
    ├── DonateWizardPage.tsx      # Wizard quyên góp 3 bước
    ├── MyDonationsPage.tsx       # Đơn của tôi, đơn chờ offline
    ├── AuthPage.tsx              # Đăng nhập / đăng ký vai trò
    ├── StationDashboardPage.tsx  # Quản lý trạm: xác nhận hàng, sửa nhu cầu, minh chứng
    ├── DistributorPage.tsx       # Quản lý sản phẩm, đơn cứu trợ (NPP)
    ├── CarrierPage.tsx           # Quản lý đơn vận chuyển
    ├── StatsPage.tsx             # Thống kê hệ thống
    └── AdminVerifyPage.tsx       # Admin duyệt trạm và tài khoản Station/NPP
```

## Nguyên tắc đặt tên

- `kebab-case` cho tên file và folder.
- `PascalCase` cho React component và trang.
- Import type từ `../types/models`, store từ `../store/useAppStore`.

> Mục tiêu: đọc xong cây thư mục này bạn biết mỗi file làm gì,どこ để tìm logic nghiệp vụ, giao diện, hay dữ liệu mock.
