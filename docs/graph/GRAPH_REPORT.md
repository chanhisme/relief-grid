# Graph Report - relief-grid  (2026-10-20)

## Corpus Check
- 75 files · ~88,891 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 2 file(s) not represented in the graph (top: (none) 1, .css 1)

## Summary
- 560 nodes · 1340 edges · 22 communities (20 shown, 2 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 123 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Khung ứng dụng & thẻ trạm
- Logic nhu cầu & chia hàng dư
- Bản đồ & tra cứu tỉnh
- Dữ liệu mẫu & mô hình người dùng
- Báo cáo đồ thị (tài liệu tham chiếu)
- Gói phụ thuộc npm
- Bối cảnh dự án & mô hình kinh doanh
- Nhận diện thương hiệu (logo)
- Trình xem đồ thị Graphify
- Tổng quan kiến trúc & hướng dẫn
- Cấu hình TypeScript
- Vòng đời đơn hàng
- Luồng quyên góp & định tuyến
- Chế độ offline & hiệu năng
- Phân quyền & cổng admin
- Kế hoạch kiểm thử & tích hợp
- HTML app shell & font
- Quy ước code & phạm vi demo
- Ranh giới bảo mật demo
- Cấu hình deploy Vercel

## God Nodes (most connected - your core abstractions)
1. `useAppStore` - 50 edges
2. `calcS()` - 43 edges
3. `itemById()` - 26 edges
4. `AISC'26 Project Explanation Part II (Thuyet minh du an)` - 26 edges
5. `react` - 24 edges
6. `lucide-react` - 23 edges
7. `compilerOptions` - 17 edges
8. `ReliefGrid UI Demo Specification (docs/SPEC.md)` - 17 edges
9. `react-router-dom` - 16 edges
10. `allocateSupply()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Badge 'Trạm đã nhận hàng'` --conceptually_related_to--> `orderStatusLabel()`  [INFERRED]
  docs/(Ver 2026) Thuyet Minh Du An - AISC'26.pdf → src/lib/format.ts
- `Stylized R Monogram (ReliefGrid initial, grid-cut bowl)` --conceptually_related_to--> `calcS()`  [AMBIGUOUS]
  public/logo.jpg → src/lib/needLogic.ts
- `Mã đơn hàng / mã QR thay cho mã vận đơn` --conceptually_related_to--> `DonationOrder`  [INFERRED]
  docs/(Ver 2026) Thuyet Minh Du An - AISC'26.pdf → src/types/models.ts
- `Demo data example: Nghe An - Con Cuong station needs table` --references--> `StationCard()`  [EXTRACTED]
  docs/archify/NEED_LOGIC.md → src/components/station/StationCard.tsx
- `Reusable component groups (layout / ui / home / station)` --references--> `ProgressBar3()`  [EXTRACTED]
  docs/archify/STRUCTURE.md → src/components/ui/ProgressBar3.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **D/R/T/S shortage formula family (need - received - in-transit)** — agent_core_formula_s_drt, readme_drt_s_business_logic, docs_spec_drt_s_logic, docs_archify_need_logic_formula, docs_copy_of__ver_2026__thuyet_minh_du_an__aisc_26_tab1_sjr_formula, docs_copy_of__ver_2026__thuyet_minh_du_an__aisc_26_tab2_shortage_formula [EXTRACTED 1.00]
- **Donation flow from item selection to station receipt confirmation** — docs_archify_donation_flow_step1_select, docs_archify_donation_flow_step2_method, docs_archify_donation_flow_step3_create_order, docs_archify_donation_flow_step4_allocate_supply, docs_archify_donation_flow_step5_confirm_receipt, docs_archify_donation_flow_offline_pending_sync, docs_archify_order_lifecycle_state_diagram, docs_plan_10_8_2026_split_order_wizard, docs_demo_qa_demo_script [INFERRED 0.85]
- **Trust and verification layer for stations and accounts** — docs_copy_of__ver_2026__thuyet_minh_du_an__aisc_26_tab1_accountability, docs_copy_of__ver_2026__thuyet_minh_du_an__aisc_26_tab2_fake_station, docs_spec_admin_station_verification, docs_plan_10_8_2026_chat_offline, docs_archify_rbac_approval_flow, docs_archify_rbac_frontend_only_warning [INFERRED 0.85]
- **ReliefGrid Core Abstractions (God Nodes)** — src_store_useappstore_useappstore, src_lib_needlogic_calcs, src_data_items_itembyid, ref_react, tsconfig_compileroptions, ref_lucide_react, ref_react_router_dom, src_components_home_vietnammap_vietnambase, src_components_station_needitem_needitem, src_store_useappstore_appstate [EXTRACTED 1.00]
- **Cross-Community Bridge Hubs (High Betweenness)** — src_store_useappstore_useappstore, ref_react, ref_lucide_react [EXTRACTED 1.00]
- **Graphify Viewer Theme System (Light/Dark/System Persistence)** — docs_graph_graph_theme_init, docs_graph_graph_theme_key, docs_graph_graph_theme_pref, docs_graph_graph_apply_theme, docs_graph_graph_theme_toggle [EXTRACTED 1.00]
- **Các phương án cho donor xem minh chứng của trạm cứu trợ** — docs__ver_2026__thuyet_minh_du_an___aisc_26_station_evidence, docs__ver_2026__thuyet_minh_du_an___aisc_26_evidence_option_1_station_page, docs__ver_2026__thuyet_minh_du_an___aisc_26_evidence_option_2_batch_confirmation_photo, docs__ver_2026__thuyet_minh_du_an___aisc_26_donor, docs__ver_2026__thuyet_minh_du_an___aisc_26_relief_station [EXTRACTED 1.00]
- **Thông tin hiển thị trên màn thanh toán/đặt hàng** — docs__ver_2026__thuyet_minh_du_an___aisc_26_order_payment_section, docs__ver_2026__thuyet_minh_du_an___aisc_26_order_confirmation_screen, docs__ver_2026__thuyet_minh_du_an___aisc_26_supplier_selection, docs__ver_2026__thuyet_minh_du_an___aisc_26_payment_methods, docs__ver_2026__thuyet_minh_du_an___aisc_26_shipping_fee_eta, docs__ver_2026__thuyet_minh_du_an___aisc_26_order_total_summary, docs__ver_2026__thuyet_minh_du_an___aisc_26_station_receiving_address [EXTRACTED 1.00]
- **Hiển thị trạng thái đơn hàng 5 bước và lỗi nhãn bị cắt** — docs__ver_2026__thuyet_minh_du_an___aisc_26_order_status_timeline_5_steps, docs__ver_2026__thuyet_minh_du_an___aisc_26_order_status_stepper_bug, docs__ver_2026__thuyet_minh_du_an___aisc_26_station_received_badge, docs__ver_2026__thuyet_minh_du_an___aisc_26_order_code_rg_1007, docs__ver_2026__thuyet_minh_du_an___aisc_26_screenshot_donor_orders_page, src_pages_mydonationspage_flow, src_lib_format_orderstatusshort, src_lib_format_orderstatuslabel [INFERRED 0.85]
- **ReliefGrid Brand Identity System** — img_favicon, img_favicon_r_monogram, img_logo, img_logo_reliefgrid_wordmark, img_logo_brand_palette, img_logo_brand_design_principle [INFERRED 0.85]
- **Grid / Pixel Module Motif System** — img_logo_grid_motif, img_logo_pixel_cross_symbol, img_logo_grid_streak_swoosh, img_logo_grid_orange_text [INFERRED 0.85]
- **Humanitarian Care Symbol Set** — img_favicon_orange_heart, img_favicon_cradling_hand, img_logo_pixel_cross_symbol [INFERRED 0.75]
- **ReliefGrid Brand Mark System (monogram, wordmark, motifs, palette)** — public_logo, public_favicon, public_logo_r_monogram, public_logo_cupped_heart, public_logo_reliefgrid_wordmark, public_logo_pixel_grid_cross, public_logo_swoosh_tail, public_logo_brand_palette [EXTRACTED 1.00]
- **Brand Asset Deployment Across App Shell, Pages and Browser Tab** — public_logo, public_favicon, src_components_layout_chrome_header, src_pages_homepage_homepage, src_pages_authpage_authpage [EXTRACTED 1.00]
- **Logo Motifs Map Onto Domain Concepts (aid handover, station network, transport)** — public_logo_cupped_heart, public_logo_pixel_grid_cross, public_logo_swoosh_tail, src_data_stations_stations, src_lib_suggest_rankstationsforitem, src_data_extras_carriers [INFERRED 0.75]

## Communities (22 total, 2 thin omitted)

### Community 0 - "Khung ứng dụng & thẻ trạm"
Cohesion: 0.06
Nodes (56): Khung điều hướng donor (Quyên góp của tôi / Đơn của tôi / Online / Thoát), Mã đơn hàng / mã QR thay cho mã vận đơn, Module 'Vận chuyển', Module 'Trạm quản lý', Module 'Thống kê', Mock payment gateways + stock decrement + tracking code, Admin station verification page, react-router-dom (+48 more)

### Community 1 - "Logic nhu cầu & chia hàng dư"
Cohesion: 0.08
Nodes (52): Phương thức thanh toán (Momo / ZaloPay / ngân hàng), Step 4: allocateSupply split for over-S quantity, Demo data example: Nghe An - Con Cuong station needs table, S = max(0, D - R - T) in src/lib/needLogic.ts, ReliefGrid Need Logic (D/R/T/S), NeedStatus table (open/partial/fulfilled/closed), progressSegments 3-segment ratio (R/T/rest of D), Donation quantity limit vs S and split fallback (+44 more)

### Community 2 - "Bản đồ & tra cứu tỉnh"
Cohesion: 0.09
Nodes (50): Surprising Connections, FullMapModal(), ProvinceReliefModal(), StationRelief(), SuggestionRow(), topMissing(), StationMap(), clampView() (+42 more)

### Community 3 - "Dữ liệu mẫu & mô hình người dùng"
Cohesion: 0.08
Nodes (41): Người quyên góp (Donor), Module 'Mua sắm' (mua nhu yếu phẩm trực tuyến), Giao diện xác nhận đặt hàng (địa chỉ nhận, sản phẩm, số lượng, giá, phí ship, thời gian, tổng tiền), Phần thanh toán đơn hàng (cần đầy đủ thông tin đơn), Tổng tiền của đơn hàng, Trạm cứu trợ (Relief Station), Review notes: Sử dụng trên laptop (AISC'26 design review), Reviewer 'hz' (góp ý review giao diện) (+33 more)

### Community 4 - "Báo cáo đồ thị (tài liệu tham chiếu)"
Cohesion: 0.10
Nodes (40): Community: Ban do va tram cuu tro, Community: Bien moi truong Vite, Community: Card tram va nhan trang thai, Community: Cau hinh PostCSS, Community: Cau hinh Tailwind, Community: Cau hinh trien khai Vercel, Community: Cau hinh TypeScript, Community: Du lieu mock (+32 more)

### Community 5 - "Gói phụ thuộc npm"
Cohesion: 0.05
Nodes (40): Knowledge Gaps, dependencies, lucide-react, qrcode.react, react, react-dom, react-router-dom, zustand (+32 more)

### Community 6 - "Bối cảnh dự án & mô hình kinh doanh"
Cohesion: 0.09
Nodes (34): Accountability to the affected community (Sphere CHS), Solution advantages, Timestamped audit log of every need update, Business Model Canvas / Lean Canvas, Commercialization: SaaS, consulting, insurance, mixed funding, Four specific goals of the project, Solution limitations (data quality, gaming, real logistics), 'Need' as the central data unit of the system (+26 more)

### Community 7 - "Nhận diện thương hiệu (logo)"
Cohesion: 0.10
Nodes (26): ReliefGrid Favicon Icon (R Monogram), Cradling Hand (Aid Delivery Symbol), Orange Heart (Care Symbol), R Monogram Mark, Dynamic Swoosh Letterform Stroke, ReliefGrid Full Wordmark Logo, ReliefGrid Brand Palette (Blue + Orange), Grid / Pixel Module Motif (+18 more)

### Community 8 - "Trình xem đồ thị Graphify"
Cohesion: 0.12
Nodes (19): afterDrawing Hyperedge Region Renderer, applyTheme(pref), convexHull(pts), edgesDS vis.DataSet, esc() HTML-Escape Helper, focusNode(nodeId), forceAtlas2Based Physics Solver, Graphify Interactive Graph Viewer (+11 more)

### Community 9 - "Tổng quan kiến trúc & hướng dẫn"
Cohesion: 0.13
Nodes (18): ReliefGrid Agent Guide (AGENT.md), Stack: React + Vite + TypeScript + Tailwind + react-router + zustand + lucide-react, ReliefGrid Architecture Overview, Mock data layer src/data (9 stations, 8 items, 4 sample orders), Tech stack table with per-tool role, Vietnam map data modules (vnProvinces63/34), Single zustand store as state center, Key reminders: no backend, demo RBAC, build gate (+10 more)

### Community 10 - "Cấu hình TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+9 more)

### Community 11 - "Vòng đời đơn hàng"
Cohesion: 0.14
Nodes (15): Chế độ 'Tiết kiệm DL Tắt' (offline) trên laptop, Đơn mẫu RG-1007 (Trạm Nghệ An → Con Cuống, vận chuyển), Timeline trạng thái đơn 5 bước (Đã, Đã, Đang, Đang, Trạm), Screenshot: trang 'Quyên góp của tôi' với timeline 5 bước và badge trạm đã nhận, Badge 'Trạm đã nhận hàng', confirmReceipt effects on R, T and S, Offline order placeholder code CHO-ONLINE, Order code RG-1005 sequence persisted in localStorage (+7 more)

### Community 12 - "Luồng quyên góp & định tuyến"
Cohesion: 0.15
Nodes (15): Route table (10 routes incl. admin guard and 404), ReliefGrid Donation Flow, Step 1: select station and item (calcS > 0, not closed), Step 2: choose donation method (self/carrier/buy), Step 3: createOrder / commitOrder (order code, incT, stock decrement), Step 5: station confirmReceipt (R+=qty, T-=qty, order received), RBAC code map (models / store / router RequireAdmin / Chrome nav), Volunteer (MTQ) fast send workflow and station suggestions (+7 more)

### Community 13 - "Chế độ offline & hiệu năng"
Cohesion: 0.20
Nodes (13): Offline order parked in pendingSync with no code and no T increase, Fake station fraud risk and verification mechanism, Anticipated judge Q&A set, Real-time oversupply with three concurrent donors, Post-disaster sustainability model, Weak network / offline mode for disaster users, Data saver check: hide .ds-media, disable shadow/animation, 5-minute demo script (donor -> station -> NPP -> carrier -> admin) (+5 more)

### Community 14 - "Phân quyền & cổng admin"
Cohesion: 0.21
Nodes (11): Admin code stored as djb2 hash in src/config/dev.ts, Admin secret login mechanism via dev URL code, Station/Distributor account approval flow (pending -> verified), Five roles: donor / station / distributor / admin / null, ReliefGrid Role-Based Access Control, Secret admin login URL /dang-nhap?dev=<CODE>, localStorage auth persistence (reliefgrid-auth), Pending station/distributor account feature lock + red banner (+3 more)

### Community 15 - "Kế hoạch kiểm thử & tích hợp"
Cohesion: 0.31
Nodes (9): Acceptance criteria for release, Carrier API integration (Website -> API -> carrier system), Data authentication and in-transit goods handling, Two delivery methods: self-delivery with order code/QR, or linked carrier, Project differentiation points, AISC'26 project explanation notes (tab 2): solution, testing, Q&A, Survey of 268 donors with 245 valid responses, Four-stage testing roadmap (UI/UX, functions, performance, UAT) (+1 more)

### Community 16 - "HTML app shell & font"
Cohesion: 0.29
Nodes (8): ReliefGrid Page Metadata, ReliefGrid HTML App Shell, Be Vietnam Pro Webfont, Favicon Link, /src/main.tsx Module Entry, #root React Mount Div, Theme Color #1e3a8a, Vietnamese-First Localization

### Community 17 - "Quy ước code & phạm vi demo"
Cohesion: 0.29
Nodes (4): Naming conventions: kebab-case files, PascalCase components, Distributor: product catalog, customers, revenue, withdrawal, Plan 10/8/2026 - covering AISC'26 doc requirements, Vitest unit test suite (needLogic 11 / suggest 10 / store 7)

### Community 18 - "Ranh giới bảo mật demo"
Cohesion: 0.29
Nodes (3): Sensitive data protection (phone, address, XSS/SQLi), Traffic spike handling and load testing question, Phone masking 090****123 revealed only after login

### Community 19 - "Cấu hình deploy Vercel"
Cohesion: 0.29
Nodes (6): buildCommand, framework, installCommand, outputDirectory, rewrites, $schema

## Ambiguous Edges - Review These
- `calcS()` → `Stylized R Monogram (ReliefGrid initial, grid-cut bowl)`  [AMBIGUOUS]
  public/logo.jpg · relation: conceptually_related_to

## Knowledge Gaps
- **37 isolated node(s):** `@types/react`, `@types/react-dom`, `autoprefixer`, `postcss`, `tailwindcss` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 121 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `calcS()` connect `Logic nhu cầu & chia hàng dư` to `Khung ứng dụng & thẻ trạm`, `Bản đồ & tra cứu tỉnh`, `Dữ liệu mẫu & mô hình người dùng`, `Báo cáo đồ thị (tài liệu tham chiếu)`, `Nhận diện thương hiệu (logo)`, `Tổng quan kiến trúc & hướng dẫn`, `Luồng quyên góp & định tuyến`, `Quy ước code & phạm vi demo`?**
  _High betweenness centrality (0.207) - this node is a cross-community bridge._
- **What connects `@types/react`, `@types/react-dom`, `autoprefixer` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Khung ứng dụng & thẻ trạm` be split into smaller, more focused modules?**
  _Cohesion score 0.061621621621621624 - nodes in this community are weakly interconnected._
- **Why does `useAppStore` connect `Báo cáo đồ thị (tài liệu tham chiếu)` to `Khung ứng dụng & thẻ trạm`, `Logic nhu cầu & chia hàng dư`, `Bản đồ & tra cứu tỉnh`, `Dữ liệu mẫu & mô hình người dùng`, `Nhận diện thương hiệu (logo)`, `Vòng đời đơn hàng`, `Luồng quyên góp & định tuyến`?**
  _High betweenness centrality (0.145) - this node is a cross-community bridge._
- **Should `Logic nhu cầu & chia hàng dư` be split into smaller, more focused modules?**
  _Cohesion score 0.07923497267759563 - nodes in this community are weakly interconnected._
- **Why does `God Nodes (Core Abstractions)` connect `Báo cáo đồ thị (tài liệu tham chiếu)` to `Khung ứng dụng & thẻ trạm`, `Logic nhu cầu & chia hàng dư`, `Bản đồ & tra cứu tỉnh`, `Dữ liệu mẫu & mô hình người dùng`, `Trình xem đồ thị Graphify`, `Cấu hình TypeScript`?**
  _High betweenness centrality (0.144) - this node is a cross-community bridge._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `calcS()` and `Stylized R Monogram (ReliefGrid initial, grid-cut bowl)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._