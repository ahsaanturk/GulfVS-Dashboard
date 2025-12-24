
export interface Company {
  id: string;
  companyName: string;
  emails: string[];
  phoneNumber?: string;
  tags?: string[];
  location?: string;
  notes?: string;
  createdAt: number;
  isInterested?: boolean; // New field for response tracking
}

export type EmailType = 'First-time' | 'Follow-up';

export interface EmailLog {
  id: string;
  companyId: string;
  emailAddress: string;
  emailType: EmailType;
  dateSent: number;
  note?: string;
  followUpDate?: number;
  completed: boolean;
}

export interface DashboardMetrics {
  totalCompanies: number;
  emailsToday: number;
  emailsWeek: number;
  emailsMonth: number;
  upcomingFollowUps: number;
  followUpsToday: number;
  overdueFollowUps: number;
  responseRate: number;
}

export enum Page {
  Dashboard = 'dashboard',
  Companies = 'companies',
  Logs = 'logs',
  Analytics = 'analytics',
  Actions = 'actions',
  Settings = 'settings',
  ImportExport = 'import-export'
}

export type UserAccount = 'NehmatU' | 'MateenU';
