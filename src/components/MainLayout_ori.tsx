import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { CategoryManagerView } from './CategoryManagerView';
import { KasbonManager } from './KasbonManager';
import { Charts } from './Charts';
import { Settings } from './Settings';
import { ErrorBoundary } from './ErrorBoundary';

export function MainLayout() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleViewChange = (view: string) => {
    setIsTransitioning(true);
    setCurrentView(view);
    setTimeout(() => setIsTransitioning(false), 100);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        );
      case 'categories':
        return (
          <ErrorBoundary>
            <CategoryManagerView />
          </ErrorBoundary>
        );
      case 'kasbon':
        return (
          <ErrorBoundary>
            <KasbonManager />
          </ErrorBoundary>
        );
      case 'reports':
        return (
          <ErrorBoundary>
            <Charts />
          </ErrorBoundary>
        );
      case 'settings':
        return (
          <ErrorBoundary>
            <Settings />
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:pt-8 pt-20">
          {isTransitioning ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">Memuat...</p>
              </div>
            </div>
          ) : (
            renderView()
          )}
        </div>
      </main>
    </div>
  );
}
