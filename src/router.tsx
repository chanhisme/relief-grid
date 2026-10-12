import { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { useAppStore } from './store/useAppStore';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const StationDetailPage = lazy(() => import('./pages/StationDetailPage').then((m) => ({ default: m.StationDetailPage })));
const DonateWizardPage = lazy(() => import('./pages/DonateWizardPage').then((m) => ({ default: m.DonateWizardPage })));
const MyDonationsPage = lazy(() => import('./pages/MyDonationsPage').then((m) => ({ default: m.MyDonationsPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const StationDashboardPage = lazy(() => import('./pages/StationDashboardPage').then((m) => ({ default: m.StationDashboardPage })));
const DistributorPage = lazy(() => import('./pages/DistributorPage').then((m) => ({ default: m.DistributorPage })));
const CarrierPage = lazy(() => import('./pages/CarrierPage').then((m) => ({ default: m.CarrierPage })));
const StatsPage = lazy(() => import('./pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const AdminVerifyPage = lazy(() => import('./pages/AdminVerifyPage').then((m) => ({ default: m.AdminVerifyPage })));

function PageFallback() {
  return <div className="py-10 text-center text-sm text-slate-500">Đang tải trang…</div>;
}

function withSuspense(el: React.ReactElement) {
  return <Suspense fallback={<PageFallback />}>{el}</Suspense>;
}

/** Guard: chỉ admin được vào trang admin, còn lại đá về trang chủ */
function RequireAdmin({ children }: { children: React.ReactElement }) {
  const userRole = useAppStore((s) => s.userRole);
  if (userRole !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: 'tram/:id', element: withSuspense(<StationDetailPage />) },
      { path: 'quyen-gop', element: withSuspense(<DonateWizardPage />) },
      { path: 'quyen-gop-cua-toi', element: withSuspense(<MyDonationsPage />) },
      { path: 'dang-nhap', element: withSuspense(<AuthPage />) },
      { path: 'tram-quan-ly', element: withSuspense(<StationDashboardPage />) },
      { path: 'nha-phan-phoi', element: withSuspense(<DistributorPage />) },
      { path: 'van-chuyen', element: withSuspense(<CarrierPage />) },
      { path: 'thong-ke', element: withSuspense(<StatsPage />) },
      { path: 'admin/xac-minh', element: <RequireAdmin>{withSuspense(<AdminVerifyPage />)}</RequireAdmin> },
      { path: '*', element: <div className="py-10">404 — quay lại <a href="/" className="underline">trang chủ</a>.</div> },
    ],
  },
]);
