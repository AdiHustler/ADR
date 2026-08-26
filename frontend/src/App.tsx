import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NewReport } from './pages/NewReport';
import { ReportList } from './pages/ReportList';
import { ReportDetail } from './pages/ReportDetail';
import { Analytics } from './pages/Analytics';
import { Login } from './pages/Login';

const MainLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeReportId, setActiveReportId] = useState<number | null>(null);

  const handleNavigate = (page: string, param?: any) => {
    if (page === 'report-detail' && typeof param === 'number') {
      setActiveReportId(param);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated || currentPage === 'login') {
    return <Login onSuccess={() => setCurrentPage('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} />

      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentPage === 'new-report' && <NewReport onNavigate={handleNavigate} />}
          {currentPage === 'reports-list' && <ReportList onNavigate={handleNavigate} />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'report-detail' && activeReportId && (
            <ReportDetail reportId={activeReportId} onNavigate={handleNavigate} />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
