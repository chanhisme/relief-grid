import { Outlet } from 'react-router-dom';
import { Header, Footer, Toasts } from './Chrome';
import { useAppStore } from '../../store/useAppStore';

export function Layout() {
  const dataSaver = useAppStore((s) => s.dataSaver);
  return (
    <div className={`min-h-screen ${dataSaver ? 'datasaver' : ''}`}>
      <Header />
      <main className="mx-auto max-w-6xl px-3 sm:px-4">
        <Outlet />
      </main>
      <Footer />
      <Toasts />
    </div>
  );
}
