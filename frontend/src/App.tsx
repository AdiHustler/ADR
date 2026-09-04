import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { NewReport } from './pages/NewReport';
import { ReportList } from './pages/ReportList';
import { ReportDetail } from './pages/ReportDetail';
import { Analytics } from './pages/Analytics';
import { KnowledgeBase } from './pages/KnowledgeBase';
import { ComplianceHub } from './pages/ComplianceHub';
import { AboutTeam } from './pages/AboutTeam';
import { AdminConsole } from './pages/AdminConsole';
import { Login } from './pages/Login';
import { AIChatDrawer } from './components/AIChatDrawer';
import { Bot } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const isAdmin = !!(user?.is_admin || user?.username === 'dr_sharma' || user?.role?.includes('Admin') || user?.role?.includes('Chief Medical Officer'));
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [activeReportId, setActiveReportId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <Navbar 
        onNavigate={handleNavigate} 
        currentPage={currentPage} 
        onOpenChat={() => setIsChatOpen(true)}
      />

      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto">
          {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
          {currentPage === 'admin-console' && (isAdmin ? <AdminConsole onNavigate={handleNavigate} /> : <Dashboard onNavigate={handleNavigate} />)}
          {currentPage === 'new-report' && <NewReport onNavigate={handleNavigate} />}
          {currentPage === 'reports-list' && <ReportList onNavigate={handleNavigate} />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'knowledge-base' && <KnowledgeBase onNavigate={handleNavigate} />}
          {currentPage === 'compliance' && <ComplianceHub onNavigate={handleNavigate} />}
          {currentPage === 'about' && <AboutTeam />}
          {currentPage === 'report-detail' && activeReportId && (
            <ReportDetail reportId={activeReportId} onNavigate={handleNavigate} />
          )}
        </main>
      </div>

      {/* Floating AI Clinical Copilot Trigger Button */}
      <div className="fixed bottom-5 right-5 z-30">
        <button
          onClick={() => setIsChatOpen(true)}
          className="group flex items-center space-x-2.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-4 py-3 rounded-2xl shadow-xl shadow-teal-900/30 hover:scale-[1.03] transition-all border border-white/20"
          title="Open AI Pharmacovigilance Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-teal-700"></span>
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-black block leading-none">AI Copilot</span>
            <span className="text-[10px] text-teal-100 font-medium">Voice Enabled</span>
          </div>
        </button>
      </div>

      {/* Global AI Chat Drawer */}
      <AIChatDrawer 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />

      <Footer />
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
