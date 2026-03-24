import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { OnboardingPage } from './pages/OnboardingPage';
import { HomePage } from './pages/HomePage';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { TabBar } from './components/ui/TabBar';
import { useTrips } from './db/hooks';
import { checkAndNotify } from './lib/notifications';
import { checkStorageQuota } from './lib/storageCheck';

// Retry dynamic imports once with a full page reload on chunk load failure
// (happens after deploys when the service worker serves stale asset references)
function lazyWithRetry(factory: () => Promise<{ default: React.ComponentType }>) {
  return lazy(() =>
    factory().catch(() => {
      // Chunk failed to load — likely stale SW cache after a deploy.
      // Reload once; the flag prevents infinite reload loops.
      const key = 'readiLi.chunkReload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
      // If we already reloaded and it still fails, surface the error
      return factory();
    })
  );
}

const TripSetupPage = lazyWithRetry(() =>
  import('./pages/TripSetupPage').then(m => ({ default: m.TripSetupPage }))
);
const PackingListPage = lazyWithRetry(() =>
  import('./pages/PackingListPage').then(m => ({ default: m.PackingListPage }))
);
const StatsPage = lazyWithRetry(() =>
  import('./pages/StatsPage').then(m => ({ default: m.StatsPage }))
);

function TabBarWrapper() {
  const location = useLocation();
  const showTabBar = location.pathname === '/' || location.pathname === '/stats';
  if (!showTabBar) return null;
  return <TabBar />;
}

function PageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--background)]">
      <Loader2 size={24} className="animate-spin text-[var(--lavender)]" />
    </div>
  );
}

export function App() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    () => localStorage.getItem('hasSeenOnboarding') === 'true'
  );
  const [storageWarning, setStorageWarning] = useState(false);

  const trips = useTrips();

  // Check-on-open notifications
  useEffect(() => {
    if (hasSeenOnboarding && trips.length > 0) {
      checkAndNotify(trips);
    }
  }, [hasSeenOnboarding, trips]);

  // Clear chunk-reload flag on successful load
  useEffect(() => {
    sessionStorage.removeItem('readiLi.chunkReload');
  }, []);

  // Storage quota check
  useEffect(() => {
    checkStorageQuota().then(est => {
      if (est && est.usagePercent > 80) setStorageWarning(true);
    });
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
  };

  if (!hasSeenOnboarding) {
    return <OnboardingPage onComplete={handleOnboardingComplete} />;
  }

  return (
    <BrowserRouter basename="/readili-web">
      <ErrorBoundary>
        <div className="app-shell">
          {storageWarning && (
            <div className="bg-[var(--salmon)] text-white text-[13px] font-medium px-4 py-2 flex items-center gap-2 justify-center">
              <AlertTriangle size={14} /> Storage is almost full. Consider deleting old trips.
              <button onClick={() => setStorageWarning(false)} className="ml-2 underline text-[12px]">Dismiss</button>
            </div>
          )}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/setup" element={<TripSetupPage />} />
              <Route path="/trip/:id" element={<PackingListPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <TabBarWrapper />
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
