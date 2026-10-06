import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { StationDetailPage } from './pages/StationDetailPage';
import { DonateWizardPage } from './pages/DonateWizardPage';
import { MyDonationsPage } from './pages/MyDonationsPage';
import { AuthPage } from './pages/AuthPage';
import { StationDashboardPage } from './pages/StationDashboardPage';
import { DistributorPage } from './pages/DistributorPage';
import { CarrierPage } from './pages/CarrierPage';
import { StatsPage } from './pages/StatsPage';
import { AdminVerifyPage } from './pages/AdminVerifyPage';
import { useAppStore } from './store/useAppStore';

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
      { index: true, element: <HomePage /> },
      { path: 'tram/:id', element: <StationDetailPage /> },
      { path: 'quyen-gop', element: <DonateWizardPage /> },
      { path: 'quyen-gop-cua-toi', element: <MyDonationsPage /> },
      { path: 'dang-nhap', element: <AuthPage /> },
      { path: 'tram-quan-ly', element: <StationDashboardPage /> },
      { path: 'nha-phan-phoi', element: <DistributorPage /> },
      { path: 'van-chuyen', element: <CarrierPage /> },
      { path: 'thong-ke', element: <StatsPage /> },
      { path: 'admin/xac-minh', element: <RequireAdmin><AdminVerifyPage /></RequireAdmin> },
      { path: '*', element: <div className="py-10">404 — quay lại <a href="/" className="underline">trang chủ</a>.</div> },
    ],
  },
]);
