import { create } from 'zustand';
import type {
  DonationOrder, Filters, Role, Station, Toast, WizardDraft, Urgency, Product,
  AccountApproval,
} from '../types/models';
import { STATIONS } from '../data/stations';
import { SAMPLE_ORDERS, PRODUCTS, CARRIERS } from '../data/extras';
import type { Carrier } from '../types/models';
import { calcS } from '../lib/needLogic';

let toastId = 1;
let orderSeq = 1005;

const AUTH_KEY = 'reliefgrid-auth';
// Nhớ đăng nhập (demo, tự xưng vai trò — chưa phải xác thực thật, cần DB+backend mới thật)
function persistAuth(s: { userRole: Role; userName: string; verifyStatus: string }) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ userRole: s.userRole, userName: s.userName, verifyStatus: s.verifyStatus }));
  } catch {
    /* bỏ qua */
  }
}
function restoreAuth(): { userRole: Role; userName: string; isLoggedIn: boolean; verifyStatus: 'none' | 'pending' | 'verified' } {
  const empty = { userRole: null as Role, userName: '', isLoggedIn: false, verifyStatus: 'none' as const };
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return empty;
    const p = JSON.parse(raw) as { userRole: Role; userName: string; verifyStatus?: string };
    if (!p.userRole) return empty;
    const vs = p.verifyStatus === 'pending' || p.verifyStatus === 'verified' ? p.verifyStatus : 'none';
    return { userRole: p.userRole, userName: p.userName ?? '', isLoggedIn: true, verifyStatus: vs };
  } catch {
    return empty;
  }
}
const savedAuth = restoreAuth();

interface AppState {
  stations: Station[];
  orders: DonationOrder[];
  products: Product[];
  carriers: Carrier[];

  userRole: Role;
  isLoggedIn: boolean;
  phoneRevealed: boolean;
  userName: string;
  managedStationId: string;
  verifyStatus: 'none' | 'pending' | 'verified';
  /** Hàng chờ admin duyệt tài khoản Trạm/NPP (demo, thay cho DB) */
  approvals: AccountApproval[];

  dataSaver: boolean;
  offline: boolean;
  toasts: Toast[];
  filters: Filters;
  wizard: WizardDraft;

  // actions
  incT: (stationId: string, itemId: string, qty: number) => void;
  createOrder: (o: Omit<DonationOrder, 'id' | 'code' | 'createdAt' | 'status'> & { status?: DonationOrder['status'] }) => DonationOrder;
  advanceOrder: (id: string) => void;
  /** Từ chối đơn (trạm/admin). Đơn rejected là trạng thái cuối, biến mất khỏi các list việc. */
  rejectOrder: (orderId: string) => void;
  /** Xác nhận đã nhận: R += thực nhận, T -= min(T, SL đơn), thiếu quay lại S. Đồng bộ sang C ngay vì cùng store. */
  confirmReceipt: (stationId: string, itemId: string, receivedQty: number, orderId?: string) => void;
  updateNeed: (stationId: string, itemId: string, patch: { D?: number; urgency?: Urgency; closed?: boolean }) => void;
  addNeed: (stationId: string, itemId: string, D: number, urgency: Urgency) => void;
  updateStationProfile: (stationId: string, patch: Partial<Pick<Station, 'address' | 'pickupHours' | 'contact' | 'phone'>>) => void;
  addServedArea: (stationId: string, area: string) => void;
  addProof: (stationId: string, title: string) => void;
  /** Nút demo: giả lập 1 đơn mới đang đến + toast realtime */
  simulateIncoming: (stationId: string) => void;
  setManagedStation: (id: string) => void;
  // Phase 3: Nhà phân phối — quản lý sản phẩm, đơn cứu trợ
  updateProduct: (id: string, patch: Partial<Pick<Product, 'price' | 'stock' | 'promo' | 'freeShip'>>) => void;
  setOrderCarrier: (orderId: string, carrierId: string) => void;
  returnOrder: (orderId: string) => void;
  // Phase 3: Admin — duyệt / từ chối trạm
  verifyStation: (id: string) => void;
  rejectStation: (id: string) => void;
  quickLogin: (role: Exclude<Role, null>) => void;
  registerDemo: (role: Exclude<Role, null>, name: string, proof?: string) => void;
  /** Admin duyệt / từ chối đơn xin tài khoản Trạm-NPP */
  approveAccount: (id: string) => void;
  rejectAccount: (id: string) => void;
  logout: () => void;
  grantPhone: () => void;
  toggleDataSaver: () => void;
  toggleOffline: () => void;
  pushToast: (msg: string, kind?: Toast['kind']) => void;
  dismissToast: (id: number) => void;
  setFilters: (p: Partial<Filters>) => void;
  setWizard: (p: Partial<WizardDraft>) => void;
  resetWizard: () => void;
}

const initialFilters: Filters = { province: 'all', itemId: 'all', urgency: 'all', maxKm: 2000, keyword: '' };

export const useAppStore = create<AppState>()((set, get) => ({
  stations: STATIONS,
  orders: SAMPLE_ORDERS,
  products: PRODUCTS,
  carriers: CARRIERS,

  userRole: savedAuth.userRole,
  isLoggedIn: savedAuth.isLoggedIn,
  phoneRevealed: false,
  userName: savedAuth.userName,
  managedStationId: 'nghean-1',
  verifyStatus: savedAuth.verifyStatus,
  approvals: [],

  dataSaver: false,
  offline: false,
  toasts: [],
  filters: initialFilters,
  wizard: {},

  incT: (stationId, itemId, qty) =>
    set((s) => ({
      stations: s.stations.map((st) =>
        st.id !== stationId
          ? st
          : {
              ...st,
              needs: st.needs.map((n) => {
                if (n.itemId !== itemId) return n;
                const room = calcS(n);
                const add = Math.max(0, Math.min(qty, room));
                if (add <= 0) return n;
                return { ...n, T: n.T + add };
              }),
            },
      ),
    })),

  createOrder: (o) => {
    const code = `RG-${orderSeq++}`;
    const order: DonationOrder = {
      ...o,
      id: `o-${code}`,
      code,
      createdAt: new Date().toISOString().slice(0, 10),
      status: o.status ?? 'created',
    };
    // Nghiệp vụ: thành công thì T tăng ngay (đã clamp theo S trong incT)
    get().incT(o.stationId, o.itemId, o.qty);
    set((s) => ({ orders: [order, ...s.orders] }));
    get().pushToast(`Tạo đơn ${code} thành công — T đã tăng`, 'success');
    return order;
  },

  advanceOrder: (id) =>
    set((s) => ({
      orders: s.orders.map((o) => {
        if (o.id !== id) return o;
        const next: Record<string, DonationOrder['status']> = {
          created: 'confirmed',
          confirmed: 'preparing',
          preparing: 'shipping',
          shipping: 'received',
          received: 'received',
          rejected: 'rejected',
        };
        return { ...o, status: next[o.status] };
      }),
    })),

  rejectOrder: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId);
    if (!o || o.status === 'received' || o.status === 'rejected') return;
    set((s) => ({
      orders: s.orders.map((x) => (x.id !== orderId ? x : { ...x, status: 'rejected' as const })),
    }));
    get().pushToast(`Đơn ${o.code} đã bị từ chối`, 'warn');
  },

  confirmReceipt: (stationId, itemId, receivedQty, orderId) => {
    const st = get().stations.find((x) => x.id === stationId);
    const need = st?.needs.find((n) => n.itemId === itemId);
    if (!st || !need) return;
    const qty = Math.max(0, Math.floor(Number(receivedQty) || 0));
    const orderQty = orderId ? get().orders.find((o) => o.id === orderId)?.qty ?? qty : qty;
    // T giảm theo SL đơn (không âm), R tăng theo thực nhận; giao thiếu → S tự mở lại
    const tDeduct = Math.min(need.T, orderQty > 0 ? orderQty : qty);
    const before = calcS(need);
    set((s) => ({
      stations: s.stations.map((x) =>
        x.id !== stationId
          ? x
          : {
              ...x,
              needs: x.needs.map((n) =>
                n.itemId !== itemId ? n : { ...n, T: Math.max(0, n.T - tDeduct), R: n.R + qty },
              ),
              totalDonations: x.totalDonations + 1,
              successOrders: x.successOrders + 1,
            },
      ),
      orders: orderId
        ? s.orders.map((o) =>
            o.id !== orderId ? o : { ...o, status: 'received' as const, proofImg: 'Ảnh xác nhận từ trạm (demo)' },
          )
        : s.orders,
    }));
    const after = get().stations.find((x) => x.id === stationId)?.needs.find((n) => n.itemId === itemId);
    if (after) {
      const sAfter = calcS(after);
      if (sAfter === 0 && before > 0) {
        get().pushToast('Đã đủ hàng — hệ thống đã đóng nhận quyên góp mặt hàng này', 'success');
      } else if (qty < orderQty) {
        get().pushToast(`Giao thiếu ${orderQty - qty} — phần thiếu đã quay lại S, nhu cầu mở lại`, 'warn');
      } else {
        get().pushToast(`Đã xác nhận nhận ${qty} (R tăng, T giảm)`, 'success');
      }
      if (sAfter > 0 && after.D > 0) {
        const pct = Math.round((sAfter / after.D) * 100);
        if (pct >= 50) get().pushToast(`Mặt hàng còn thiếu ${pct}%`, 'info');
      }
    }
  },

  updateNeed: (stationId, itemId, patch) =>
    set((s) => ({
      stations: s.stations.map((x) =>
        x.id !== stationId
          ? x
          : { ...x, needs: x.needs.map((n) => (n.itemId !== itemId ? n : { ...n, ...patch, D: Math.max(0, patch.D ?? n.D) })) },
      ),
    })),

  addNeed: (stationId, itemId, D, urgency) =>
    set((s) => ({
      stations: s.stations.map((x) => {
        if (x.id !== stationId) return x;
        if (x.needs.some((n) => n.itemId === itemId)) return x;
        return { ...x, needs: [...x.needs, { itemId, D, R: 0, T: 0, urgency }] };
      }),
    })),

  updateStationProfile: (stationId, patch) =>
    set((s) => ({
      stations: s.stations.map((x) => (x.id !== stationId ? x : { ...x, ...patch })),
    })),

  addServedArea: (stationId, area) => {
    const name = area.trim();
    if (!name) return;
    set((s) => ({
      stations: s.stations.map((x) =>
        x.id !== stationId || x.servedAreas.includes(name) ? x : { ...x, servedAreas: [...x.servedAreas, name] },
      ),
    }));
    get().pushToast(`Đã cập nhật khu vực phân phát: ${name}`, 'success');
  },

  addProof: (stationId, title) => {
    const t = title.trim();
    if (!t) return;
    set((s) => ({
      stations: s.stations.map((x) =>
        x.id !== stationId
          ? x
          : { ...x, proofs: [{ id: `pf-${Date.now()}`, title: t, date: new Date().toISOString().slice(0, 10), imageLabel: 'Ảnh minh chứng (demo)' }, ...x.proofs] },
      ),
    }));
    get().pushToast('Đã đăng minh chứng mới', 'success');
  },

  simulateIncoming: (stationId) => {
    const st = get().stations.find((x) => x.id === stationId);
    if (!st) return;
    const cand = st.needs.filter((n) => calcS(n) > 0 && !n.closed);
    const pick = cand.length > 0 ? cand[Math.floor(Math.random() * cand.length)] : st.needs[0];
    if (!pick) return;
    const qty = Math.max(5, Math.min(50, Math.floor(calcS(pick) / 3) || 10));
    get().createOrder({ stationId, itemId: pick.itemId, qty, method: 'carrier', carrierId: 'c1', status: 'shipping' });
    get().pushToast(`Realtime: đơn mới ${qty} đang đến ${st.name} — kiểm tra danh sách đơn!`, 'info');
  },

  setManagedStation: (id) => set({ managedStationId: id }),

  updateProduct: (id, patch) =>
    set((s) => ({
      products: s.products.map((p) => (p.id !== id ? p : { ...p, ...patch, price: Math.max(0, patch.price ?? p.price), stock: Math.max(0, patch.stock ?? p.stock) })),
    })),

  setOrderCarrier: (orderId, carrierId) => {
    set((s) => ({
      orders: s.orders.map((o) => (o.id !== orderId ? o : { ...o, carrierId })),
    }));
    get().pushToast('Đã gán đơn vị vận chuyển cho đơn', 'success');
  },

  returnOrder: (orderId) => {
    const o = get().orders.find((x) => x.id === orderId);
    if (!o || o.status === 'received' || o.status === 'rejected') return;
    set((s) => ({
      orders: s.orders.map((x) => (x.id !== orderId ? x : { ...x, status: 'created' as const, carrierId: undefined })),
    }));
    get().pushToast(`Đơn ${o.code} đã hoàn trả — chuyển về trạng thái Đã tạo`, 'warn');
  },

  verifyStation: (id) => {
    set((s) => ({
      stations: s.stations.map((x) => (x.id !== id ? x : { ...x, verified: true })),
    }));
    get().pushToast('Đã duyệt trạm — gắn huy hiệu Đã xác minh', 'success');
  },

  rejectStation: (id) => {
    const st = get().stations.find((x) => x.id === id);
    set((s) => ({ stations: s.stations.filter((x) => x.id !== id) }));
    get().pushToast(`Đã từ chối hồ sơ ${st?.name ?? id} (demo: gỡ khỏi danh sách)`, 'warn');
  },

  quickLogin: (role) => {
    const names: Record<string, string> = {
      station: 'Trạm Con Cuông (demo)',
      distributor: 'NPP Miền Trung (demo)',
      donor: 'Mạnh Thường Quân (demo)',
      admin: 'Quản trị viên (demo)',
    };
    // Đăng nhập nhanh = cửa dev/diễn nhanh -> coi như đã xác minh (kể cả NPP)
    set({
      userRole: role,
      isLoggedIn: true,
      userName: names[role] ?? `Tài khoản ${role} (demo)`,
      verifyStatus: role === 'donor' || role === 'admin' ? 'none' : 'verified',
    });
    persistAuth(get());
    get().pushToast(`Đã đăng nhập demo vai trò: ${role}`, 'info');
  },
  registerDemo: (role, name, proof = '') => {
    const display = name || 'Tài khoản demo';
    if (role === 'station' || role === 'distributor') {
      // Đăng ký Trạm/NPP: phải chờ admin duyệt. Tên nào đã duyệt trước đó -> verified luôn.
      let wasApproved = false;
      try {
        const raw = localStorage.getItem('reliefgrid-approved');
        const list = raw ? (JSON.parse(raw) as string[]) : [];
        wasApproved = list.includes(`${role}:${display}`);
      } catch {
        /* bỏ qua */
      }
      if (!wasApproved) {
        const dup = get().approvals.some((a) => a.name === display && a.role === role);
        if (!dup) {
          const entry: AccountApproval = {
            id: `ap-${Date.now()}`,
            name: display,
            role,
            proof,
            date: new Date().toISOString().slice(0, 10),
          };
          set((s) => ({ approvals: [...s.approvals, entry] }));
        }
      }
      set({
        userRole: role,
        isLoggedIn: true,
        userName: display,
        verifyStatus: wasApproved ? 'verified' : 'pending',
      });
      persistAuth(get());
      get().pushToast(
        wasApproved ? 'Tài khoản đã được duyệt trước đó — chào mừng trở lại!' : 'Đã gửi hồ sơ — tài khoản đang Chờ admin duyệt',
        wasApproved ? 'success' : 'warn',
      );
      return;
    }
    set({
      userRole: role,
      isLoggedIn: true,
      userName: display,
      verifyStatus: 'none',
    });
    persistAuth(get());
    get().pushToast(`Đã tạo tài khoản demo: ${role} (dùng ngay, không cần duyệt)`, 'success');
  },
  approveAccount: (id) => {
    const a = get().approvals.find((x) => x.id === id);
    if (!a) return;
    set((s) => ({ approvals: s.approvals.filter((x) => x.id !== id) }));
    // Ghi nhớ đã duyệt theo tên+role để lần đăng nhập sau thành verified
    try {
      const raw = localStorage.getItem('reliefgrid-approved');
      const list = raw ? (JSON.parse(raw) as string[]) : [];
      const key = `${a.role}:${a.name}`;
      if (!list.includes(key)) list.push(key);
      localStorage.setItem('reliefgrid-approved', JSON.stringify(list));
    } catch {
      /* bỏ qua */
    }
    // Nếu đúng tài khoản đang đăng nhập thì mở khóa ngay
    const s = get();
    if (s.isLoggedIn && s.userName === a.name && s.userRole === a.role) {
      set({ verifyStatus: 'verified' });
      persistAuth(get());
    }
    get().pushToast(`Đã duyệt tài khoản ${a.name} (${a.role})`, 'success');
  },
  rejectAccount: (id) => {
    const a = get().approvals.find((x) => x.id === id);
    if (!a) return;
    set((s) => ({ approvals: s.approvals.filter((x) => x.id !== id) }));
    get().pushToast(`Đã từ chối hồ sơ ${a.name}`, 'warn');
  },
  logout: () => {
    set({ userRole: null, isLoggedIn: false, phoneRevealed: false, userName: '', verifyStatus: 'none' });
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      /* bỏ qua */
    }
  },
  grantPhone: () => set({ phoneRevealed: true }),

  toggleDataSaver: () => set((s) => ({ dataSaver: !s.dataSaver })),
  toggleOffline: () => set((s) => ({ offline: !s.offline })),
  pushToast: (msg, kind = 'info') => {
    const id = toastId++;
    set((s) => ({ toasts: [...s.toasts, { id, msg, kind }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),
  setWizard: (p) => set((s) => ({ wizard: { ...s.wizard, ...p } })),
  resetWizard: () => set({ wizard: {} }),
}));

export function stationById(stations: Station[], id: string | undefined): Station | undefined {
  return stations.find((s) => s.id === id);
}
