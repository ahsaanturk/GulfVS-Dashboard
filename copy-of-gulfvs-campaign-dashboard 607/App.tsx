
import React, { useState, useEffect, useMemo } from 'react';
import { Page, Company, EmailLog, DashboardMetrics, UserAccount, EmailType } from './types';
import { db } from './db';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/Dashboard';
import CompaniesPage from './pages/Companies';
import LogsPage from './pages/Logs';
import AnalyticsPage from './pages/Analytics';
import ActionsPage from './pages/Actions';
import ImportExportPage from './pages/ImportExport';
import CompanyModal from './components/CompanyModal';
import LogModal from './components/LogModal';
import ConfirmModal from './components/ConfirmModal';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserAccount>('NehmatU');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>();
  const [prefillLog, setPrefillLog] = useState<{ companyId: string; email: string; sourceLogId?: string; emailType?: EmailType } | undefined>();
  
  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    refreshData();
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) setIsDarkMode(true);
  }, []);

  useEffect(() => {
    isDarkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [currentPage]);

  const refreshData = async () => {
    await db.init();
    const c = await db.getCompanies();
    const l = await db.getLogs();
    setCompanies(c);
    setLogs(l);
  };

  const metrics = useMemo<DashboardMetrics>(() => {
    const now = new Date();
    const todayStart = new Date(now.setHours(0,0,0,0)).getTime();
    const weekAgo = todayStart - (7 * 24 * 60 * 60 * 1000);

    const emailsToday = logs.filter(l => l.dateSent >= todayStart).length;
    const emailsWeek = logs.filter(l => l.dateSent >= weekAgo).length;
    
    const upcomingFollowUps = logs.filter(l => l.followUpDate && l.followUpDate > Date.now() && !l.completed).length;
    const followUpsToday = logs.filter(l => {
      if (!l.followUpDate || l.completed) return false;
      const d = new Date(l.followUpDate).setHours(0,0,0,0);
      return d === todayStart;
    }).length;
    const overdueFollowUps = logs.filter(l => l.followUpDate && l.followUpDate < todayStart && !l.completed).length;

    const contactedIds = new Set(logs.map(l => l.companyId));
    const totalContacted = contactedIds.size;
    const interestedCount = companies.filter(c => c.isInterested && contactedIds.has(c.id)).length;
    const responseRate = totalContacted > 0 ? Math.round((interestedCount / totalContacted) * 100) : 0;

    return {
      totalCompanies: companies.length,
      emailsToday,
      emailsWeek,
      emailsMonth: logs.length, 
      upcomingFollowUps,
      followUpsToday,
      overdueFollowUps,
      responseRate
    };
  }, [companies, logs]);

  const handleResetData = () => {
    setConfirmConfig({
      isOpen: true,
      title: "Reset Environment",
      message: "This will wipe all local data and restore the original project state. This action cannot be undone.",
      onConfirm: async () => {
        localStorage.clear();
        window.location.reload();
      }
    });
  };

  const openLogModal = (prefill?: { companyId: string; email: string; sourceLogId?: string; emailType?: EmailType }) => {
    setPrefillLog(prefill);
    setIsLogModalOpen(true);
  };

  const triggerDeleteCompany = (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Purge Entity",
      message: `Are you sure you want to remove "${name}"? This will execute a cascading delete, permanently removing all associated logs and interaction history from the vault.`,
      onConfirm: async () => {
        await db.deleteCompany(id);
        refreshData();
      }
    });
  };

  const triggerDeleteLog = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Remove Entry",
      message: "Are you sure you want to remove this specific entry from the audit trail? This will not affect the target contact's overall status.",
      onConfirm: async () => {
        await db.deleteLog(id);
        refreshData();
      }
    });
  };

  const renderPage = () => {
    const commonProps = { searchQuery };
    switch (currentPage) {
      case Page.Dashboard:
        return <DashboardPage {...commonProps} metrics={metrics} logs={logs} companies={companies} onAddLog={() => openLogModal()} onAddCompany={() => setIsCompanyModalOpen(true)} />;
      case Page.Companies:
        return <CompaniesPage {...commonProps} companies={companies} onRefresh={refreshData} onEdit={(c) => { setEditingCompany(c); setIsCompanyModalOpen(true); }} onDelete={triggerDeleteCompany} />;
      case Page.Logs:
        return <LogsPage {...commonProps} logs={logs} companies={companies} onRefresh={refreshData} onDelete={triggerDeleteLog} />;
      case Page.Analytics:
        return <AnalyticsPage metrics={metrics} logs={logs} />;
      case Page.Actions:
        return <ActionsPage companies={companies} logs={logs} onRefresh={refreshData} onFollowUp={openLogModal} />;
      case Page.ImportExport:
        return <ImportExportPage companies={companies} logs={logs} />;
      default:
        return <DashboardPage {...commonProps} metrics={metrics} logs={logs} companies={companies} onAddLog={() => openLogModal()} onAddCompany={() => setIsCompanyModalOpen(true)} />;
    }
  };

  const todayNotifs = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    return logs.filter(l => l.followUpDate && !l.completed && new Date(l.followUpDate).setHours(0,0,0,0) === today);
  }, [logs]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#020617] transition-colors selection:bg-accent/30 font-sans">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isOpen={isSidebarOpen}
        currentPage={currentPage} 
        onPageChange={setCurrentPage} 
        onReset={handleResetData}
        user={user}
        onUserToggle={() => setUser(u => u === 'NehmatU' ? 'MateenU' : 'NehmatU')}
        stats={{ companies: companies.length, logs: logs.length }}
      />
      
      <div className="flex-1 flex flex-col md:ml-72 relative w-full overflow-hidden">
        <Header 
          isDarkMode={isDarkMode} 
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onAddCompany={() => setIsCompanyModalOpen(true)}
          onAddLog={openLogModal}
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          notifications={todayNotifs}
          companies={companies}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="p-4 md:p-8 lg:p-12 mt-20 flex-1 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

      {isCompanyModalOpen && (
        <CompanyModal 
          isOpen 
          onClose={() => { setIsCompanyModalOpen(false); setEditingCompany(undefined); }} 
          onSave={refreshData} 
          editingCompany={editingCompany} 
        />
      )}
      {isLogModalOpen && (
        <LogModal 
          isOpen 
          onClose={() => { setIsLogModalOpen(false); setPrefillLog(undefined); }} 
          onSave={refreshData} 
          companies={companies} 
          initialPrefill={prefillLog}
        />
      )}
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig(p => ({ ...p, isOpen: false }))}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
      />
    </div>
  );
};

export default App;
