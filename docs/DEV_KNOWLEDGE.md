# Relief Grid — Kiến thức kỹ thuật & nghiệp vụ (Dev Knowledge)

> File này viết cho người nhận dự án mới. Mục đích: đọc xong là hiểu luôn project là về gì, code chạy thế nào, quy tắc nghiệp vụ (business rule) ở đâu, và kỹ thuật dùng để giải quyết rule đó như thế nào. Không mơ hồ, không lý thuyết chung chung — mọi khái niệm đều gắn với file/code thực tế trong repo.

---

## 1. Dự án là gì? (Domain)

**Relief Grid** là frontend (Single Page Application) mô phỏng một hệ thống kết nối hỗ trợ cứu trợ thiên tai (bão/lũ) tại Việt Nam.

Vai trò người dùng (`Role`):
| Vai trò | Ý nghĩa | Được làm gì chính |
|---------|---------|-------------------|
| `donor` | Người quyên góp (cá nhân) | Chọn trạm + món hàng thiếu → tạo đơn quyên góp (tự mang / vận chuyển / mua trực tiếp) |
| `station` | Trạm cứu trợ | Cập nhật nhu cầu từng mặt hàng, duyệt đơn đến trạm mình, xác nhận đã nhận hàng, đăng minh chứng |
| `distributor` | Nhà phân phối | Quản lý sản phẩm cứu trợ (giá, tồn kho, khuyến mãi), xử lý đơn mua trực tiếp, rút tiền |
| `admin` | Quản trị viên | Duyệt trạm, duyệt đơn, duyệt tài khoản mới đăng ký (trạm/NPP) |
| `null` | Chưa đăng nhập | Chỉ xem trang chủ, bản đồ, chi tiết trạm |

**Luồng nghiệp vụ chính (happy path):**
1. Trạm cập nhật danh sách nhu cầu (`StationNeed`: cần bao nhiêu `D`, đã nhận `R`, đang giao `T`).
2. Donor chọn trạm, chọn món còn thiếu (`S > 0`), nhập số lượng, chọn hình thức (`self` | `carrier` | `buy`).
3. Tạo đơn (`DonationOrder`) → trạng thái `created`.
4. Đơn đi qua flow: `created → confirmed → preparing → shipping → received` (hoặc `rejected` = từ chối, trạng thái cuối).
5. Trạm xác nhận đã nhận hàng → `R` tăng, `T` giảm, nếu `S = 0` hệ thống khóa (closed/fulfilled) mặt hàng đó.

**Dữ liệu là demo (không có backend thật):**
- Toàn bộ state nằm trong **Zustand store** (`src/store/useAppStore.ts`), bền vững qua reload qua `localStorage`.
- Không có API thật, không có upload ảnh thật (ảnh là placeholder/URL dán tay).
- Mã đơn, mã vận đơn, hash admin… đều được sinh deterministic trong frontend.

---

## 2. Tech stack & cấu trúc thư mục

| Công cụ | Vai trò |
|---------|---------|
| React + Vite | Build tool, dev server, HMR |
| TypeScript | Kiểu dữ liệu cứng (xem `src/types/models.ts`) |
| Tailwind CSS | Styling utility-first (`tailwind.config.js`) |
| Zustand | State management toàn cục (`src/store/useAppStore.ts`) |
| React Router | Client-side routing (`src/router.tsx`) |
| Lucide React | Icon |
| qrcode.react | Sinh mã QR cho đơn tự mang |
| Vitest (giả định từ `__tests__`) | Unit test cho lib + store |

**Cấu trúc thư mục quan trọng:**

```
src/
  types/models.ts          # Tất cả interface/type cốt lõi (ItemDef, Station, StationNeed, DonationOrder, DonateMethod, OrderStatus, Urgency, Role…)
  store/useAppStore.ts     # Zustand store: state + mọi action nghiệp vụ (the "brain")
  lib/needLogic.ts         # Tính toán S, trạng thái cần, progress bar (công thức nghiệp vụ cốt lõi)
  lib/suggest.ts           # Thuật toán phân bổ hàng dư (min-cost flow lite, greedy)
  lib/geo.ts               # Chiếu lat/lng -> tọa độ SVG cho bản đồ Việt Nam
  lib/format.ts            # Format tiền tệ, ngày, mã số điện thoại, label trạng thái/urgency
  config/dev.ts            # Cổng admin nội bộ (djb2 hash, demo-grade, KHÔNG bảo mật thật)
  data/stations.ts         # 9 trạm demo (D/R/T/urgency, verified, distancia giả từ TP.HCM)
  data/items.ts            # 8 mặt hàng cứu trợ (nước, mì, thuốc, chăn, sữa, đèn pin, vệ sinh, tã)
  data/extras.ts           # Sản phẩm NPP, đơn vị vận chuyển, đơn mẫu
  data/provinces.ts        # Danh sách tỉnh mới/cũ (sáp nhập 2025)
  pages/*.tsx              # Trang: Home, Trạm chi tiết, Quyên góp, Đơn của tôi, Trạm quản lý, NPP, Vận chuyển, Thống kê, Admin xác minh, Đăng nhập
  components/*.tsx         # UI component reusable (StationCard, NeedItem, ProgressBar3, Badges, MaskedPhone…)
```

---

## 3. Domain model — kiểu dữ liệu cốt lõi (models.ts)

Tất cả interface gốc ở `src/types/models.ts`. Dưới đây là các type quan trọng và ý nghĩa nghiệp vụ:

### 3.1 Enum-ish types (literal union)

```ts
export type Urgency = 'low' | 'medium' | 'high' | 'critical';
export type NeedStatus = 'open' | 'partial' | 'fulfilled' | 'closed';
export type OrderStatus =
  | 'created' | 'confirmed' | 'preparing' | 'shipping' | 'received' | 'rejected';
export type DonateMethod = 'self' | 'carrier' | 'buy';
export type Role = 'station' | 'donor' | 'distributor' | 'admin' | null;
export type PayMethod = 'momo' | 'zalopay' | 'bank';
```

**C++ mapping** (type literal union → `enum class`):

```cpp
using namespace std;

enum class Urgency { Low, Medium, High, Critical };
enum class NeedStatus { Open, Partial, Fulfilled, Closed };
enum class OrderStatus { Created, Confirmed, Preparing, Shipping, Received, Rejected };
enum class DonateMethod { Self, Carrier, Buy };
enum class Role { Station, Donor, Distributor, Admin }; // null dùng optional<Role>
// hoặc string_view nếu muốn giữ chuỗiLiteral giống TS
```

**Business rule:**
- `Urgency` dùng để ưu tiên phân bổ hàng (suggest.ts): `critical` được ưu tiên cao nhất.
- `OrderStatus` flow là một chuỗi đơn chiều (`created → confirmed → preparing → shipping → received`), `rejected` là ngả nhánh cuối cùng, không quay lại được.
- `DonateMethod` quyết định pipeline tạo đơn khác nhau (xem mục 5).

### 3.2 StationNeed — tim tim của dự án

```ts
export interface StationNeed {
  itemId: string;
  D: number; // tổng nhu cầu (demand)
  R: number; // đã tiếp nhận (received)
  T: number; // đang vận chuyển (transit / on the way)
  urgency: Urgency;
  closed?: boolean; // trạm chủ động đóng nhận quyên góp mặt hàng này
}
```

**C++ mapping** (`interface` → `struct`, `?` → `std::optional`):

```cpp
using namespace std;

struct StationNeed {
  string itemId;
  int D;    // tổng nhu cầu (demand)
  int R;    // đã tiếp nhận (received)
  int T;    // đang vận chuyển (transit / on the way)
  Urgency urgency;
  optional<bool> closed; // nullable: có hoặc không có
};

// Cách dùng (gần giống TS):
StationNeed n;
n.closed = true;        // gán giá trị
n.closed.reset();       // xóa thành undefined/null (giống closed?: boolean không gán)
if (n.closed.value_or(false)) { ... } // đọc an toàn, default false nếu không có
```

**Công thức cốt lõi** (`lib/needLogic.ts`):

```
S = max(0, D - R - T)   // còn thiếu
```

- `S` = lượng còn thiếu để đạt đủ nhu cầu.
- Khi `S == 0` → mặt hàng считается **đã đủ** (`fulfilled`).
- Khi `closed == true` → trạm tự khóa, không nhận thêm (`closed`).
- `progressSegments()` chia thanh tiến độ làm 3 đoạn: `R` (đã nhận), `T` (đang giao), `rest` (còn thiếu), tổng = 100%.

**Ví dụ thực tế từ data:** Trạm Nghệ An–Con Cuông, mặt hàng `nuoc`: `D=800, R=500, T=150` → `S = 800-500-150 = 150` còn thiếu.

### 3.3 Station

```ts
export interface Station {
  id, name, org, contact, phone, address,
  province, provinceOld,   // tên mới sau sáp nhập 2025 + tên cũ (hiển thị song song)
  lat, lng, pickupHours,
  verified: boolean,       // đã được admin duyệt hay chưa
  distanceKm: number,      // khoảng cách giả từ TP.HCM (demo, không GPS thật)
  needs: StationNeed[],
  servedAreas: string[],   // khu vực đã phân phát (để trạm khác tránh trùng)
  proofs: Proof[],         // ảnh minh chứng phát hàng
  totalDonations, successOrders,
}
```

**C++ mapping** (`interface` → `struct`, mảng → `std::vector`):

```cpp
using namespace std;

struct Station {
  string id, name, org, contact, phone, address;
  string province, provinceOld; // tên mới + tên cũ (sáp nhập 2025)
  double lat, lng;
  string pickupHours;
  bool verified;
  double distanceKm; // khoảng cách giả từ TP.HCM
  vector<StationNeed> needs;
  vector<string> servedAreas;
  vector<Proof> proofs;
  int totalDonations, successOrders;
};
```

**Business rule sáp nhập tỉnh 2025:** Mỗi trạm lưu cả `province` (mới) và `provinceOld` (cũ). UI hiển thị tên mới, cho phép toggle bản đồ theo tên cũ. Ví dụ: `quangbinh-1` tên trạm "Quảng Trị — Lệ Thủy" nhưng `province='Quảng Trị'`, `provinceOld='Quảng Bình'`.

### 3.4 DonationOrder

```ts
export interface DonationOrder {
  id, code, stationId, itemId, qty,
  method: DonateMethod,      // self / carrier / buy
  status: OrderStatus,
  carrierId?, productId?,    // tùy method
  createdAt,
  proofImg?,
  trackingCode?: string,     // TRK-<code> cho carrier/buy (demo)
  buyerName?, payMethod?,    // momo/zalopay/bank
}
```

**C++ mapping** (`?` → `std::optional`, union literal → `enum class`):

```cpp
using namespace std;

enum class DonateMethod { Self, Carrier, Buy };
enum class OrderStatus { Created, Confirmed, Preparing, Shipping, Received, Rejected };

struct DonationOrder {
  string id, code, stationId, itemId;
  int qty;
  DonateMethod method;
  OrderStatus status;
  optional<string> carrierId;   // tùy method
  optional<string> productId;   // tùy method
  string createdAt;
  optional<string> proofImg;
  optional<string> trackingCode; // TRK-<code>
  optional<string> buyerName;
  optional<string> payMethod;    // momo/zalopay/bank
};
```

**Mã đơn:** `RG-1005, RG-1006, ...` sinh bởi `nextOrderCode()` trong store, bền qua `localStorage` key `reliefgrid-orderseq`, **không bao giờ tái sử dụng**.

**Mã vận đơn:** `TRK-<code>` (demo, thực tế ĐVVC cấp qua API).

### 3.5 Product / Carrier

- `Product`: hàng cứu trợ của NPP (giá, tồn kho, khuyến mãi, freeship, ảnh demo, variant). Liên kết với `StationNeed` qua `itemId`.
- `Carrier`: đơn vị vận chuyển (phí, ETA). `c2` "Cứu trợ Logistics" phí = 0, miễn phí tuyến bão.

---

## 4. Business rule chi tiết (xen kĩ thuật)

### 4.1 Công thức còn thiếu S và trạng thái cần (needLogic.ts)

File: `src/lib/needLogic.ts`

```ts
export function calcS(n: Pick<StationNeed,'D'|'R'|'T'>): number {
  return Math.max(0, n.D - n.R - n.T);
}

export function getNeedStatus(n: StationNeed): NeedStatus {
  if (n.closed) return 'closed';
  const s = calcS(n);
  if (s === 0) return 'fulfilled';
  if (n.R > 0 || n.T > 0) return 'partial';
  return 'open';
}

export function isLocked(n: StationNeed): boolean {
  return n.closed === true || calcS(n) === 0;
}
```

**C++ mapping** (`Pick<A,B,C>` → truyền struct trực tiếp, `Math.max/min` → `std::max/std::min`, `===` → `==`, `? :` → `?:` hoặc `if/else`):

```cpp
using namespace std;
#include <algorithm> // max, min

int calcS(const StationNeed& n) {
  return max(0, n.D - n.R - n.T); // không bao giờ âm
}

NeedStatus getNeedStatus(const StationNeed& n) {
  if (n.closed.value_or(false)) return NeedStatus::Closed;
  int s = calcS(n);
  if (s == 0) return NeedStatus::Fulfilled;
  if (n.R > 0 || n.T > 0) return NeedStatus::Partial;
  return NeedStatus::Open;
}

bool isLocked(const StationNeed& n) {
  return n.closed.value_or(false) || calcS(n) == 0;
}
```

| Rule | Nghĩa | Code |
|------|-------|------|
| Còn thiếu | `S = max(0, D - R - T)`, không bao giờ âm | `calcS` |
| Đã đủ | `S == 0` → `fulfilled` | `getNeedStatus` |
| Một phần | `S > 0` và đã có ít nhất một phần nhận/giao | `getNeedStatus` |
| Mở | `S > 0` và chưa có gì đến | `getNeedStatus` |
| Khóa | `closed == true` hoặc `S == 0` | `isLocked` |
| Đang trên đường | `S == 0` nhưng `T > 0` và `R < D` → hiển thị "Đủ (còn X đang trên đường)" | `onTheWayLabel` |

**Tại sao cần `T` (đang giao)?** Tránh tình trạng đơn hàng đang trên đường còn được tính là "chưa có gì đến" → tránh nhận trùng lấp quá nhiều hàng cho cùng một trạm.

### 4.2 Luồng đơn hàng (Order lifecycle)

File: `src/store/useAppStore.ts` → `advanceOrder`, `rejectOrder`, `confirmReceipt`; `src/lib/format.ts` → `orderStatusLabel`.

```
created → confirmed → preparing → shipping → received
      ↘────────────────────────────────────────→ rejected (cuối cùng, không quay lại)
```

**Business rule tại mỗi bước:**

| Bước | Ý nghĩa | Ai thực hiện | Tác động dữ liệu |
|------|---------|--------------|------------------|
| `created` | Đơn vừa tạo, chờ duyệt/xử lý | Donor tạo, Trạm hoặc NPP hoặc Admin duyệt | `T` đã tăng lúc tạo đơn (qua `incT`) |
| `confirmed` | Đã xác nhận | Trạm/NPP/Admin | Chuyển bước qua `advanceOrder` |
| `preparing` | Đang chuẩn bị/lấy hàng | NPP hoặc Trạm | Chuyển bước |
| `shipping` | Đang giao | Vận chuyển (CarrierPage bấm "Đã giao hàng") | Chuyển bước |
| `received` | Trạm đã xác nhận nhận | Trạm (bấm "Xác nhận đã nhận" hoặc quét QR) | `R += receivedQty`, `T -= tDeduct`, `totalDonations++`, `successOrders++`, đơn thành `received` |
| `rejected` | Từ chối | Trạm, NPP, hoặc Admin | Đơn biến khỏi list việc, không tác động `R/T` |

**Giao thiếu (partial receipt):** `confirmReceipt(stationId, itemId, receivedQty, orderId)`:
- `tDeduct = min(need.T, orderQty)` (không được để `T` âm).
- `R += receivedQty` (thực nhận).
- Nếu `receivedQty < orderQty` → toast cảnh báo "Giao thiếu", phần còn thiếu **tự mở lại** (S vẫn > 0, trạm tiếp tục nhận quyên góp).
- Nếu `S` về `0` và trước đó `> 0` → toast "Đã đủ hàng — hệ thống đã đóng nhận quyên góp mặt hàng này".

### 4.3 Hình thức quyên góp (DonateMethod) & pipeline tạo đơn

File: `src/pages/DonateWizardPage.tsx`, `src/store/useAppStore.ts` → `createOrder` / `commitOrder`.

| Method | Ý nghĩa | Đặc điểm kỹ thuật |
|--------|---------|-------------------|
| `self` | Donor tự mang hàng đến điểm tập kết | Sinh mã đơn + mã QR (`QRCodeSVG`) để trạm quét xác nhận. Không trừ tồn kho NPP. `trackingCode = undefined`. |
| `carrier` | Giao qua đơn vị vận chuyển | Cần chọn `carrierId`. `trackingCode = TRK-<code>`. Phí vận chuyển từ `Carrier.fee`. |
| `buy` | Mua trực tiếp từ nhà phân phối | Cần `productId` + `payMethod` (momo/zalopay/bank). Trừ tồn kho NPP (`stock = max(0, stock - qty)`). `trackingCode = TRK-<code>`. |

**Pipeline `createOrder`:**
1. Nếu `offline` → `queueOfflineOrder(o)` (xếp vào `pendingSync`, chưa cấp mã, chưa tăng `T`), quay về `/quyen-gop-cua-toi` để đồng bộ sau.
2. Nếu online → `commitOrder(o)`:
   - Sinh `code = RG-<seq>` (duy nhất, kiểm tra trùng).
   - Gán `id`, `createdAt`, `status`, `trackingCode`, `buyerName`.
   - `incT(stationId, itemId, qty)` → tăng `T` của need (đã clamp theo `S`, không vượt quá còn thiếu).
   - Nếu `productId` → trừ tồn kho NPP.
   - Thêm đơn vào đầu danh sách `orders`, push toast thành công.

**C++ mapping** (`method` là `enum class` → dùng `switch`, không có `undefined` → dùng `std::optional`):

```cpp
using namespace std;

DonationOrder commitOrder(const PendingOrder& o) {
  string code = nextOrderCode(); // RG-1005, RG-1006...
  DonationOrder order{
    .id = "o-" + code,
    .code = code,
    .status = o.status.value_or(OrderStatus::Created),
    .trackingCode = (o.method == DonateMethod::Self)
                      ? nullopt
                      : optional<string>("TRK-" + code),
    .buyerName = o.buyerName.value_or(currentUserName),
    // ... các field khác
  };
  incT(order.stationId, order.itemId, order.qty); // T += qty, clamp theo S
  if (o.productId) {
    // trừ tồn kho NPP, không để âm
    auto& p = findProduct(*o.productId);
    p.stock = max(0, p.stock - o.qty);
  }
  orders.insert(orders.begin(), order); // thêm vào đầu (unshift)
  pushToast("Tạo đơn " + code + " thành công");
  return order;
}
```

### 4.4 Chia đơn khi nhập vượt S (min-cost flow lite)

File: `src/lib/suggest.ts` → `allocateSupply`, `computeCost`; `src/pages/DonateWizardPage.tsx` → `surplusPlan` / `canSplit`.

**Business rule:** Donor có thể nhập số lượng vượt quá `S` của trạm đã chọn. Thứ thì:
- Trạm được chọn nhận trước (đầy `S` của nó).
- Phần dư được gợi ý/chia sang các trạm khác còn thiếu cùng món hàng.
- Nếu tổng `S` của mọi trạm không đủ chứa → hiển thị `unmet` (còn dư, yêu cầu donor giảm số lượng).

**Thuật toán (min-cost flow lite, greedy):**
- Mỗi cạnh (nguồn → trạm) có chi phí đơn vị `cij`:
  ```
  cij = 0.1 * distanceKm + urgencyPenalty + fillPenalty
  ```
  - `urgencyPenalty`: critical=0, high=50, medium=150, low=300 (khẩn cấp hơn → phí ít hơn → được rót trước).
  - `fillPenalty = max(0, 200 - S)`: thiếu càng nhiều → phạt ít hơn → ưu tiên đổ vào trạm thiếu nhiều.
- Greedy rót đầy trạm rẻ nhất (`cij` thấp nhất) trước → với mạng 1 nguồn và chi phí tuyến tính, đây chính là nghiệm tối ưu của `min Σ cij·xij` (không cần solver LP).
- Trạm donor chọn được ưu tiên rót đầy trước (tâm lý "trạm này trước, phần dư đi tiếp").

**C++ mapping** (`computeCost` + greedy):

```cpp
using namespace std;

double computeCost(const Station& st, const string& itemId) {
  auto it = find_if(st.needs.begin(), st.needs.end(),
    [&](const StationNeed& n){ return n.itemId == itemId; });
  if (it == st.needs.end() || it->closed.value_or(false)) return -1;
  int s = calcS(*it);
  if (s <= 0) return -1;

  int urgencyPenalty = 0;
  if (it->urgency == Urgency::High) urgencyPenalty = 50;
  else if (it->urgency == Urgency::Medium) urgencyPenalty = 150;
  else if (it->urgency == Urgency::Low) urgencyPenalty = 300;
  // critical = 0

  int fillPenalty = max(0, 200 - s);
  return 0.1 * st.distanceKm + urgencyPenalty + fillPenalty;
}

// Greedy: sort theo cij tăng dần, rồi rót đầy từng trạm
vector<Allocation> allocateSupply(vector<Station> stations,
                                  const string& itemId,
                                  int qty,
                                  optional<string> preferStationId = nullopt) {
  vector<Allocation> result;
  int rest = qty;
  // 1. Ưu tiên trạm donor chọn trước
  // 2. Sort remaining by computeCost tăng dần
  // 3. Rót đầy từng trạm đến khi rest = 0
  return result;
}
```

**Ví dụ:** Donor muốn quyên góp 50 thùng nước cho trạm Nghệ An (S=150) nhập 200 → 150 cho Nghệ An, 50 dư chia sang các trạm khác còn cần nước theo chi phí tăng dần.

### 4.5 Gợi ý trạm (scoreStation)

File: `src/lib/suggest.ts` → `scoreStation`, `rankStationsForItem`, `alternativesForItem`.

```
score = urgencyWeight[urgency]  (critical=40, high=30, medium=15, low=5)
      + min(30, S / 10)          // thiếu nhiều có điểm thêm, tối đa 30
      + max(0, 20 - distanceKm/100) // càng gần càng điểm cao
```

Dùng để sắp xếp trạm trên trang chủ ("Cần hỗ trợ nhất") và gợi ý trạm thay thế khi trạm hiện tại đã đủ.

### 4.6 Xác minh tài khoản & vai trò (auth & role guard)

File: `src/store/useAppStore.ts` → `quickLogin`, `registerDemo`, `approveAccount`, `rejectAccount`, `verifyStation`, `rejectStation`; `src/router.tsx` → `RequireAdmin`; `src/config/dev.ts` → `checkDevCode`.

**Quy tắc xác minh (demo):**
- `donor` và `admin`: đăng ký/dùng ngay, không cần duyệt (`verifyStatus = 'none'`).
- `station` và `distributor`: đăng ký → `verifyStatus = 'pending'`, vào hàng chờ `approvals`. Admin duyệt (`approveAccount`) → `verified`. Một lần duyệt theo `role:name`, lần sau đăng nhập lại là `verified` luôn (lưu vào `localStorage` key `reliefgrid-approved`).
- Nếu chưa `verified`: các nút thao tác quan trọng (duyệt đơn, xác nhận hàng, sửa nhu cầu, rút tiền, lưu SP) bị **ẩn hẳn** (không khóa mờ), hiển thị banner "Tài khoản đang chờ admin duyệt".

**Route guard:** `/admin/xac-minh` bao bọc bởi `RequireAdmin` — chỉ `userRole === 'admin'` vào được, còn lại redirects về `/`.

**C++ mapping** (guard → `if` kiểm tra quyền trước khi vào trang):

```cpp
using namespace std;

// C++ pseudocode cho RequireAdmin
void renderAdminPage(Role userRole) {
  if (userRole != Role::Admin) {
    navigateTo("/"); // redirect về trang chủ
    return;
  }
  renderAdminVerifyPage(); // chỉ admin mới vào được
}
```

**Cổng admin nội bộ (dev):** `/dang-nhap?dev=<MÃ>`. Mã được hash djb2, so sánh với `DEV_ADMIN_HASH` (`0x925948ab`). Sai/thiếu mã → trang trông bình thường, không dấu vết. **Lưu ý:** chỉ bảo mật demo, đọc bundle vẫn thấy → thực tế cần DB + backend.

### 4.7 Offline mode & đồng bộ đơn

File: `src/store/useAppStore.ts` → `toggleOffline`, `queueOfflineOrder`, `syncPending`, `pendingSync`.

- Bật `offline = true` (toggle trong header).
- Tạo đơn khi offline → `queueOfflineOrder`, lưu vào `localStorage` key `reliefgrid-pending`, đơn tạm có `code = 'CHỜ-ONLINE'`, chưa tăng `T`.
- Khi bật lại online → bấm "Đồng bộ ngay" → `syncPending()` duyệt hàng chờ, gọi `commitOrder` cho mỗi đơn (cấp mã, tăng `T`, trừ tồn), xóa hàng chờ.
- Trang `/quyen-gop-cua-toi` hiển thị danh sách đơn chờ đồng bộ.

### 4.8 Bảo vệ dữ liệu (clamps & guards)

Nhiều chỗ dùng `Math.max(0, ...)` và `Math.min(..., room)` để tránh giá trị âm hoặc vượt quá còn thiếu:
- `incT`: `add = max(0, min(qty, room))` where `room = calcS(need)` → `T` không vượt quá `S`.
- `commitOrder` trừ tồn kho: `stock = max(0, p.stock - o.qty)`.
- `confirmReceipt`: `tDeduct = min(need.T, orderQty)`, `T = max(0, T - tDeduct)`, `qty = max(0, floor(receivedQty))`.
- `updateNeed`: `D = max(0, patch.D ?? n.D)`.
- `addServedArea`: tránh thêm trùng (`includes` check) và tên rỗng.

**C++ mapping** (`Math.max` → `std::max`, `Math.min` → `std::min`, `??` → `value_or` hoặc `if`):

```cpp
using namespace std;
#include <algorithm> // max, min

// incT: T không vượt quá S (room = calcS)
int room = calcS(need);
int add = max(0, min(qty, room));
need.T += add;

// commitOrder: trừ tồn kho, không để âm
p.stock = max(0, p.stock - o.qty);

// confirmReceipt: tDeduct không vượt quá T, qty không âm
int tDeduct = min(need.T, orderQty);
need.T = max(0, need.T - tDeduct);
int qty = max(0, static_cast<int>(floor(receivedQty)));

// updateNeed: D = patch.D ?? n.D (giống value_or)
need.D = max(0, patch.D.value_or(need.D));
```

### 4.9 Format & hiển thị (format.ts)

| Hàm | Ý nghĩa | Ví dụ |
|-----|---------|-------|
| `formatVND(n)` | Tiền tệ Việt Nam | `95000` → `"95.000đ"` |
| `formatDateVN(iso)` | `YYYY-MM-DD` → `DD/MM/YYYY`, cắt thủ công tránh lệch múi giờ | `"2026-10-13"` → `"13/10/2026"` |
| `maskPhone(phone)` | Ẩn phần giữa SĐT | `"0901234567"` → `"090****567"` (không lộ số thật trên UI công khai) |
| `urgencyLabel(u)` | Nhãn tiếng Việt | `critical` → `"Rất khẩn cấp"` |
| `orderStatusLabel(s)` | Nhãn trạng thái đơn đầy đủ | `shipping` → `"Đang giao"` |
| `orderStatusShort(s)` | Nhãn ngắn cho timeline | `shipping` → `"Đang giao"` |

**C++ mapping** (switch/enum → hàm trả chuỗi, `slice` → `substr`):

```cpp
using namespace std;
#include <string>
#include <algorithm>

string formatVND(int n) {
  // đơn giản hóa: thêm dấu phân cách nghìn (ví dụ thực cần locale)
  return to_string(n) + "đ";
}

string formatDateVN(const string& iso) {
  // "2026-10-13" -> "13/10/2026" (cắt thủ công, không lệch múi giờ)
  if (iso.size() < 10) return iso;
  return iso.substr(8,2) + "/" + iso.substr(5,2) + "/" + iso.substr(0,4);
}

string maskPhone(const string& phone) {
  // "0901234567" -> "090****567"
  if (phone.size() < 7) return phone;
  return phone.substr(0,3) + "****" + phone.substr(phone.size()-3);
}

string urgencyLabel(Urgency u) {
  switch (u) {
    case Urgency::Low: return "Thấp";
    case Urgency::Medium: return "Trung bình";
    case Urgency::High: return "Cao";
    case Urgency::Critical: return "Rất khẩn cấp";
  }
  return "?";
}

string orderStatusLabel(OrderStatus s) {
  switch (s) {
    case OrderStatus::Shipping: return "Đang giao";
    case OrderStatus::Received: return "Trạm đã nhận";
    // ... các case khác
  }
  return "?";
}
```

### 4.10 Bản đồ Việt Nam (geo.ts)

File: `src/lib/geo.ts`.

- Dữ liệu hình chính tỉnh (`ProvinceShape`): `polys` = mảng ring, mỗi ring = mảng `[lng, lat]`.
- Khung bao: `VN_BBOX = {102.1→117.9 lng, 6.9→23.4 lat}`.
- `project(lat, lng)` chiếu sang tọa độ SVG (`MAP_W = 150`, `MAP_H = 104.5`, stretch ngang 1.5× để đẹp UI).

**C++ mapping** (chiếu lat/lng → tọa độ SVG):

```cpp
using namespace std;

struct Point { double x, y; };

Point project(double lat, double lng) {
  const double minLng = 102.1, maxLng = 117.9;
  const double minLat = 6.9,  maxLat = 23.4;
  const double MAP_W = 150.0, MAP_H = 104.5;
  const double STRETCH_X = 1.5;

  double x = ((lng - minLng) / (maxLng - minLng)) * MAP_W * STRETCH_X;
  double y = ((maxLat - lat) / (maxLat - minLat)) * MAP_H;
  return {x, y};
}
```
- `polysToPath` sinh chuỗi path SVG (`M...L...Z`).
- `anchorOfLargest` đặt pin tại tâm bbox của polygon lớn nhất (tỉnh); `anchorOfAll` đặt chấm đảo (Hoàng Sa/Trường Sa).
- Có 2 eras: bản mới (34 tỉnh sau sáp nhập 2025) và bản cũ, dùng để hiển thị song song tên tỉnh mới/cũ trên `StationDetailPage`.

---

## 5. State management — Zustand store (useAppStore.ts)

File: `src/store/useAppStore.ts` (577 dòng, là "trái tim" của app).

**Cấu trúc store:**
- `stations`, `orders`, `products`, `carriers` — dữ liệu master (khởi tạo từ `data/*.ts`).
- `userRole`, `isLoggedIn`, `userName`, `verifyStatus`, `phoneRevealed`, `managedStationId` — phiên làm việc.
- `approvals` — hàng chờ duyệt tài khoản trạm/NPP.
- `filters` — bộ lọc trang chủ (province, itemId, urgency, maxKm, keyword).
- `wizard` — phác thảo đơn quyên góp (3 bước: chọn trạm/món → hình thức → xác nhận).
- `messages` — chat donor ↔ NPP (demo cùng máy, 2 phía thấy nhau, có câu trả lời tự động sau 900ms).
- `pendingSync` — đơn chờ đồng bộ khi offline.
- `dataSaver`, `offline` — cờ hiệu demo.
- `toasts` — thông báo tự dismiss sau 4s.

**Action quan trọng (the nhóm nghiệp vụ):**

| Nhóm | Action | Ý nghĩa |
|------|--------|---------|
| Đơn hàng | `createOrder`, `commitOrder`, `queueOfflineOrder`, `syncPending`, `advanceOrder`, `rejectOrder`, `confirmReceipt`, `returnOrder`, `setOrderCarrier` | Tạo, duyệt, chuyển bước, từ chối, xác nhận nhận, hoàn trả, gán đơn vị vận chuyển |
| Nhu cầu trạm | `incT`, `updateNeed`, `addNeed` | Cập nhật D/R/T/urgency, thêm mặt hàng mới |
| Hồ sơ trạm | `updateStationProfile`, `addServedArea`, `addProof`, `setManagedStation` | Sửa địa chỉ/giờ nhận, thêm khu vực phân phát, đăng minh chứng |
| NPP | `updateProduct` | Sửa giá/tồn khoh/khuyến mãi/freeship/ảnh/variant |
| Admin | `verifyStation`, `rejectStation`, `approveAccount`, `rejectAccount` | Duyệt/từ chối trạm và tài khoản |
| Auth | `quickLogin`, `registerDemo`, `logout`, `grantPhone` | Đăng nhập nhanh/demo, đăng ký, đăng xuất, hiện SĐT |
| UI | `pushToast`, `dismissToast`, `toggleDataSaver`, `toggleOffline`, `sendMessage`, `setFilters`, `setWizard`, `resetWizard` | Toast, chế độ tiết kiệm dữ liệu, offline, chat, bộ lọc, wizard |

**Lưu ý về persistence:** Auth và hàng chờ đơn được lưu vào `localStorage` (`reliefgrid-auth`, `reliefgrid-pending`, `reliefgrid-orderseq`, `reliefgrid-approved`, `reliefgrid-bank`). Các dữ liệu master (stations, products…) **không** persistence thay đổi — reload sẽ reset về dữ liệu demo ban đầu.

**Helper:** `stationById(stations, id)` — tra cứu trạm theo id.

---

## 6. Router & routing (router.tsx)

File: `src/router.tsx`.

Sử dụng `createBrowserRouter` từ `react-router-dom`, lazy-load mọi trang (`React.lazy` + `Suspense` fallback "Đang tải trang…").

| Path | Trang | Bảo vệ |
|------|-------|--------|
| `/` | `HomePage` (Layout) | Public |
| `/tram/:id` | `StationDetailPage` | Public |
| `/quyen-gop` | `DonateWizardPage` | Public |
| `/quyen-gop-cua-toi` | `MyDonationsPage` | Public |
| `/dang-nhap` | `AuthPage` | Public |
| `/tram-quan-ly` | `StationDashboardPage` | Public (nhưng nút thao tác cần role station + verified) |
| `/nha-phan-phoi` | `DistributorPage` | Public (nút thao tác cần distributor + verified) |
| `/van-chuyen` | `CarrierPage` | Public |
| `/thong-ke` | `StatsPage` | Public |
| `/admin/xac-minh` | `AdminVerifyPage` | `RequireAdmin` (chỉ admin) |
| `*` | 404 | — |

Mỗi lazy page được bọc bởi `withSuspense()` → fallback `PageFallback`.

---

## 7. Các trang và luồng giao dịch (chi tiết theo trang)

### 7.1 HomePage — Trang chủ

File: `src/pages/HomePage.tsx`.

- **Bộ lọc:** tỉnh, loại hàng, mức khẩn cấp, khoảng cách tối đa (slider 800–2000 km), từ khóa tìm kiếm (tên/địa chỉ/tên tỉnh mới+cũ/tên món).
- **Filtered stations:** chỉ hiện trạm thỏa mãn bộ lọc. Lọc theo `itemId` kiểm tra `calcS(n) > 0` (chỉ hiện trạm còn thiếu món đó).
- **Nhu cầu khẩn cấp hôm nay:** top 6 cần (`urgency === 'critical' || 'high'` và `S > 0`), sắp xếp theo `S` giảm dần.
- **Bản đồ:** `StationMap` hiển thị pin các trạm đã lọc.
- **StatusBar:** hiển thị thống kê nhanh (tổng đã nhận, đang thiếu…).

### 7.2 StationDetailPage — Chi tiết trạm

File: `src/pages/StationDetailPage.tsx`.

- Hiển thị thông tin trạm (tên, đơn vị, địa chỉ, giờ nhận, SĐT đã mask, verified badge, khoảng cách từ TP.HCM).
- Nếu `provinceOld !== province`: hiển thị địa chỉ cũ (trước sáp nhập).
- Bản đồ `VietnamBase` (era="new", 34 tỉnh) đặt pin tại `project(lat, lng)`.
- Danh sách nhu cầu từng mặt hàng (`NeedItem`) với progress bar 3 đoạn.
- Minh chứng (`proofs`): ảnh placeholder + tiêu đề + ngày.
- Khu vực đã hỗ trợ (`servedAreas`).
- Nút "Báo cáo sai lệch", "Liên hệ nhanh" (chỉ hiển thị toast, không gửi thật).

### 7.3 DonateWizardPage — Quyên góp (3 bước)

File: `src/pages/DonateWizardPage.tsx`. Đây là trang phức tạp nhất, chứa hầu hết business rule tạo đơn.

**Bước 0 — Chọn trạm & món:**
- Danh sách trạm còn cần (`openStations`): lọc `calcS(n) > 0 && !closed`, sắp xếp theo tổng `S` giảm dần. Trạm cần nhất nhất được badge "Cần hỗ trợ nhất".
- Link query params `?station=&item=` ghi đè vào wizard (query thắng store). Đổi trạm/món thì reset hình thức + sản phẩm + số lượng để không tính nhầm.
- Khi chọn trạm, hiển thị `needsOpen` (các món còn thiếu) với `ProgressBar3`.
- Nhập số lượng: tối đa là `S` của món đó. Nếu nhập vượt `S`:
  - Tính `surplusPlan = allocateSupply(stations, itemId, qty, stationId)`.
  - Nếu `canSplit` (tổng S đủ chứa, mỗi chân có qty > 0) → cho tạo nhiều đơn (chia theo phương án min-cost).
  - Nếu không đủ chứa → hiển thị `unmet`, yêu cầu giảm số lượng.
- **`canNext2`**: stationId && itemId && qty > 0 && ((!over && S > 0) || canSplit).

**Bước 1 — Chọn hình thức:**
- `self`: tự mang, hiện địa chỉ + giờ nhận, sinh QR.
- `carrier`: nhập địa chỉ lấy hàng, chọn `carrierId`, xem phí và ETA.
- `buy`: tìm sản phẩm (filter theo `itemId`), chọn `productId`, chọn `payMethod` (momo/zalopay/bank), xem tổng tiền (giá SP × qty + phí ship).
- Chat với nhà phân phối (đóng gói trong wizard, dùng `messages`/`sendMessage` từ store).
- **`canNext3`**: method đã chọn && (carrier phải chọn carrierId) && (buy phải chọn productId + payMethod).

**Bước 2 — Xác nhận & hoàn tất:**
- `submit()`:
  - Nếu `offline` → `queueOfflineOrder` cho mỗi chân đơn, vào `/quyen-gop-cua-toi`.
  - Nếu online → `createOrder` cho mỗi chân đơn (cùng hình thức), hiển thị mã đơn + QR (nếu self + đơn lẻ).
- Nếu chia nhiều đơn → thông báo "Đã chia X thành Y đơn (trạm bạn chọn nhận trước, phần dư chuyển tiếp sang trạm còn cần)".

### 7.4 MyDonationsPage — Đơn của tôi

File: `src/pages/MyDonationsPage.tsx`.

- Hiển thị `pendingSync` (đơn chờ đồng bộ) nếu có, nút "Đồng bộ ngay".
- Danh sách `orders` với timeline 5 bước (`created → confirmed → preparing → shipping → received`), số bước đã qua được tô xanh (`idx = FLOW.indexOf(status)`).
- Đơn `rejected`: hiện cảnh báo đỏ, không hiện timeline tiến trình.
- Đơn `self`: hiện mã QR (`QRCodeSVG`) để trạm quét.
- Đơn `received`: hiện ảnh minh chứng (`proofImg`).
- Nút "Demo: chuyển bước tiếp" (chỉ khi chưa received/rejected) gọi `advanceOrder`.

### 7.5 StationDashboardPage — Dashboard trạm

File: `src/pages/StationDashboardPage.tsx`.

- Chỉ `userRole === 'station'` mới thấy các nút thao tác (không thấy = ẩn hẳn).
- Nếu `verifyStatus !== 'verified'`: khóa hết, banner đỏ "chờ admin duyệt".
- Chọn trạm đang quản lý (`managedStationId`, mặc định `nghean-1`).
- **4 KPI:** nhu cầu đang mở, mặt hàng đã đủ, đơn đang vận chuyển, đã phân phát (tổng R).
- **Thông báo trạm:** nếu `S === 0 && !closed` → "đã đủ, hệ thống đã đóng"; nếu `S/D >= 50%` → "còn thiếu X%".
- **Đơn đang đến:** lọc `orders` cùng `stationId` và status khác received/rejected. Trạm có thể: "Duyệt đơn" (`advanceOrder`), "Từ chối" (`rejectOrder`), nhập số lượng thực nhận, "Xác nhận đã nhận" (`confirmReceipt`). Có phần note "Giao thiếu → phần còn thiếu được cập nhật".
- **Quét QR:** nhập mã đơn (VD: RG-1001), tìm đơn `self` của trạm này chưa received → `confirmReceipt`.
- **Nhu cầu:** chỉnh sửa `D` và `urgency` của mỗi mặt hàng, bấm "Đóng nhận"/"Mở lại" (`closed`), thêm mặt hàng mới (`addNeed`). Tất cả gắn `updateNeed`.
- **Hồ sơ:** sửa địa chỉ/giờ nhận/liên hệ/SĐT (`updateStationProfile`), thêm khu vực phân phát (`addServedArea`), đăng minh chứng (`addProof`).
- Nút "Demo: giả lập đơn mới đến" (`simulateIncoming`) tạo đơn ngẫu nhiên cho trạm, hiện toast realtime.

### 7.6 DistributorPage — Nhà phân phối

File: `src/pages/DistributorPage.tsx`.

- Chỉ `distributor` + `verified` mới thao tác được (rút tiền, lưu SP, xử lý đơn).
- **KPI:** doanh thu cứu trợ (mock + đơn buy thật), số đơn cứu trợ, sản phẩm sắp hết hàng (stock < 50), nút rút tiền.
- **Biểu đồ doanh thu:** 3 khoảng (hôm nay / 7 ngày / tháng). Nền mock `WEEK_REVENUE` + đơn buy thật cộng dồn.
- **Sản phẩm:** danh sách `products`, tìm kiếm theo tên/loại/khuyến mãi/variant. NPP chỉnh giá/tồn kho/khuyến mãi/ảnh/mã (`updateProduct`), bật/tắt freeship. Cảnh báo sắp hết hàng (stock < 50).
- **Khách hàng:** nhóm `buyOrders` theo `buyerName`, thống kê số đơn + tổng chi tiêu.
- **Đơn cứu trợ:** lọc `method === 'buy'`, hiển thị status, chọn đơn vị vận chuyển (`setOrderCarrier`), "Xác nhận/chuyển bước" (`advanceOrder`), "Hoàn trả" (`returnOrder` → về `created`, bỏ `carrierId`).
- **Tài khoản nhận tiền:** lưu `bankName` + `acc` vào `localStorage` key `reliefgrid-bank`. Rút tiền: hiện modal, toast "tiền về sau 1 ngày làm việc" (demo).
- **Chat:** nhắn cho khách (dùng `messages`/`sendMessage` store).

**Công thức lợi nhuận (demo):** `cost = 80% giá bán` (`COST_RATIO = 0.8`), `profit = sold × price × (1 - 0.8)`. `BASE_SOLD` là doanh số nền mock.

### 7.7 CarrierPage — Đơn vị vận chuyển

File: `src/pages/CarrierPage.tsx`.

- Hiển thị đơn cần giao: `orders` filter `method !== 'self'` và status khác received/rejected.
- Mỗi đơn: địa chỉ lấy hàng (kho NPP nếu buy, địa chỉ người gửi nếu carrier), địa chỉ giao (trạm), hàng + trọng lượng giả (`UNIT_KG` ví dụ nước=12kg/thùng), mã vận đơn.
- Nút "Đã lấy hàng": nếu `created/confirmed/preparing` → gọi `advanceOrder` 3 lần để nhảy thẳng sang `shipping` (không nhảy thẳng received).
- Nút "Đã giao hàng": nếu `shipping` → `advanceOrder` sang `received`, toast chờ trạm kiểm kê xác nhận.
- `done`: số đơn `method !== 'self'` và `status === 'received'`.

### 7.8 StatsPage — Thống kê tác động

File: `src/pages/StatsPage.tsx`.

- Tổng hợp toàn bộ `stations`: `R`, `T`, `coordinated = R + T`, số cần (`needCount`), số đã đủ (`doneCount`), tỷ lệ đáp ứng `doneCount/needCount × 100%`.
- `missingByItem`: tổng `S` theo từng mặt hàng → top 5 thiếu nhất.
- `provMap`: tổng `S` theo tỉnh → biểu đồ barra tỷ lệ so với tỉnh thiếu nhiều nhất.
- `areas`: số khu vực phân phát duy nhất.
- `receivedOrders`: số đơn `status === 'received'`.

### 7.9 AdminVerifyPage — Admin xác minh

File: `src/pages/AdminVerifyPage.tsx`. Chỉ admin (`RequireAdmin`).

3 tab:
1. **Duyệt trạm:** danh sách trạm `!verified`. Mỗi trạm có checklist chống trạm "ma" (3 mục: SĐT liên lạc được, giấy tờ hợp lệ, địa chỉ kho rõ ràng). Tick đủ 3 mới bấm "Duyệt" (`verifyStation` → `verified = true`). "Từ chối" cần lý do (`rejectStation` → xóa trạm khỏi danh sách).
2. **Duyệt đơn:** đơn `status === 'created'` (pendingOrders). Admin toàn quyền thấy mọi đơn mọi trạm. "Duyệt/chuyển bước" (`advanceOrder`), "Từ chối" (`rejectOrder`).
3. **Duyệt tài khoản:** `approvals` (đăng ký trạm/NPP chờ duyệt). "Duyệt" (`approveAccount` → lưu `role:name` vào `localStorage` verified, nếu đang đăng nhập thì mở khóa ngay), "Từ chối" (`rejectAccount` + lý do).

`MOCK_PAPERS`: giấy tờ giả lập cho 2 trạm chờ duyệt (`caobang-1`, `danang-1`).

### 7.10 AuthPage — Đăng ký / đăng nhập

File: `src/pages/AuthPage.tsx`.

- Chọn vai trò (station/donor/distributor).
- Form: tên hiển thị, SĐT, (station/distributor) minh chứng pháp lý.
- `registerDemo(role, name, proof, phone)`: station/distributor → pending (chờ duyệt), trừ khi tên đã từng được duyệt trước đó → verified luôn. Donor → dùng ngay.
- `quickLogin(role)`: đăng nhập nhanh demo, station/distributor → verified luôn, donor/admin → none.
- **Cổng admin nội bộ:** `?dev=<Mã>` → `checkDevCode` → `quickLogin('admin')` → vào `/admin/xac-minh`.
- Sau đăng nhập: chuyển hướng station → `/tram-quan-ly`, distributor → `/nha-phan-phoi`, donor → `/`.

---

## 8. Các thư viện tiện ích (components/ui & lib)

| File | Vai trò |
|------|---------|
| `lib/format.ts` | Format tiền, ngày, mask SĐT, label urgency/status |
| `lib/needLogic.ts` | Công thức S, trạng thái cần, progress segments, on-the-way label |
| `lib/suggest.ts` | Min-cost flow lite, score trạm, rank, alternatives |
| `lib/geo.ts` | Chiếu bản đồ, path SVG, anchor |
| `components/ui/ProgressBar3.tsx` | Thanh tiến độ 3 đoạn (R/T/rest) |
| `components/ui/Badges.tsx` | VerifiedBadge, UrgencyBadge |
| `components/ui/MaskedPhone.tsx` | Hiển thị SĐT đã mask |
| `components/ui/ItemIcon.tsx` | Render icon Lucide theo key của mặt hàng |
| `components/station/NeedItem.tsx` | Card hiển thị 1 StationNeed |
| `components/station/StationCard.tsx` | Card trạm trên trang chủ |
| `components/home/StationMap.tsx` | Bản đồ trạm |
| `components/home/VietnamMap.tsx` (VietnamBase) | Bản đồ Việt Nam cơ bản |
| `components/home/ProvinceReliefModal.tsx` | Modal chi tiết tỉnh |
| `components/home/FullMapModal.tsx` | Modal bản đồ toàn cảnh |
| `components/layout/Layout.tsx` + `Chrome.tsx` | Khung layout, header (status bar, toggle offline/data saver) |

---

## 9. Dữ liệu demo (data/)

| File | Nội dung |
|------|----------|
| `stations.ts` | 9 trạm cứu trợ (Lạng Sơn, Cao Bằng, Thái Nguyên, Nghệ An, Hà Tĩnh ×2, Quảng Trị/Quảng Bình, Huế, Đà Nẵng). Mỗi trạm 4-6 cần với D/R/T/urgency đa dạng, 2 trạm chưa verified (Cao Bằng, Đà Nẵng). `distanceKm` giả từ TP.HCM (900–1750 km). |
| `items.ts` | 8 mặt hàng: nước, mì, thuốc sát khuẩn, chăn màn, sữa trẻ em, đèn pin, đồ vệ sinh, tã. Mỗi cái: id, name, unit, icon (Lucide key), category. |
| `extras.ts` | 8 sản phẩm NPP (giá, stock, promo, freeship, variant), 3 đơn vị vận chuyển (phí/ETA), 4 đơn mẫu, HERO_STATS, USER_LOCATION = TP.HCM. |
| `provinces.ts` | Danh sách tỉnh mới (sau sáp nhập 2025) và tên cũ. |

**Lưu ý:** `distanceKm` là khoảng cách **giả** (demo), không tính từ GPS thật. Bản đồ vẽ từ `geo.ts` với tọa độ lat/lng ước lượng.

---

## 10. Kiểm thử (tests)

Thư mục `src/**/__tests__/` (Vitest):
- `suggest.test.ts` — kiểm thử `allocateSupply`, `computeCost`, `scoreStation`.
- `needLogic.test.ts` — kiểm thử `calcS`, `getNeedStatus`, `isLocked`, `progressSegments`, `onTheWayLabel`.
- `format.test.ts` — kiểm thử `maskPhone`, `formatVND`, `formatDateVN`, `urgencyLabel`, `statusLabel`, `orderStatusLabel`, `orderStatusShort`.
- `store.test.ts` — kiểm thử Zustand store actions.

**Quy tắc khi thêm tính năng mới:** Viết test cho hàm thuần (pure function) trong `lib/` trước, sau đó mới kết nối vào store/UI.

---

## 11. Cách mở rộng / thêm tính năng (hướng dẫn cho dev mới)

1. **Thêm loại mặt hàng mới:** Thêm vào `ITEMS` (`data/items.ts`) → tự động xuất hiện ở bộ lọc trang chủ, form thêm nhu cầu, danh sách sản phẩm NPP.
2. **Thêm trạng thái đơn mới:** Cập nhật `OrderStatus` (`models.ts`), `FLOW` (`MyDonationsPage`), `advanceOrder` (store), `orderStatusLabel`/`orderStatusShort` (`format.ts`).
3. **Thêm hình thức quyên góp mới:** Thêm vào `DonateMethod`, xử lý trong `commitOrder` (tracking code, trừ tồn hay không), bước 1 của wizard (`DonateWizardPage`).
4. **Kết nối backend thật:** Thay `useAppStore` bởi API calls (stations, orders, products…), xóa `localStorage` mock, đổi `config/dev.ts` thành auth thật, `checkDevCode` bỏ qua.
5. **Thêm bản đồ thật:** Thay `geo.ts` + `VietnamMap` bằng Mapbox/Google Maps, dùng `lat/lng` thực tế thay khoảng cách giả.

---

## 12. Glossary ( thuật ngữ dự án )

| Thuật ngữ | Nghĩa |
|-----------|-------|
| `S` | Còn thiếu = `max(0, D - R - T)` |
| `D` | Tổng nhu cầu của trạm cho 1 mặt hàng |
| `R` | Đã tiếp nhận (đã giao và trạm xác nhận) |
| `T` | Đang vận chuyển (đã tạo đơn nhưng trạm chưa xác nhận nhận) |
| `closed` | Trạm chủ động đóng nhận quyên góp mặt hàng này |
| `fulfilled` | Đã đủ hàng (`S === 0`) |
| `RG-XXXX` | Mã đơn quyên góp (sinh tự động, không trùng) |
| `TRK-XXXX` | Mã vận đơn demo (đơn carrier/buy) |
| `pendingSync` | Đơn tạo khi offline, chờ đồng bộ |
| `verified` | Trạm/NPP đã được admin duyệt |
| `sáp nhập 2025` | Hiệu chỉnh tên tỉnh (giữ tên cũ để tra cứu song song) |

---

## 13. Tóm luồng code khi tạo 1 đơn (từ UI đến store)

```
DonateWizardPage (bước 2, bấm "Xác nhận")
    → submit()
        → nếu offline: queueOfflineOrder × N chân đơn
        → nếu online: createOrder × N chân đơn
            → commitOrder(o)
                → sinh code RG-<seq> (duy nhất, localStorage)
                → incT(stationId, itemId, qty)   // T += qty, clamp theo S
                → nếu productId: stock -= qty    // NPP trừ tồn
                → orders.unshift(order)
                → pushToast thành công
            → nếu buy: trừ tồn kho NPP
    → UI hiển thị mã đơn + QR (nếu self)
```

Khi trạm nhận hàng (`StationDashboardPage`, bấm "Xác nhận đã nhận"):
```
confirmReceipt(stationId, itemId, receivedQty, orderId)
    → tDeduct = min(need.T, orderQty)
    → T -= tDeduct, R += receivedQty
    → totalDonations++, successOrders++
    → đơn status = received
    → nếu S về 0: toast "Đã đủ hàng — đóng nhận"
    → nếu giao thiếu: toast cảnh báo, phần còn thiếu tự mở lại
```

---

## 14. Cảnh báo & hạn chế (để dev mới không nhầm)

1. **Không có backend thật:** Tất cả dữ liệu nằm trong Zustand + `localStorage`. Refresh có thể reset dữ liệu master (stations, products) về demo ban đầu. Chỉ auth và hàng chờ đơn bền vững.
2. **Bảo mật chỉ demo:** `DEV_ADMIN_HASH` là hash đơn giản, đọc bundle là biết. Không dùng cho production thật.
3. **Khoảng cách & GPS giả:** `distanceKm` là số cứng trong `data/stations.ts`, không tính từ lat/lng thật.
4. **Ảnh là placeholder:** `imageUrl` dán tay, `proofImg` là chuỗi mô tả, không upload file thật.
5. **Chat là demo:** 2 phía thấy nhau trên cùng một máy, có câu trả lời tự động sau 900ms. Không phải WebSocket thật.

---

## 15. Thông tin tài liệu (lần cập nhật cuối)

| Mục | Nội dung |
|-----|----------|
| **Tài liệu** | `docs/DEV_KNOWLEDGE.md` |
| **Repo** | `relief-grid` |
| **Ngày cập nhật lần cuối** | 20/10/2026 |
| **Lúc** | (cập nhật trong ngày 20/10/2026) |
| **Nội dung chính** | Kiến thức kỹ thuật + business rule, kèm mapping TypeScript → C++ cho từng đoạn code |

*Tài liệu này viết dựa trên code tại `src/` của repo `relief-grid`. Nếu code thay đổi, hãy cập nhật lại file này và sửa ngày giờ ở bảng trên để giữ tính chính xác.* 
