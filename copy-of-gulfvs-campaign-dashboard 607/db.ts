
import { Company, EmailLog } from './types';
import { supabase } from './supabaseClient';

const STORAGE_KEY_COMPANIES = 'gulfvs_companies_v3';
const STORAGE_KEY_LOGS = 'gulfvs_logs_v3';
const STORAGE_KEY_INITIALIZED = 'gulfvs_initialized';

class DatabaseService {
  private companies: Company[] = [];
  private logs: EmailLog[] = [];
  private isSupabaseAvailable: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Don't call init here; it will be called manually in App.tsx
  }

  /**
   * Initialize database: fetch from Supabase, fallback to localStorage, then data.json
   */
  async init(): Promise<void> {
    // Prevent multiple concurrent initializations
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._performInit();
    return this.initPromise;
  }

  private async _performInit(): Promise<void> {
    try {
      // Try to fetch from Supabase first
      const [companiesRes, logsRes] = await Promise.all([
        supabase.from('companies').select('*').order('createdAt', { ascending: false }),
        supabase.from('logs').select('*').order('dateSent', { ascending: false })
      ]);

      if (!companiesRes.error && !logsRes.error) {
        this.companies = companiesRes.data || [];
        this.logs = logsRes.data || [];
        this.isSupabaseAvailable = true;
        localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');
        return;
      }
    } catch (e) {
      console.warn('Supabase unavailable, falling back to localStorage', e);
    }

    // Fallback: Load from localStorage
    const initialized = localStorage.getItem(STORAGE_KEY_INITIALIZED);
    const savedCompanies = localStorage.getItem(STORAGE_KEY_COMPANIES);
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);

    if (initialized && savedCompanies && savedLogs) {
      this.companies = JSON.parse(savedCompanies);
      this.logs = JSON.parse(savedLogs);
      return;
    }

    // Fallback: Load from data.json
    try {
      const response = await fetch('./data.json');
      if (response.ok) {
        const projectData = await response.json();
        this.companies = projectData.companies || [];
        this.logs = projectData.logs || [];
        this.save();
        localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');
      }
    } catch (e) {
      console.warn("Could not load data.json, starting empty", e);
    }
  }

  /**
   * Save to both localStorage and Supabase (if available)
   */
  private async save(): Promise<void> {
    // Always save to localStorage for offline support
    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(this.companies));
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
    localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');

    // Try to sync with Supabase if available
    if (this.isSupabaseAvailable) {
      try {
        // Use upsert to handle both inserts and updates
        await Promise.all([
          supabase.from('companies').upsert(this.companies, { onConflict: 'id' }),
          supabase.from('logs').upsert(this.logs, { onConflict: 'id' })
        ]);
      } catch (e) {
        console.warn('Failed to sync with Supabase:', e);
      }
    }
  }

  async importProjectData(data: { companies: Company[]; logs: EmailLog[] }): Promise<void> {
    if (!data.companies || !data.logs) throw new Error("Invalid project structure");
    this.companies = data.companies;
    this.logs = data.logs;
    await this.save();
  }

  async getCompanies(): Promise<Company[]> {
    if (this.companies.length === 0) await this.init();
    return [...this.companies].sort((a, b) => b.createdAt - a.createdAt);
  }

  async addCompany(company: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
    const newCompany: Company = {
      ...company,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    };
    this.companies.push(newCompany);
    await this.save();
    return newCompany;
  }

  async bulkAddCompanies(newItems: Omit<Company, 'id' | 'createdAt'>[]): Promise<{ added: number; skipped: number }> {
    let addedCount = 0;
    let skippedCount = 0;

    // High-performance Set-based lookup for O(1) comparison (in-memory cache)
    const existingNames = new Set(this.companies.map(c => c.companyName.toLowerCase().trim()));
    const existingEmails = new Set(this.companies.flatMap(c => c.emails.map(e => e.toLowerCase().trim())));

    // Check Supabase for duplicates if available (smart merging)
    if (this.isSupabaseAvailable) {
      try {
        const { data: supabaseCompanies, error } = await supabase
          .from('companies')
          .select('companyName, emails');
        
        if (!error && supabaseCompanies) {
          supabaseCompanies.forEach(c => {
            existingNames.add(c.companyName.toLowerCase().trim());
            (c.emails || []).forEach((e: string) => existingEmails.add(e.toLowerCase().trim()));
          });
        }
      } catch (e) {
        console.warn('Could not check Supabase for duplicates, continuing with local check', e);
      }
    }

    // Process in batches if necessary, but keep the core logic efficient
    for (const item of newItems) {
      const name = item.companyName.toLowerCase().trim();
      const itemEmails = item.emails.map(e => e.toLowerCase().trim());
      const hasDuplicateEmail = itemEmails.some(e => existingEmails.has(e));
      
      if (existingNames.has(name) || hasDuplicateEmail) {
        skippedCount++;
      } else {
        const company: Company = {
          ...item,
          id: crypto.randomUUID(),
          createdAt: Date.now()
        };
        this.companies.push(company);
        existingNames.add(name);
        itemEmails.forEach(e => existingEmails.add(e));
        addedCount++;
      }
    }

    if (addedCount > 0) await this.save();
    return { added: addedCount, skipped: skippedCount };
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<void> {
    this.companies = this.companies.map(c => c.id === id ? { ...c, ...updates } : c);
    await this.save();
  }

  async deleteCompany(id: string): Promise<void> {
    this.companies = this.companies.filter(c => c.id !== id);
    this.logs = this.logs.filter(l => l.companyId !== id);
    await this.save();
  }

  async getLogs(): Promise<EmailLog[]> {
    if (this.logs.length === 0) await this.init();
    return [...this.logs].sort((a, b) => b.dateSent - a.dateSent);
  }

  async addLog(log: Omit<EmailLog, 'id'>): Promise<EmailLog> {
    const newLog: EmailLog = { ...log, id: crypto.randomUUID() };
    if (log.emailType === 'Follow-up') {
      this.logs = this.logs.map(l => 
        l.emailAddress === log.emailAddress && !l.completed ? { ...l, completed: true } : l
      );
    }
    this.logs.push(newLog);
    await this.save();
    return newLog;
  }

  async updateLog(id: string, updates: Partial<EmailLog>): Promise<void> {
    this.logs = this.logs.map(l => l.id === id ? { ...l, ...updates } : l);
    await this.save();
  }

  async deleteLog(id: string): Promise<void> {
    this.logs = this.logs.filter(l => l.id !== id);
    await this.save();
  }

  async hasReceivedFirstTime(email: string): Promise<boolean> {
    return this.logs.some(l => l.emailAddress === email && l.emailType === 'First-time');
  }

  downloadProjectJSON() {
    const data = {
      companies: this.companies,
      logs: this.logs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'gulfvs_vault.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return;
    const headerSet = new Set<string>();
    data.forEach(obj => Object.keys(obj).forEach(key => headerSet.add(key)));
    const headers = Array.from(headerSet);
    const rows = data.map(obj => 
      headers.map(header => `"${String(obj[header] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const db = new DatabaseService();
