
import { Company, EmailLog, AppUser } from './types';

const STORAGE_KEY_COMPANIES = 'gulfvs_companies_v3';
const STORAGE_KEY_LOGS = 'gulfvs_logs_v3';
const STORAGE_KEY_INITIALIZED = 'gulfvs_initialized';
const STORAGE_KEY_USERS = 'gulfvs_users_v1';

class DatabaseService {
  private companies: Company[] = [];
  private logs: EmailLog[] = [];
  private users: AppUser[] = [];
  private remoteAvailable = false;
  private triedRemote = false;
  private apiBase = '';
  private listeners: ((status: boolean) => void)[] = [];

  constructor() {
    this.setupNetworkListeners();
    this.init();
  }

  onStatusChange(callback: (status: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyStatusChange() {
    this.listeners.forEach(l => l(this.remoteAvailable));
  }

  getRemoteStatus(): boolean {
    return this.remoteAvailable;
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', async () => {
        console.log('Network is online. Verifying connection and syncing...');
        this.triedRemote = false; // reset check
        await this.checkRemote();
        this.notifyStatusChange();
        if (this.remoteAvailable) {
          await this.syncToRemote();
        }
      });

      window.addEventListener('offline', () => {
        console.log('Network is offline. Switching to local mode.');
        this.remoteAvailable = false;
        this.notifyStatusChange();
      });
    }
  }

  private async init() {
    await this.checkRemote();
    const initialized = localStorage.getItem(STORAGE_KEY_INITIALIZED);
    const savedCompanies = localStorage.getItem(STORAGE_KEY_COMPANIES);
    const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);

    if (initialized && savedCompanies && savedLogs && savedUsers) {
      this.companies = JSON.parse(savedCompanies);
      this.logs = JSON.parse(savedLogs);
      this.users = JSON.parse(savedUsers);
    } else {
      this.companies = [];
      this.logs = [];
      this.users = [];
      this.save();
    }

    if (this.remoteAvailable) {
      await this.syncToRemote();
    }
    this.startBackgroundSync();
  }

  private async checkRemote() {
    this.triedRemote = true;
    try {
      const res = await fetch(`/api/ping`);
      if (res.ok) {
        this.remoteAvailable = true;
        this.apiBase = '';
      } else {
        const localRes = await fetch('http://localhost:4000/api/ping');
        if (localRes.ok) {
          this.remoteAvailable = true;
          this.apiBase = 'http://localhost:4000';
        }
      }
    } catch (e) {
      try {
        const localRes = await fetch('http://localhost:4000/api/ping');
        if (localRes.ok) {
          this.remoteAvailable = true;
          this.apiBase = 'http://localhost:4000';
        } else {
          this.remoteAvailable = false;
        }
      } catch (ex) {
        this.remoteAvailable = false;
      }
    }
    this.notifyStatusChange();
  }

  private save(skipRemotePush = false) {
    localStorage.setItem(STORAGE_KEY_COMPANIES, JSON.stringify(this.companies));
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs));
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true');

    if (this.remoteAvailable && !skipRemotePush) {
      this.syncToRemote().catch(e => console.warn("Background sync failed", e));
    }
  }

  async syncToRemote() {
    if (!this.remoteAvailable) return;
    try {
      await fetch(`${this.apiBase}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: this.companies, // Mapping companies to contacts collection
          logs: this.logs
        })
      });
    } catch (e) {
      console.warn('Remote sync failed', e);
    }
  }

  /**
   * Enforced Remote Login & Post-Login Pull
   */
  async authenticateUser(username: string, password: string): Promise<AppUser | null> {
    await this.checkRemote();

    if (!this.remoteAvailable) {
      throw new Error("Internet connection required for login.");
    }

    try {
      const res = await fetch(`${this.apiBase}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const body = await res.json();
        const u: AppUser = body.user;

        // Success! Now pull all data from remote to this device
        await this.pullFullSync();

        // If admin, fetch all users. Otherwise, just store self.
        if (u.role === 'admin') {
          await this.syncUsers();
        } else {
          this.users = [u];
          this.save();
        }

        return u;
      }
    } catch (e) {
      console.warn('Remote auth failed', e);
    }
    return null;
  }

  private dataListeners: (() => void)[] = [];
  private syncInterval: any = null;

  onDataChange(callback: () => void) {
    this.dataListeners.push(callback);
    return () => {
      this.dataListeners = this.dataListeners.filter(l => l !== callback);
    };
  }

  private notifyDataChange() {
    this.dataListeners.forEach(l => l());
  }

  /**
   * Starts background processes:
   * 1. Connection Heartbeat (5s) - Rapidly detects status changes
   * 2. Smart Sync (30s) - Syncs data if connected
   */
  startBackgroundSync() {
    if (this.syncInterval) clearInterval(this.syncInterval);

    // 1. Connection Heartbeat (8s)
    setInterval(() => this.checkRemote(), 8000);

    // 2. Data Sync (30s)
    this.syncInterval = setInterval(() => this.smartSync(), 30000);
  }

  async smartSync() {
    if (!this.remoteAvailable || !navigator.onLine) return;

    try {
      const res = await fetch(`${this.apiBase}/api/sync/all`);
      if (res.ok) {
        const data = await res.json();
        const serverContacts = data.contacts || [];
        const serverLogs = data.logs || [];

        // Check for differences to avoid flickering
        const currentDataStr = JSON.stringify({ contacts: this.companies, logs: this.logs });
        const newDataStr = JSON.stringify({ contacts: serverContacts, logs: serverLogs });

        if (currentDataStr !== newDataStr) {
          console.log('Background sync: Data changed, updating UI.');
          this.companies = serverContacts;
          this.logs = serverLogs;
          this.save(true); // Save without triggering another remote push
          this.notifyDataChange();
        }
      }
    } catch (e) {
      console.warn('Background sync check failed', e);
    }
  }

  async pullFullSync() {
    if (!this.remoteAvailable) return;
    try {
      console.log("Pulling full sync from MongoDB...");
      const res = await fetch(`${this.apiBase}/api/sync/all`);
      if (res.ok) {
        const data = await res.json();
        this.companies = data.contacts || [];
        this.logs = data.logs || [];
        this.save();
        this.notifyDataChange(); // Ensure UI updates on initial pull
        console.log("Full sync pulled successfully.");
      }
    } catch (e) {
      console.warn("Full sync pull failed", e);
    }
  }

  // Users API
  async syncUsers() {
    if (!this.remoteAvailable) return;
    try {
      const res = await fetch(`${this.apiBase}/api/users`);
      if (res.ok) {
        const users = await res.json();
        this.users = users;
        this.save();
      }
    } catch (e) {
      console.warn('User sync failed', e);
    }
  }

  async getUsers(): Promise<AppUser[]> {
    return [...this.users];
  }

  async addUser(user: Omit<AppUser, 'id' | 'createdAt'>): Promise<AppUser> {
    const newUser: AppUser = { ...user, id: crypto.randomUUID(), createdAt: Date.now() };
    if (this.remoteAvailable) {
      try {
        await fetch(`${this.apiBase}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });
      } catch { }
    }
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<AppUser>): Promise<void> {
    if (this.remoteAvailable) {
      try {
        await fetch(`${this.apiBase}/api/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch { }
    }
    this.users = this.users.map(u => u.id === id ? { ...u, ...updates } : u);
    this.save();
  }

  async deleteUser(id: string): Promise<void> {
    if (this.remoteAvailable) {
      try { await fetch(`${this.apiBase}/api/users/${id}`, { method: 'DELETE' }); } catch { }
    }
    this.users = this.users.filter(u => u.id !== id);
    this.save();
  }

  // Companies (Contacts) API
  async getCompanies(): Promise<Company[]> {
    if (this.companies.length === 0) await this.init();
    return [...this.companies].sort((a, b) => b.createdAt - a.createdAt);
  }

  async addCompany(company: Omit<Company, 'id' | 'createdAt'>): Promise<Company> {
    const newCompany: Company = { ...company, id: crypto.randomUUID(), createdAt: Date.now() };
    this.companies.push(newCompany);
    this.save();
    return newCompany;
  }

  async bulkAddCompanies(companies: Omit<Company, 'id' | 'createdAt'>[]): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;
    const now = Date.now();
    const existingEmails = new Set(this.companies.flatMap(c => c.emails));
    const newItems: Company[] = [];

    for (const c of companies) {
      if (c.emails.some(e => existingEmails.has(e))) {
        skipped++;
        continue;
      }

      const newCompany: Company = {
        ...c,
        id: crypto.randomUUID(),
        createdAt: now
      };
      this.companies.push(newCompany);
      newItems.push(newCompany);
      c.emails.forEach(e => existingEmails.add(e));
      added++;
    }

    if (added > 0) {
      this.save(true); // Save locally, skip full sync
      await this.batchSync(newItems, []); // Push only new items
    }
    return { added, skipped };
  }

  async batchSync(newContacts: Company[], newLogs: EmailLog[]) {
    if (!this.remoteAvailable || (newContacts.length === 0 && newLogs.length === 0)) return;
    try {
      await fetch(`${this.apiBase}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: newContacts,
          logs: newLogs
        })
      });
    } catch (e) {
      console.warn('Batch sync failed', e);
    }
  }

  async updateCompany(id: string, updates: Partial<Company>): Promise<void> {
    this.companies = this.companies.map(c => c.id === id ? { ...c, ...updates } : c);
    this.save();
  }

  async deleteCompany(id: string): Promise<void> {
    if (this.remoteAvailable) {
      try { await fetch(`${this.apiBase}/api/contacts/${id}`, { method: 'DELETE' }); } catch { }
    }
    this.companies = this.companies.filter(c => c.id !== id);
    this.logs = this.logs.filter(l => l.companyId !== id);
    this.save();
  }

  // Logs API
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
    this.save();
    return newLog;
  }

  async updateLog(id: string, updates: Partial<EmailLog>): Promise<void> {
    if (this.remoteAvailable) {
      try {
        await fetch(`${this.apiBase}/api/logs/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
      } catch { }
    }
    this.logs = this.logs.map(l => l.id === id ? { ...l, ...updates } : l);
    this.save();
  }

  async deleteLog(id: string): Promise<void> {
    if (this.remoteAvailable) {
      try { await fetch(`${this.apiBase}/api/logs/${id}`, { method: 'DELETE' }); } catch { }
    }
    this.logs = this.logs.filter(l => l.id !== id);
    this.save();
  }

  async hasReceivedFirstTime(email: string): Promise<boolean> {
    return this.logs.some(l => l.emailAddress === email && l.emailType === 'First-time');
  }

  async exportToExcel(data: any[], filename: string) {
    if (!data || data.length === 0) {
      alert("No data to export.");
      return;
    }

    // Dynamic import to avoid strict type issues globally if not needed
    // @ts-ignore
    const XLSX = await import('https://esm.sh/xlsx@0.18.5');

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-width calculation
    const columnWidths: { wch: number }[] = [];
    const keys = Object.keys(data[0]);

    keys.forEach(key => {
      let maxLen = key.length;
      data.forEach(row => {
        const val = row[key];
        const len = val ? String(val).length : 0;
        if (len > maxLen) maxLen = len;
      });
      // Cap width at 50 chars to prevent massive columns
      columnWidths.push({ wch: Math.min(maxLen + 2, 50) });
    });

    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GulfVS Data");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}

export const db = new DatabaseService();
